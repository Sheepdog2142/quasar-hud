import * as fs from 'fs';
import * as path from 'path';
import { CLI_DIRS, DEFAULT_CONFIG, tokenLimitForModel, claudeWeeklyTokenLimit } from '../config';
import { readJson, readJsonLines, readGitBranch } from '../utils';
import type { SessionData, MCPServer, ContextModeMCP, WeeklyUsage } from '../types';

// ─── Claude session index entry ───────────────────────────────────────────────

interface ClaudeProjectEntry {
  id: string;
  name?: string;
  path?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Claude settings / config ─────────────────────────────────────────────────

interface ClaudeSettings {
  defaultModel?: string;
  autoCompact?: boolean;
  compactThreshold?: number;
}

interface ClaudeConfig {
  mcpServers?: Record<string, { command: string; type?: string }>;
  // API key intentionally excluded — not needed for HUD
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMCP(configPath: string): { servers: MCPServer[]; contextMode: ContextModeMCP } {
  const servers: MCPServer[] = [];
  let contextMode: ContextModeMCP = { installed: false };
  try {
    const config = readJson<ClaudeConfig>(configPath);
    for (const [name] of Object.entries(config?.mcpServers ?? {})) {
      servers.push({ name, connected: true });
      if (name === 'context-mode') contextMode = { installed: true };
    }
  } catch { /* ignore */ }
  return { servers, contextMode };
}

function findActiveProjectDir(): string | null {
  const projectsDir = path.join(CLI_DIRS.claude, 'projects');
  try {
    const dirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(projectsDir, d.name));
    if (!dirs.length) return null;
    const withMtime = dirs.map(dir => ({ dir, mtime: fs.statSync(dir).mtimeMs }));
    withMtime.sort((a, b) => b.mtime - a.mtime);
    return withMtime[0].dir;
  } catch {
    return null;
  }
}

// ─── Weekly token aggregation ─────────────────────────────────────────────────

interface ClaudeAssistantEvent {
  type: 'assistant';
  timestamp?: string;
  message?: {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}

/**
 * Scans every ~/.claude/projects/ JSONL and sums tokens from assistant events
 * whose timestamp falls within the last `days` days.
 */
export function readClaudeWeeklyUsage(days = 7): WeeklyUsage {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const projectsDir = path.join(CLI_DIRS.claude, 'projects');
  let totalTokens = 0;
  let sessionCount = 0;

  try {
    const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(projectsDir, d.name));

    for (const dir of projectDirs) {
      let files: string[];
      try { files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')); }
      catch { continue; }

      for (const file of files) {
        const filePath = path.join(dir, file);
        // Skip files not modified in the window (fast path)
        try { if (fs.statSync(filePath).mtimeMs < cutoff) continue; }
        catch { continue; }

        let sessionHadTokens = false;
        const lines = readJsonLines<ClaudeAssistantEvent>(filePath);
        for (const line of lines) {
          if (line.type !== 'assistant') continue;
          const ts = line.timestamp ? new Date(line.timestamp).getTime() : NaN;
          if (!isNaN(ts) && ts < cutoff) continue;

          const u = line.message?.usage;
          if (!u) continue;
          totalTokens +=
            (u.input_tokens ?? 0) +
            (u.output_tokens ?? 0) +
            (u.cache_creation_input_tokens ?? 0);
          sessionHadTokens = true;
        }
        if (sessionHadTokens) sessionCount++;
      }
    }
  } catch { /* non-fatal */ }

  return {
    tokensUsed: totalTokens,
    limit: claudeWeeklyTokenLimit(),
    periodDays: days,
    sessionsCount: sessionCount,
  };
}

// ─── Main reader ─────────────────────────────────────────────────────────────

export function readClaudeSession(): SessionData {
  const now = new Date();
  const base: SessionData = { cli: 'claude', lastUpdated: now };

  // settings
  const settings = readJson<ClaudeSettings>(path.join(CLI_DIRS.claude, 'settings.json'));
  base.model = settings?.defaultModel;

  // MCP
  const { servers, contextMode } = parseMCP(path.join(CLI_DIRS.claude, 'config.json'));
  base.mcpServers  = servers;
  base.contextMode = contextMode;

  // Active project
  const projectDir = findActiveProjectDir();
  if (!projectDir) return { ...base, notice: 'No active Claude project found' };

  base.sessionId = path.basename(projectDir);
  base.workingDir = projectDir;

  // Try to find session JSONL files in the project dir
  try {
    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
    if (files.length > 0) {
      const latestFile = files
        .map(f => ({ f, mtime: fs.statSync(path.join(projectDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime)[0].f;

      const lines = readJsonLines<Record<string, unknown>>(path.join(projectDir, latestFile));
      let turnCount = 0;
      let tokensUsed = 0;
      let model: string | undefined;

      for (const line of lines) {
        if (line['type'] === 'user') turnCount++;
        if (line['type'] === 'assistant') {
          const msg = line['message'] as Record<string, unknown> | undefined;
          if (msg?.['model'] && !model) model = String(msg['model']);
          const usage = msg?.['usage'] as Record<string, unknown> | undefined;
          if (usage) {
            tokensUsed += (usage['input_tokens'] as number ?? 0);
            tokensUsed += (usage['output_tokens'] as number ?? 0);
            tokensUsed += (usage['cache_creation_input_tokens'] as number ?? 0);
          }
        }
      }

      base.turnCount = turnCount;
      if (model) base.model = model;

      const limit = tokenLimitForModel(base.model);
      if (tokensUsed > 0) {
        base.tokens = { used: tokensUsed, limit, pct: Math.min(tokensUsed / limit, 1) };
        base.compaction = {
          usedPct: Math.min(tokensUsed / limit, 1),
          warnAt: DEFAULT_CONFIG.compactionWarnAt,
          compactAt: DEFAULT_CONFIG.compactionAutoAt,
        };
      }
    }
  } catch { /* non-fatal */ }

  if (base.workingDir) base.gitBranch = readGitBranch(base.workingDir);

  // 7-day cross-session token aggregation
  base.weeklyUsage = readClaudeWeeklyUsage();

  return base;
}

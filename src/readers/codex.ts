import * as fs from 'fs';
import * as path from 'path';
import { CLI_DIRS, DEFAULT_CONFIG, tokenLimitForModel } from '../config';
import { readTomlFlat, readJsonLines, readGitBranch } from '../utils';
import type { SessionData, MCPServer, ContextModeMCP } from '../types';

// ─── session_index.jsonl entry ───────────────────────────────────────────────

interface CodexSessionEntry {
  id: string;
  thread_name?: string;
  updated_at?: string;
}

// ─── config.toml MCP section detection ───────────────────────────────────────

function parseMCPFromToml(configPath: string): { servers: MCPServer[]; contextMode: ContextModeMCP } {
  const servers: MCPServer[] = [];
  let contextMode: ContextModeMCP = { installed: false };
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const serverMatches = [...raw.matchAll(/\[mcp_servers\.([^\]]+)\]/g)];
    for (const m of serverMatches) {
      const name = m[1];
      servers.push({ name, connected: true });
      if (name === 'context-mode') contextMode = { installed: true };
    }
  } catch { /* ignore */ }
  return { servers, contextMode };
}

// ─── Main reader ─────────────────────────────────────────────────────────────

export function readCodexSession(): SessionData {
  const now = new Date();
  const base: SessionData = { cli: 'codex', lastUpdated: now };

  const configPath = path.join(CLI_DIRS.codex, 'config.toml');
  const toml = readTomlFlat(configPath);
  base.model = toml['model'];

  // MCP servers
  const { servers, contextMode } = parseMCPFromToml(configPath);
  base.mcpServers  = servers;
  base.contextMode = contextMode;

  // Active session from session_index.jsonl (most recent entry)
  const sessionIndexPath = path.join(CLI_DIRS.codex, 'session_index.jsonl');
  const sessions = readJsonLines<CodexSessionEntry>(sessionIndexPath);
  if (sessions.length > 0) {
    const latest = sessions[sessions.length - 1];
    base.sessionId   = latest.id;
    base.sessionName = latest.thread_name?.trim() || latest.id.slice(0, 8);
  }

  // Global state for working dir
  try {
    const globalStatePath = path.join(CLI_DIRS.codex, '.codex-global-state.json');
    const gs = JSON.parse(fs.readFileSync(globalStatePath, 'utf-8')) as Record<string, unknown>;
    const roots = gs['active-workspace-roots'] as string[] | undefined;
    if (roots?.length) {
      base.workingDir = roots[0];
      base.gitBranch = readGitBranch(roots[0]);
    }
  } catch { /* ignore */ }

  // Token data lives in logs_1.sqlite — SQLite reading is deferred.
  // Set compaction thresholds using model defaults so the bar renders.
  const limit = tokenLimitForModel(base.model);
  base.compaction = {
    usedPct:   0,
    warnAt:    DEFAULT_CONFIG.compactionWarnAt,
    compactAt: DEFAULT_CONFIG.compactionAutoAt,
  };

  // Rough token estimate: check size of SQLite WAL as a proxy for session activity
  try {
    const walPath = path.join(CLI_DIRS.codex, 'logs_1.sqlite-wal');
    const walSize = fs.statSync(walPath).size;
    // Very rough heuristic: ~50 bytes per token in WAL
    const roughTokens = Math.round(walSize / 50);
    const capped = Math.min(roughTokens, limit);
    base.tokens = { used: capped, limit, pct: capped / limit };
    base.compaction.usedPct = capped / limit;
    base.notice = 'Token count estimated (SQLite WAL heuristic; connect context-mode for accuracy)';
  } catch { /* no WAL = no active session */ }

  return base;
}

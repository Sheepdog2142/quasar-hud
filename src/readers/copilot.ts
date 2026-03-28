import * as fs from 'fs';
import * as path from 'path';
import { CLI_DIRS, DEFAULT_CONFIG, tokenLimitForModel, copilotMonthlyRequestLimit } from '../config';
import { readYaml, readJsonLines, isPidAlive, readGitBranch } from '../utils';
import type { SessionData, CLIMode, MCPServer, ContextModeMCP, RequestsInfo } from '../types';

// ─── Copilot events.jsonl event types ────────────────────────────────────────

interface SessionStartEvent {
  type: 'session.start';
  data: {
    sessionId: string;
    copilotVersion?: string;
    startTime: string;
    context?: { cwd?: string };
  };
  timestamp: string;
}

interface AssistantMessageEvent {
  type: 'assistant.message';
  data: {
    messageId: string;
    outputTokens?: number;
    model?: string;
    interactionId?: string;
  };
  timestamp: string;
}

interface UserMessageEvent {
  type: 'user.message';
  data: { messageId: string };
  timestamp: string;
}

type CopilotEvent = SessionStartEvent | AssistantMessageEvent | UserMessageEvent | { type: string; data: unknown; timestamp: string };

// ─── workspace.yaml shape ────────────────────────────────────────────────────

interface WorkspaceYaml {
  id: string;
  cwd: string;
  summary?: string;
  summary_count?: number;
  created_at?: string;
  updated_at?: string;
  /** CLI mode hint stored by some Copilot versions (e.g. 'plan', 'autopilot') */
  mode?: string;
  type?: string;
}

// ─── MCP config shape ────────────────────────────────────────────────────────

interface MCPConfig {
  mcpServers?: Record<string, { command: string; type?: string }>;
  servers?: Record<string, { command: string; type?: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Find the session directory whose inuse lock is still alive */
function findActiveSessionDir(): string | null {
  const stateDir = path.join(CLI_DIRS.copilot, 'session-state');
  try {
    const sessionDirs = fs.readdirSync(stateDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(stateDir, d.name));

    for (const dir of sessionDirs) {
      try {
        const locks = fs.readdirSync(dir).filter(f => f.startsWith('inuse.') && f.endsWith('.lock'));
        for (const lock of locks) {
          const pidStr = lock.replace('inuse.', '').replace('.lock', '');
          const pid = parseInt(pidStr, 10);
          if (!isNaN(pid) && isPidAlive(pid)) return dir;
        }
      } catch { /* skip inaccessible dirs */ }
    }

    // Fallback: most recently modified session dir
    const withMtime = sessionDirs.map(dir => ({
      dir,
      mtime: fs.statSync(dir).mtimeMs,
    })).sort((a, b) => b.mtime - a.mtime);
    return withMtime[0]?.dir ?? null;
  } catch {
    return null;
  }
}

function parseMCPConfig(configPath: string): { servers: MCPServer[]; contextMode: ContextModeMCP } {
  const servers: MCPServer[] = [];
  let contextMode: ContextModeMCP = { installed: false };

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw) as MCPConfig;
    const serverMap = config.mcpServers ?? config.servers ?? {};
    for (const [name] of Object.entries(serverMap)) {
      servers.push({ name, connected: true });
      if (name === 'context-mode') contextMode = { installed: true };
    }
  } catch { /* config may not exist */ }

  return { servers, contextMode };
}

// ─── Monthly request counter ──────────────────────────────────────────────────

/**
 * Counts user.message events across ALL Copilot sessions since the first of
 * the current calendar month. Each user message represents one premium request.
 */
function readMonthlyRequests(): RequestsInfo {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stateDir = path.join(CLI_DIRS.copilot, 'session-state');
  let totalRequests = 0;

  try {
    const sessionDirs = fs.readdirSync(stateDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(stateDir, d.name));

    for (const dir of sessionDirs) {
      const eventsPath = path.join(dir, 'events.jsonl');
      if (!fs.existsSync(eventsPath)) continue;
      // Quick mtime guard — skip sessions not touched since period start
      if (fs.statSync(eventsPath).mtimeMs < periodStart.getTime()) continue;

      const events = readJsonLines<{ type: string; timestamp?: string }>(eventsPath);
      for (const evt of events) {
        if (evt.type !== 'user.message') continue;
        if (!evt.timestamp) continue;  // skip events with missing timestamps to avoid false counts
        const ts = new Date(evt.timestamp);
        if (!isNaN(ts.getTime()) && ts >= periodStart) totalRequests++;
      }
    }
  } catch { /* non-fatal */ }

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  return {
    usedThisPeriod: totalRequests,
    periodStart,
    limit: copilotMonthlyRequestLimit(),
    periodLabel: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
  };
}

// ─── Main reader ─────────────────────────────────────────────────────────────

export function readCopilotSession(): SessionData {
  const now = new Date();
  const base: SessionData = { cli: 'copilot', lastUpdated: now };

  const sessionDir = findActiveSessionDir();
  if (!sessionDir) return { ...base, notice: 'No active Copilot session found' };

  // workspace.yaml → session identity + mode hint
  const workspace = readYaml<WorkspaceYaml>(path.join(sessionDir, 'workspace.yaml'));
  if (workspace) {
    base.sessionId   = workspace.id;
    base.sessionName = workspace.summary?.trim() || workspace.id.slice(0, 8);
    base.workingDir  = workspace.cwd;
    base.startedAt   = workspace.created_at ? new Date(workspace.created_at) : undefined;
    if (workspace.cwd) base.gitBranch = readGitBranch(workspace.cwd);
    // Some Copilot versions store the mode in workspace.yaml
    const rawMode = (workspace.mode ?? workspace.type ?? '').toLowerCase();
    if (rawMode.includes('plan'))      base.mode = 'plan';
    else if (rawMode.includes('auto')) base.mode = 'autopilot';
  }

  // events.jsonl → tokens + model + turn count + mode detection
  const events = readJsonLines<CopilotEvent>(path.join(sessionDir, 'events.jsonl'));

  let outputTokensTotal = 0;
  let turnCount = 0;
  let model: string | undefined;
  let mode: CLIMode = base.mode ?? 'interactive';

  for (const evt of events) {
    if (evt.type === 'session.start') {
      const e = evt as SessionStartEvent;
      if (e.data.context?.cwd && !base.workingDir) base.workingDir = e.data.context.cwd;
    } else if (evt.type === 'assistant.message') {
      const e = evt as AssistantMessageEvent;
      outputTokensTotal += e.data.outputTokens ?? 0;
      if (e.data.model && !model) model = e.data.model;
    } else if (evt.type === 'tool.execution_complete') {
      const e = evt as { type: string; data: { model?: string } };
      if (e.data.model && !model) model = e.data.model;
    } else if (evt.type === 'assistant.turn_start') {
      const e = evt as { type: string; data: { model?: string } };
      if (e.data.model && !model) model = e.data.model;
    } else if (evt.type === 'user.message') {
      turnCount++;
    } else {
      // Detect plan / autopilot mode from event type prefixes
      const t = evt.type.toLowerCase();
      if (mode === 'interactive') {
        if (t.startsWith('plan.') || t === 'plan_created' || t === 'plan_started') {
          mode = 'plan';
        } else if (t.startsWith('autopilot.') || t.startsWith('agent.') || t.startsWith('autonomous.')) {
          mode = 'autopilot';
        }
      }
    }
  }

  base.model     = model;
  base.mode      = mode;
  base.turnCount = turnCount;

  const limit = tokenLimitForModel(model);
  if (outputTokensTotal > 0) {
    base.tokens = {
      used: outputTokensTotal,
      limit,
      pct: Math.min(outputTokensTotal / limit, 1),
    };
    base.compaction = {
      usedPct:   Math.min(outputTokensTotal / limit, 1),
      warnAt:    DEFAULT_CONFIG.compactionWarnAt,
      compactAt: DEFAULT_CONFIG.compactionAutoAt,
    };
  }

  // MCP servers from ~/.copilot/mcp.json or config.json
  const mcpConfigPath = path.join(CLI_DIRS.copilot, 'mcp.json');
  const fallbackConfigPath = path.join(CLI_DIRS.copilot, 'config.json');
  const mcpFile = fs.existsSync(mcpConfigPath) ? mcpConfigPath : fallbackConfigPath;
  const { servers, contextMode } = parseMCPConfig(mcpFile);
  base.mcpServers  = servers;
  base.contextMode = contextMode;

  // Monthly request counter (reads all session JSONL files)
  base.requests = readMonthlyRequests();

  return base;
}

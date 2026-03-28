// ─── CLI identification ────────────────────────────────────────────────────────

export type CLIName = 'copilot' | 'claude' | 'codex' | 'unknown';
export type CLIMode = 'interactive' | 'plan' | 'autopilot' | 'unknown';

// ─── MCP ──────────────────────────────────────────────────────────────────────

export interface MCPServer {
  name: string;
  connected: boolean;
  type?: string;
}

/** State of the context-mode MCP server (token compression tool) */
export interface ContextModeMCP {
  installed: boolean;
  /** Estimated tokens saved in this session via context compression */
  tokensSaved?: number;
  /** Number of compressions performed this session */
  compressionCount?: number;
}

// ─── Copilot request tracking ────────────────────────────────────────────────

export interface RequestsInfo {
  /** Number of user turns / premium requests in the current billing period */
  usedThisPeriod: number;
  /** Start of current billing period (first of the month) */
  periodStart: Date;
  /** Monthly request ceiling — set via COPILOT_MONTHLY_REQUESTS env var */
  limit?: number;
  /** Human-readable label, e.g. "March 2026" */
  periodLabel: string;
}

// ─── Claude weekly usage ──────────────────────────────────────────────────────

export interface WeeklyUsage {
  /** Total tokens consumed across all sessions in the past N days */
  tokensUsed: number;
  /** Optional cap — set via CLAUDE_WEEKLY_TOKENS env var */
  limit?: number;
  /** Lookback window in days (default 7) */
  periodDays: number;
  /** Number of distinct sessions found in that window */
  sessionsCount: number;
}

// ─── Token & compaction ───────────────────────────────────────────────────────

export interface TokenUsage {
  /** Total tokens consumed (input + output) in this session */
  used: number;
  /** Hard context window ceiling for the current model */
  limit: number;
  /** 0–1 fraction */
  pct: number;
}

export interface CompactionInfo {
  /** 0–1 fraction of context window used */
  usedPct: number;
  /** Fraction at which a warning fires (default 0.60) */
  warnAt: number;
  /** Fraction at which auto-compaction triggers (default 0.80) */
  compactAt: number;
}

// ─── Core session data ────────────────────────────────────────────────────────

export interface SessionData {
  cli: CLIName;

  // identity
  sessionId?: string;
  sessionName?: string;
  model?: string;
  mode?: CLIMode;

  // metrics
  turnCount?: number;
  tokens?: TokenUsage;
  compaction?: CompactionInfo;
  /** Copilot: monthly premium-request counter */
  requests?: RequestsInfo;
  /** Claude: 7-day cross-session token aggregation */
  weeklyUsage?: WeeklyUsage;

  // MCP
  mcpServers?: MCPServer[];
  contextMode?: ContextModeMCP;

  // context
  workingDir?: string;
  gitBranch?: string;
  startedAt?: Date;

  /** Timestamp of last successful read */
  lastUpdated: Date;
  /** Non-fatal warning or parse note for the HUD footer */
  notice?: string;
}

// ─── HUD configuration ────────────────────────────────────────────────────────

export interface HUDConfig {
  cli: CLIName;
  refreshIntervalMs: number;
  compactionWarnAt: number;    // fraction, e.g. 0.60
  compactionAutoAt: number;    // fraction, e.g. 0.80
  showElapsedTime: boolean;
  showGitBranch: boolean;
  showTurnCount: boolean;
  /** Copilot: count and display monthly requests (reads all session JSONL files) */
  showRequests: boolean;
  /** Claude: aggregate and display 7-day token burn rate */
  showWeeklyUsage: boolean;
}

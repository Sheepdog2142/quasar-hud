import * as os from 'os';
import * as path from 'path';
import type { HUDConfig } from './types';

export const HOME = os.homedir();

export const CLI_DIRS = {
  copilot: path.join(HOME, '.copilot'),
  claude:  path.join(HOME, '.claude'),
  codex:   path.join(HOME, '.codex'),
} as const;

/** Context window limits by model substring (lower-cased matching) */
export const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'claude-sonnet':   200_000,
  'claude-opus':     200_000,
  'claude-haiku':    200_000,
  'gpt-5':           128_000,
  'gpt-4o':          128_000,
  'gpt-4':           128_000,
  'o1':              200_000,
  'o3':              200_000,
  default:           128_000,
};

export function tokenLimitForModel(model?: string): number {
  if (!model) return MODEL_TOKEN_LIMITS['default'];
  const m = model.toLowerCase();
  for (const [key, limit] of Object.entries(MODEL_TOKEN_LIMITS)) {
    if (key !== 'default' && m.includes(key)) return limit;
  }
  return MODEL_TOKEN_LIMITS['default'];
}

export const DEFAULT_CONFIG: HUDConfig = {
  cli:              'unknown',
  refreshIntervalMs: 2_000,
  compactionWarnAt:  0.60,
  compactionAutoAt:  0.80,
  showElapsedTime:  true,
  showGitBranch:    true,
  showTurnCount:    true,
  showRequests:     true,
  showWeeklyUsage:  true,
};

// ─── Per-feature env-var limits ───────────────────────────────────────────────

/** Monthly Copilot premium-request ceiling (env: COPILOT_MONTHLY_REQUESTS) */
export function copilotMonthlyRequestLimit(): number | undefined {
  const v = process.env['COPILOT_MONTHLY_REQUESTS'];
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) || n <= 0 ? undefined : n;
}

/** 7-day Claude token budget ceiling (env: CLAUDE_WEEKLY_TOKENS) */
export function claudeWeeklyTokenLimit(): number | undefined {
  const v = process.env['CLAUDE_WEEKLY_TOKENS'];
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) || n <= 0 ? undefined : n;
}

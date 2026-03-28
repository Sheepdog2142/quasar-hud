import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import type { HUDConfig, CostEstimate } from './types';

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
  // Sort by key length descending so more-specific keys (e.g. 'gpt-4o') match
  // before shorter overlapping keys (e.g. 'gpt-4').
  const keys = Object.keys(MODEL_TOKEN_LIMITS)
    .filter(k => k !== 'default')
    .sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (m.includes(key)) return MODEL_TOKEN_LIMITS[key]!;
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

// ─── Model pricing ────────────────────────────────────────────────────────────

interface ModelPricing {
  inputPerM: number;        // USD per million input tokens
  outputPerM: number;       // USD per million output tokens
  cacheWritePerM?: number;  // USD per million cache-creation tokens
  cacheReadPerM?: number;   // USD per million cache-read tokens
}

/** Published per-token pricing by model substring (lower-cased matching) */
const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus':   { inputPerM: 15,    outputPerM: 75,   cacheWritePerM: 18.75, cacheReadPerM: 1.50 },
  'claude-sonnet': { inputPerM: 3,     outputPerM: 15,   cacheWritePerM: 3.75,  cacheReadPerM: 0.30 },
  'claude-haiku':  { inputPerM: 0.80,  outputPerM: 4,    cacheWritePerM: 1.00,  cacheReadPerM: 0.08 },
  'gpt-5':         { inputPerM: 10,    outputPerM: 30 },
  'gpt-4o':        { inputPerM: 2.50,  outputPerM: 10 },
  'gpt-4':         { inputPerM: 2.50,  outputPerM: 10 },
  'o3':            { inputPerM: 10,    outputPerM: 40 },
  'o1':            { inputPerM: 15,    outputPerM: 60 },
};

function pricingForModel(model?: string): ModelPricing | null {
  if (!model) return null;
  const m = model.toLowerCase();
  // Longest key wins to avoid 'gpt-4' matching before 'gpt-4o'
  const keys = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (m.includes(key)) return MODEL_PRICING[key]!;
  }
  return null;
}

export function computeCost(
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number,
  cacheReadTokens: number,
  model?: string,
): CostEstimate | undefined {
  const pricing = pricingForModel(model);
  if (!pricing) return undefined;

  const totalUsd =
    (inputTokens        / 1_000_000) * pricing.inputPerM +
    (outputTokens       / 1_000_000) * pricing.outputPerM +
    (cacheCreationTokens / 1_000_000) * (pricing.cacheWritePerM ?? 0) +
    (cacheReadTokens    / 1_000_000) * (pricing.cacheReadPerM  ?? 0);

  return { totalUsd, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, model: model ?? '' };
}

// ─── Config file (~/.qhud.json) ───────────────────────────────────────────────

/**
 * Load persistent user preferences from ~/.qhud.json.
 * Also injects copilotMonthlyRequests / claudeWeeklyTokens into process.env
 * so the limit helper functions pick them up.
 *
 * Merge order:  DEFAULT_CONFIG  <  config file  <  CLI args
 */
export function loadConfigFile(): Partial<HUDConfig> {
  const configPath = path.join(HOME, '.qhud.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const p = JSON.parse(raw) as Record<string, unknown>;
    const result: Partial<HUDConfig> = {};

    if (typeof p['refreshIntervalMs'] === 'number' && p['refreshIntervalMs'] >= 500)
      result.refreshIntervalMs = p['refreshIntervalMs'] as number;

    if (typeof p['compactionWarnAt'] === 'number' && p['compactionWarnAt'] >= 0 && p['compactionWarnAt'] <= 1)
      result.compactionWarnAt = p['compactionWarnAt'] as number;

    if (typeof p['compactionAutoAt'] === 'number' && p['compactionAutoAt'] >= 0 && p['compactionAutoAt'] <= 1)
      result.compactionAutoAt = p['compactionAutoAt'] as number;

    for (const flag of ['showElapsedTime','showGitBranch','showTurnCount','showRequests','showWeeklyUsage'] as const) {
      if (typeof p[flag] === 'boolean') result[flag] = p[flag] as boolean;
    }

    // Inject limits into env so copilotMonthlyRequestLimit() / claudeWeeklyTokenLimit() see them
    if (typeof p['copilotMonthlyRequests'] === 'number' && !process.env['COPILOT_MONTHLY_REQUESTS'])
      process.env['COPILOT_MONTHLY_REQUESTS'] = String(p['copilotMonthlyRequests']);

    if (typeof p['claudeWeeklyTokens'] === 'number' && !process.env['CLAUDE_WEEKLY_TOKENS'])
      process.env['CLAUDE_WEEKLY_TOKENS'] = String(p['claudeWeeklyTokens']);

    return result;
  } catch {
    return {}; // file absent or malformed — silently use defaults
  }
}

import type { HUDConfig, CostEstimate, CLIName } from './types';
export declare const HOME: string;
export declare const CLI_DIRS: {
    readonly copilot: string;
    readonly claude: string;
    readonly codex: string;
};
/** Context window limits by model substring (lower-cased matching) */
export declare const MODEL_TOKEN_LIMITS: Record<string, number>;
export declare function tokenLimitForModel(model?: string): number;
export declare const DEFAULT_CONFIG: HUDConfig;
/** Returns filesystem paths the HUD should watch for live changes (for chokidar). */
export declare function getWatchPaths(cli: CLIName): string[];
/** Monthly Copilot premium-request ceiling (env: COPILOT_MONTHLY_REQUESTS) */
export declare function copilotMonthlyRequestLimit(): number | undefined;
/** 7-day Claude token budget ceiling (env: CLAUDE_WEEKLY_TOKENS) */
export declare function claudeWeeklyTokenLimit(): number | undefined;
export declare function computeCost(inputTokens: number, outputTokens: number, cacheCreationTokens: number, cacheReadTokens: number, model?: string): CostEstimate | undefined;
/**
 * Load persistent user preferences from ~/.qhud.json.
 * Also injects copilotMonthlyRequests / claudeWeeklyTokens into process.env
 * so the limit helper functions pick them up.
 *
 * Merge order:  DEFAULT_CONFIG  <  config file  <  CLI args
 */
export declare function loadConfigFile(): Partial<HUDConfig>;

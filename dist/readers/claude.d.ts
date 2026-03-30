import type { SessionData, WeeklyUsage } from '../types';
/**
 * Scans every ~/.claude/projects/ JSONL and sums tokens from assistant events
 * whose timestamp falls within the last `days` days.
 */
export declare function readClaudeWeeklyUsage(days?: number): WeeklyUsage;
export declare function readClaudeSession(): SessionData;

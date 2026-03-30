"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readClaudeWeeklyUsage = readClaudeWeeklyUsage;
exports.readClaudeSession = readClaudeSession;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../config");
const utils_1 = require("../utils");
// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseMCP(configPath) {
    const servers = [];
    let contextMode = { installed: false };
    try {
        const config = (0, utils_1.readJson)(configPath);
        for (const [name] of Object.entries(config?.mcpServers ?? {})) {
            servers.push({ name, connected: true });
            if (name === 'context-mode')
                contextMode = { installed: true };
        }
    }
    catch { /* ignore */ }
    return { servers, contextMode };
}
function findActiveProjectDir() {
    const projectsDir = path.join(config_1.CLI_DIRS.claude, 'projects');
    try {
        const dirs = fs.readdirSync(projectsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(projectsDir, d.name));
        if (!dirs.length)
            return null;
        const withMtime = dirs.map(dir => ({ dir, mtime: fs.statSync(dir).mtimeMs }));
        withMtime.sort((a, b) => b.mtime - a.mtime);
        return withMtime[0].dir;
    }
    catch {
        return null;
    }
}
/**
 * Scans every ~/.claude/projects/ JSONL and sums tokens from assistant events
 * whose timestamp falls within the last `days` days.
 */
function readClaudeWeeklyUsage(days = 7) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const projectsDir = path.join(config_1.CLI_DIRS.claude, 'projects');
    let totalTokens = 0;
    let sessionCount = 0;
    try {
        const projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(projectsDir, d.name));
        for (const dir of projectDirs) {
            let files;
            try {
                files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
            }
            catch {
                continue;
            }
            // Count sessions at the project-directory level, not per-file.
            // A single project may have multiple JSONL files (history splits, etc.)
            let projectHadTokens = false;
            for (const file of files) {
                const filePath = path.join(dir, file);
                // Skip files not modified in the window (fast path)
                try {
                    if (fs.statSync(filePath).mtimeMs < cutoff)
                        continue;
                }
                catch {
                    continue;
                }
                const lines = (0, utils_1.readJsonLines)(filePath);
                for (const line of lines) {
                    if (line.type !== 'assistant')
                        continue;
                    const ts = line.timestamp ? new Date(line.timestamp).getTime() : NaN;
                    if (!isNaN(ts) && ts < cutoff)
                        continue;
                    const u = line.message?.usage;
                    if (!u)
                        continue;
                    totalTokens +=
                        (u.input_tokens ?? 0) +
                            (u.output_tokens ?? 0) +
                            (u.cache_creation_input_tokens ?? 0) +
                            (u.cache_read_input_tokens ?? 0); // include cache reads (charged at ~10%)
                    projectHadTokens = true;
                }
            }
            if (projectHadTokens)
                sessionCount++;
        }
    }
    catch { /* non-fatal */ }
    return {
        tokensUsed: totalTokens,
        limit: (0, config_1.claudeWeeklyTokenLimit)(),
        periodDays: days,
        sessionsCount: sessionCount,
    };
}
// ─── Main reader ─────────────────────────────────────────────────────────────
function readClaudeSession() {
    const now = new Date();
    const base = { cli: 'claude', lastUpdated: now };
    // settings
    const settings = (0, utils_1.readJson)(path.join(config_1.CLI_DIRS.claude, 'settings.json'));
    base.model = settings?.defaultModel;
    // MCP
    const { servers, contextMode } = parseMCP(path.join(config_1.CLI_DIRS.claude, 'config.json'));
    base.mcpServers = servers;
    base.contextMode = contextMode;
    // Active project
    const projectDir = findActiveProjectDir();
    if (!projectDir)
        return { ...base, notice: 'No active Claude project found' };
    base.sessionId = path.basename(projectDir);
    base.workingDir = projectDir;
    // Try to find session JSONL files in the project dir
    try {
        const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
        if (files.length > 0) {
            const latestFile = files
                .map(f => ({ f, mtime: fs.statSync(path.join(projectDir, f)).mtimeMs }))
                .sort((a, b) => b.mtime - a.mtime)[0].f;
            const lines = (0, utils_1.readJsonLines)(path.join(projectDir, latestFile));
            let turnCount = 0;
            // Last-turn tracking: input_tokens on the most recent assistant event ≈ current context window size.
            let lastInputTokens = 0;
            let lastOutputTokens = 0;
            let lastCacheReadTokens = 0;
            // Cumulative tracking: used for session cost estimation.
            let cumInputTokens = 0;
            let cumOutputTokens = 0;
            let cumCacheCreationTokens = 0;
            let cumCacheReadTokens = 0;
            let model;
            for (const line of lines) {
                if (line['type'] === 'user')
                    turnCount++;
                if (line['type'] === 'assistant') {
                    const msg = line['message'];
                    if (msg?.['model'] && !model)
                        model = String(msg['model']);
                    const usage = msg?.['usage'];
                    if (usage) {
                        const inp = (usage['input_tokens'] ?? 0);
                        const out = (usage['output_tokens'] ?? 0);
                        const cacheWrite = (usage['cache_creation_input_tokens'] ?? 0);
                        const cacheRead = (usage['cache_read_input_tokens'] ?? 0);
                        // Accumulate for cost
                        cumInputTokens += inp;
                        cumOutputTokens += out;
                        cumCacheCreationTokens += cacheWrite;
                        cumCacheReadTokens += cacheRead;
                        // Track last turn for context-window bar
                        if (inp > 0) {
                            lastInputTokens = inp;
                            lastOutputTokens = out;
                            lastCacheReadTokens = cacheRead;
                        }
                    }
                }
            }
            // Current context = what was sent to model on the last turn (cached + uncached input + output)
            const tokensUsed = lastInputTokens + lastCacheReadTokens + lastOutputTokens;
            base.turnCount = turnCount;
            if (model)
                base.model = model;
            const limit = (0, config_1.tokenLimitForModel)(base.model);
            if (tokensUsed > 0) {
                base.tokens = { used: tokensUsed, limit, pct: Math.min(tokensUsed / limit, 1) };
                base.compaction = {
                    usedPct: Math.min(tokensUsed / limit, 1),
                    warnAt: config_1.DEFAULT_CONFIG.compactionWarnAt,
                    compactAt: config_1.DEFAULT_CONFIG.compactionAutoAt,
                };
            }
            // Session cost estimate from cumulative token counts
            if (cumInputTokens + cumOutputTokens > 0) {
                base.costEstimate = (0, config_1.computeCost)(cumInputTokens, cumOutputTokens, cumCacheCreationTokens, cumCacheReadTokens, base.model);
            }
        }
    }
    catch { /* non-fatal */ }
    if (base.workingDir)
        base.gitBranch = (0, utils_1.readGitBranch)(base.workingDir);
    // 7-day cross-session token aggregation
    base.weeklyUsage = readClaudeWeeklyUsage();
    return base;
}
//# sourceMappingURL=claude.js.map
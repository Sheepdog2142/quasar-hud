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
exports.readCodexSession = readCodexSession;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../config");
const utils_1 = require("../utils");
// ─── config.toml MCP section detection ───────────────────────────────────────
function parseMCPFromToml(configPath) {
    const servers = [];
    let contextMode = { installed: false };
    try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const serverMatches = [...raw.matchAll(/\[mcp_servers\.([^\]]+)\]/g)];
        for (const m of serverMatches) {
            const name = m[1];
            servers.push({ name, connected: true });
            if (name === 'context-mode')
                contextMode = { installed: true };
        }
    }
    catch { /* ignore */ }
    return { servers, contextMode };
}
// ─── Main reader ─────────────────────────────────────────────────────────────
function readCodexSession() {
    const now = new Date();
    const base = { cli: 'codex', lastUpdated: now };
    const configPath = path.join(config_1.CLI_DIRS.codex, 'config.toml');
    const toml = (0, utils_1.readTomlFlat)(configPath);
    base.model = toml['model'];
    // MCP servers
    const { servers, contextMode } = parseMCPFromToml(configPath);
    base.mcpServers = servers;
    base.contextMode = contextMode;
    // Active session from session_index.jsonl (most recent entry)
    const sessionIndexPath = path.join(config_1.CLI_DIRS.codex, 'session_index.jsonl');
    const sessions = (0, utils_1.readJsonLines)(sessionIndexPath);
    if (sessions.length > 0) {
        const latest = sessions[sessions.length - 1];
        base.sessionId = latest.id;
        base.sessionName = latest.thread_name?.trim() || latest.id.slice(0, 8);
    }
    // Global state for working dir
    try {
        const globalStatePath = path.join(config_1.CLI_DIRS.codex, '.codex-global-state.json');
        const gs = JSON.parse(fs.readFileSync(globalStatePath, 'utf-8'));
        const roots = gs['active-workspace-roots'];
        if (roots?.length) {
            base.workingDir = roots[0];
            base.gitBranch = (0, utils_1.readGitBranch)(roots[0]);
        }
    }
    catch { /* ignore */ }
    // Token data lives in logs_1.sqlite — SQLite reading is deferred.
    // Set compaction thresholds using model defaults so the bar renders.
    const limit = (0, config_1.tokenLimitForModel)(base.model);
    base.compaction = {
        usedPct: 0,
        warnAt: config_1.DEFAULT_CONFIG.compactionWarnAt,
        compactAt: config_1.DEFAULT_CONFIG.compactionAutoAt,
    };
    // Rough token estimate: check size of SQLite WAL as a proxy for session activity
    try {
        const walPath = path.join(config_1.CLI_DIRS.codex, 'logs_1.sqlite-wal');
        const walSize = fs.statSync(walPath).size;
        // Very rough heuristic: ~50 bytes per token in WAL
        const roughTokens = Math.round(walSize / 50);
        const capped = Math.min(roughTokens, limit);
        base.tokens = { used: capped, limit, pct: capped / limit };
        base.compaction.usedPct = capped / limit;
        base.notice = 'Token count estimated (SQLite WAL heuristic; connect context-mode for accuracy)';
    }
    catch { /* no WAL = no active session */ }
    return base;
}
//# sourceMappingURL=codex.js.map
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
exports.readCopilotSession = readCopilotSession;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../config");
const utils_1 = require("../utils");
// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Find the session directory whose inuse lock is still alive */
function findActiveSessionDir() {
    const stateDir = path.join(config_1.CLI_DIRS.copilot, 'session-state');
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
                    if (!isNaN(pid) && (0, utils_1.isPidAlive)(pid))
                        return dir;
                }
            }
            catch { /* skip inaccessible dirs */ }
        }
        // Fallback: most recently modified session dir
        const withMtime = sessionDirs.map(dir => ({
            dir,
            mtime: fs.statSync(dir).mtimeMs,
        })).sort((a, b) => b.mtime - a.mtime);
        return withMtime[0]?.dir ?? null;
    }
    catch {
        return null;
    }
}
function parseMCPConfig(configPath) {
    const servers = [];
    let contextMode = { installed: false };
    try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(raw);
        const serverMap = config.mcpServers ?? config.servers ?? {};
        for (const [name] of Object.entries(serverMap)) {
            servers.push({ name, connected: true });
            if (name === 'context-mode')
                contextMode = { installed: true };
        }
    }
    catch { /* config may not exist */ }
    return { servers, contextMode };
}
// ─── Monthly request counter ──────────────────────────────────────────────────
/**
 * Counts user.message events across ALL Copilot sessions since the first of
 * the current calendar month. Each user message represents one premium request.
 */
function readMonthlyRequests() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const stateDir = path.join(config_1.CLI_DIRS.copilot, 'session-state');
    let totalRequests = 0;
    try {
        const sessionDirs = fs.readdirSync(stateDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(stateDir, d.name));
        for (const dir of sessionDirs) {
            const eventsPath = path.join(dir, 'events.jsonl');
            if (!fs.existsSync(eventsPath))
                continue;
            // Quick mtime guard — skip sessions not touched since period start
            if (fs.statSync(eventsPath).mtimeMs < periodStart.getTime())
                continue;
            const events = (0, utils_1.readJsonLines)(eventsPath);
            for (const evt of events) {
                if (evt.type !== 'user.message')
                    continue;
                if (!evt.timestamp)
                    continue; // skip events with missing timestamps to avoid false counts
                const ts = new Date(evt.timestamp);
                if (!isNaN(ts.getTime()) && ts >= periodStart)
                    totalRequests++;
            }
        }
    }
    catch { /* non-fatal */ }
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return {
        usedThisPeriod: totalRequests,
        periodStart,
        limit: (0, config_1.copilotMonthlyRequestLimit)(),
        periodLabel: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
    };
}
// ─── Main reader ─────────────────────────────────────────────────────────────
function readCopilotSession() {
    const now = new Date();
    const base = { cli: 'copilot', lastUpdated: now };
    const sessionDir = findActiveSessionDir();
    if (!sessionDir)
        return { ...base, notice: 'No active Copilot session found' };
    // workspace.yaml → session identity + mode hint
    const workspace = (0, utils_1.readYaml)(path.join(sessionDir, 'workspace.yaml'));
    if (workspace) {
        base.sessionId = workspace.id;
        base.sessionName = workspace.summary?.trim() || workspace.id.slice(0, 8);
        base.workingDir = workspace.cwd;
        base.startedAt = workspace.created_at ? new Date(workspace.created_at) : undefined;
        if (workspace.cwd)
            base.gitBranch = (0, utils_1.readGitBranch)(workspace.cwd);
        // Some Copilot versions store the mode in workspace.yaml
        const rawMode = (workspace.mode ?? workspace.type ?? '').toLowerCase();
        if (rawMode.includes('plan'))
            base.mode = 'plan';
        else if (rawMode.includes('auto'))
            base.mode = 'autopilot';
    }
    // events.jsonl → tokens + model + turn count + mode detection
    const events = (0, utils_1.readJsonLines)(path.join(sessionDir, 'events.jsonl'));
    let outputTokensTotal = 0;
    let turnCount = 0;
    let model;
    let mode = base.mode ?? 'interactive';
    for (const evt of events) {
        if (evt.type === 'session.start') {
            const e = evt;
            if (e.data.context?.cwd && !base.workingDir)
                base.workingDir = e.data.context.cwd;
        }
        else if (evt.type === 'assistant.message') {
            const e = evt;
            outputTokensTotal += e.data.outputTokens ?? 0;
            if (e.data.model && !model)
                model = e.data.model;
        }
        else if (evt.type === 'tool.execution_complete') {
            const e = evt;
            if (e.data.model && !model)
                model = e.data.model;
        }
        else if (evt.type === 'assistant.turn_start') {
            const e = evt;
            if (e.data.model && !model)
                model = e.data.model;
        }
        else if (evt.type === 'user.message') {
            turnCount++;
        }
        else {
            // Detect plan / autopilot mode from event type prefixes
            const t = evt.type.toLowerCase();
            if (mode === 'interactive') {
                if (t.startsWith('plan.') || t === 'plan_created' || t === 'plan_started') {
                    mode = 'plan';
                }
                else if (t.startsWith('autopilot.') || t.startsWith('agent.') || t.startsWith('autonomous.')) {
                    mode = 'autopilot';
                }
            }
        }
    }
    base.model = model;
    base.mode = mode;
    base.turnCount = turnCount;
    const limit = (0, config_1.tokenLimitForModel)(model);
    if (outputTokensTotal > 0) {
        base.tokens = {
            used: outputTokensTotal,
            limit,
            pct: Math.min(outputTokensTotal / limit, 1),
        };
        base.compaction = {
            usedPct: Math.min(outputTokensTotal / limit, 1),
            warnAt: config_1.DEFAULT_CONFIG.compactionWarnAt,
            compactAt: config_1.DEFAULT_CONFIG.compactionAutoAt,
        };
    }
    // MCP servers from ~/.copilot/mcp.json or config.json
    const mcpConfigPath = path.join(config_1.CLI_DIRS.copilot, 'mcp.json');
    const fallbackConfigPath = path.join(config_1.CLI_DIRS.copilot, 'config.json');
    const mcpFile = fs.existsSync(mcpConfigPath) ? mcpConfigPath : fallbackConfigPath;
    const { servers, contextMode } = parseMCPConfig(mcpFile);
    base.mcpServers = servers;
    base.contextMode = contextMode;
    // Monthly request counter (reads all session JSONL files)
    base.requests = readMonthlyRequests();
    return base;
}
//# sourceMappingURL=copilot.js.map
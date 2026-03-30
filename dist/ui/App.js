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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ink_1 = require("ink");
const chokidar = __importStar(require("chokidar"));
const copilot_1 = require("../readers/copilot");
const claude_1 = require("../readers/claude");
const codex_1 = require("../readers/codex");
const StatusBar_1 = __importDefault(require("./StatusBar"));
const CompactBar_1 = __importDefault(require("./components/CompactBar"));
const index_1 = require("./logos/index");
const config_1 = require("../config");
function readSession(config) {
    try {
        switch (config.cli) {
            case 'copilot': return (0, copilot_1.readCopilotSession)();
            case 'claude': return (0, claude_1.readClaudeSession)();
            case 'codex': return (0, codex_1.readCodexSession)();
            default: return { cli: 'unknown', lastUpdated: new Date(), notice: 'Unknown CLI — pass --cli=copilot|claude|codex' };
        }
    }
    catch (err) {
        return {
            cli: config.cli,
            lastUpdated: new Date(),
            notice: `Reader error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
const App = ({ config }) => {
    const [data, setData] = (0, react_1.useState)(() => {
        const t0 = Date.now();
        const d = readSession(config);
        return { ...d, readTimeMs: Date.now() - t0 };
    });
    const [compact, setCompact] = (0, react_1.useState)(false);
    const [adaptiveInterval, setAdaptiveInterval] = (0, react_1.useState)(config.refreshIntervalMs);
    const identity = (0, index_1.getIdentity)(config.cli);
    const doRead = (0, react_1.useCallback)(() => {
        const t0 = Date.now();
        const next = readSession(config);
        const elapsed = Date.now() - t0;
        setData({ ...next, readTimeMs: elapsed });
        return elapsed;
    }, [config]);
    // ── Keyboard shortcuts ──────────────────────────────────────────────────────
    (0, ink_1.useInput)((input) => {
        if (input === 'q')
            process.exit(0);
        if (input === 'r')
            doRead();
        if (input === 'c')
            setCompact(prev => !prev);
    });
    // ── Adaptive polling (fallback refresh) ─────────────────────────────────────
    (0, react_1.useEffect)(() => {
        let timer;
        let currentInterval = config.refreshIntervalMs;
        const tick = () => {
            const elapsed = doRead();
            const nominal = config.refreshIntervalMs;
            const next = elapsed * 2 > nominal
                ? Math.max(nominal, elapsed * 3)
                : nominal;
            if (next !== currentInterval) {
                currentInterval = next;
                setAdaptiveInterval(next);
            }
            timer = setTimeout(tick, currentInterval);
        };
        timer = setTimeout(tick, currentInterval);
        return () => clearTimeout(timer);
    }, [config, doRead]);
    // ── Chokidar file watcher (immediate re-read on change) ─────────────────────
    (0, react_1.useEffect)(() => {
        const paths = (0, config_1.getWatchPaths)(config.cli);
        if (!paths.length)
            return;
        try {
            const watcher = chokidar.watch(paths, {
                persistent: true,
                ignoreInitial: true,
                depth: 2,
                awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
            });
            watcher.on('change', doRead).on('add', doRead).on('error', () => { });
            return () => { watcher.close(); };
        }
        catch {
            // chokidar unavailable (e.g. network drive restriction) — polling continues
        }
    }, [config, doRead]);
    // ── Render ──────────────────────────────────────────────────────────────────
    const readMs = data.readTimeMs ?? 0;
    const isSlowRead = readMs > config.refreshIntervalMs / 2;
    const footerHint = compact
        ? `${readMs}ms  ·  r refresh  ·  c expand  ·  q quit`
        : [
            `Last refresh: ${data.lastUpdated.toLocaleTimeString()}  ·  ${readMs}ms read`,
            isSlowRead ? `interval backed off to ${adaptiveInterval}ms` : null,
            'r refresh  ·  c compact  ·  q quit',
        ].filter(Boolean).join('  ·  ');
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", children: [compact ? ((0, jsx_runtime_1.jsx)(ink_1.Box, { borderStyle: "round", borderColor: identity.color, paddingX: 1, children: (0, jsx_runtime_1.jsx)(CompactBar_1.default, { data: data, identity: identity, readTimeMs: readMs }) })) : ((0, jsx_runtime_1.jsx)(StatusBar_1.default, { data: data, config: config })), (0, jsx_runtime_1.jsx)(ink_1.Box, { children: (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", dimColor: true, children: [' ', footerHint] }) })] }));
};
exports.default = App;
//# sourceMappingURL=App.js.map
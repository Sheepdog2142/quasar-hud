#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const App_1 = __importDefault(require("./ui/App"));
const config_1 = require("./config");
const VALID_CLI_NAMES = ['copilot', 'claude', 'codex'];
// ─── CLI argument parsing ────────────────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (const arg of args) {
        const [key, value] = arg.replace(/^--/, '').split('=');
        switch (key) {
            case 'cli':
                if (!VALID_CLI_NAMES.includes(value)) {
                    console.error(`--cli must be one of: ${VALID_CLI_NAMES.join(', ')}`);
                    process.exit(1);
                }
                result.cli = value;
                break;
            case 'refresh': {
                const s = parseFloat(value);
                if (isNaN(s) || s < 0.5 || s > 300) {
                    console.error('--refresh must be between 0.5 and 300 (seconds)');
                    process.exit(1);
                }
                result.refreshIntervalMs = Math.round(s * 1000);
                break;
            }
            case 'warn-at': {
                const w = parseFloat(value);
                if (isNaN(w) || w < 0 || w > 1) {
                    console.error('--warn-at must be a fraction between 0.0 and 1.0');
                    process.exit(1);
                }
                result.compactionWarnAt = w;
                break;
            }
            case 'compact-at': {
                const c = parseFloat(value);
                if (isNaN(c) || c < 0 || c > 1) {
                    console.error('--compact-at must be a fraction between 0.0 and 1.0');
                    process.exit(1);
                }
                result.compactionAutoAt = c;
                break;
            }
            case 'no-elapsed':
                result.showElapsedTime = false;
                break;
            case 'no-branch':
                result.showGitBranch = false;
                break;
            case 'no-requests':
                result.showRequests = false;
                break;
            case 'no-weekly':
                result.showWeeklyUsage = false;
                break;
        }
    }
    // Also honour QHUD_CLI env var (validated)
    if (!result.cli && process.env['QHUD_CLI']) {
        const v = process.env['QHUD_CLI'];
        if (VALID_CLI_NAMES.includes(v)) {
            result.cli = v;
        }
        else {
            console.error(`QHUD_CLI must be one of: ${VALID_CLI_NAMES.join(', ')}`);
            process.exit(1);
        }
    }
    return result;
}
// ─── Main ────────────────────────────────────────────────────────────────────
// Merge order: defaults < ~/.qhud.json < CLI args
const config = { ...config_1.DEFAULT_CONFIG, ...(0, config_1.loadConfigFile)(), ...parseArgs() };
const { waitUntilExit } = (0, ink_1.render)((0, jsx_runtime_1.jsx)(App_1.default, { config: config }), {
    exitOnCtrlC: true,
});
waitUntilExit().then(() => process.exit(0));
//# sourceMappingURL=index.js.map
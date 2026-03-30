#!/usr/bin/env node
"use strict";
/**
 * Quasar HUD auto-launch setup
 *
 * Usage:
 *   npm run setup -- enable  [--cli=copilot|claude|codex|all]
 *   npm run setup -- disable [--cli=copilot|claude|codex|all]
 *   npm run setup -- status
 *
 * Injects a shell wrapper that redirects the target CLI through the HUD
 * launcher so the HUD pane opens automatically whenever you run the CLI.
 */
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const ALL_CLIS = ['copilot', 'claude', 'codex'];
// ─── Paths ────────────────────────────────────────────────────────────────────
/** Project root (works for both ts-node src/ and compiled dist/) */
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LAUNCH_SCRIPTS = {
    copilot: path.join(PROJECT_ROOT, 'scripts', 'launch-copilot.ps1'),
    claude: path.join(PROJECT_ROOT, 'scripts', 'launch-claude.ps1'),
    codex: path.join(PROJECT_ROOT, 'scripts', 'launch-codex.ps1'),
};
const LAUNCH_SH = path.join(PROJECT_ROOT, 'scripts', 'launch.sh');
// ─── Profile path detection ───────────────────────────────────────────────────
function getPsProfilePath() {
    try {
        const result = (0, child_process_1.execSync)('pwsh -NoProfile -Command "$PROFILE"', {
            encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        if (result)
            return result;
    }
    catch { /* fall through */ }
    try {
        const result = (0, child_process_1.execSync)('powershell -NoProfile -Command "$PROFILE"', {
            encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        if (result)
            return result;
    }
    catch { /* fall through */ }
    // Sensible Windows default
    return path.join(os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
}
function getShRcPath() {
    if (process.env['SHELL']?.includes('zsh'))
        return path.join(os.homedir(), '.zshrc');
    return path.join(os.homedir(), '.bashrc');
}
// ─── Marker helpers ───────────────────────────────────────────────────────────
const markerStart = (cli) => `# === QUASAR_HUD:${cli} ===`;
const markerEnd = (cli) => `# === /QUASAR_HUD:${cli} ===`;
function hasBlock(content, cli) {
    return content.includes(markerStart(cli));
}
function removeBlock(content, cli) {
    const start = escapeRegex(markerStart(cli));
    const end = escapeRegex(markerEnd(cli));
    return content.replace(new RegExp(`\\n?${start}[\\s\\S]*?${end}\\n?`, 'g'), '');
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// ─── Path escaping helpers ────────────────────────────────────────────────────
/**
 * Escape a file path for embedding inside a PowerShell double-quoted string.
 * In PS, backtick is the escape char; backslashes are literal.
 * The previous approach of doubling backslashes was incorrect.
 */
function psSafePath(p) {
    return p
        .replace(/`/g, '``') // backtick must be escaped first
        .replace(/"/g, '`"') // double-quote inside a double-quoted PS string
        .replace(/\$/g, '`$'); // $ would trigger PS variable expansion
}
/**
 * Wrap a path in single quotes for a POSIX shell, safely escaping any
 * embedded single quotes via the '\'' idiom.
 */
function shSafePath(p) {
    return "'" + p.replace(/'/g, "'\\''") + "'";
}
// ─── Block generators ─────────────────────────────────────────────────────────
function makePsBlock(cli) {
    const launchScript = psSafePath(LAUNCH_SCRIPTS[cli]);
    return [
        markerStart(cli),
        `function global:${cli} {`,
        `    & "${launchScript}" @args`,
        `}`,
        markerEnd(cli),
        '',
    ].join('\n');
}
function makeShBlock(cli) {
    const launchSh = shSafePath(LAUNCH_SH.replace(/\\/g, '/'));
    return [
        markerStart(cli),
        `${cli}() {`,
        `    ${launchSh} ${cli} "$@"`,
        `}`,
        markerEnd(cli),
        '',
    ].join('\n');
}
// ─── Profile I/O ─────────────────────────────────────────────────────────────
function readProfile(profilePath) {
    try {
        return fs.readFileSync(profilePath, 'utf-8');
    }
    catch {
        return '';
    }
}
function writeProfile(profilePath, content) {
    fs.mkdirSync(path.dirname(profilePath), { recursive: true });
    fs.writeFileSync(profilePath, content, 'utf-8');
}
// ─── Commands ─────────────────────────────────────────────────────────────────
function enable(cli) {
    const isWindows = process.platform === 'win32';
    const profilePath = isWindows ? getPsProfilePath() : getShRcPath();
    const block = isWindows ? makePsBlock(cli) : makeShBlock(cli);
    let content = readProfile(profilePath);
    // Remove any existing block first (idempotent)
    content = removeBlock(content, cli);
    content = content.trimEnd() + '\n\n' + block;
    writeProfile(profilePath, content);
    const shell = isWindows ? 'PowerShell' : path.basename(getShRcPath());
    console.log(`✅  Auto-launch enabled for \x1b[36m${cli}\x1b[0m in ${shell} profile:`);
    console.log(`    ${profilePath}`);
    if (isWindows) {
        console.log(`    Reload with: . $PROFILE`);
    }
    else {
        console.log(`    Reload with: source ${profilePath}`);
    }
}
function disable(cli) {
    const isWindows = process.platform === 'win32';
    const profilePath = isWindows ? getPsProfilePath() : getShRcPath();
    const content = readProfile(profilePath);
    if (!hasBlock(content, cli)) {
        console.log(`ℹ️   Auto-launch for \x1b[36m${cli}\x1b[0m was not enabled.`);
        return;
    }
    writeProfile(profilePath, removeBlock(content, cli));
    console.log(`✅  Auto-launch disabled for \x1b[36m${cli}\x1b[0m`);
    console.log(`    Reload your shell to apply.`);
}
function status() {
    const isWindows = process.platform === 'win32';
    const profilePath = isWindows ? getPsProfilePath() : getShRcPath();
    const content = readProfile(profilePath);
    console.log('\nQuasar HUD — auto-launch status');
    console.log('─'.repeat(36));
    for (const cli of ALL_CLIS) {
        const on = hasBlock(content, cli);
        console.log(`  ${on ? '\x1b[32m✅\x1b[0m' : '\x1b[90m⬜\x1b[0m'}  ${cli}`);
    }
    console.log(`\nProfile: ${profilePath}`);
    console.log('\nUsage:');
    console.log('  npm run setup -- enable  --cli=copilot|claude|codex|all');
    console.log('  npm run setup -- disable --cli=copilot|claude|codex|all');
}
// ─── Entry point ──────────────────────────────────────────────────────────────
const [, , command, cliArg] = process.argv;
const rawCli = cliArg?.replace(/^--cli=/, '');
const cliList = (!rawCli || rawCli === 'all')
    ? ALL_CLIS
    : ALL_CLIS.includes(rawCli)
        ? [rawCli]
        : (() => { console.error(`Unknown CLI: ${rawCli}. Use copilot, claude, codex, or all.`); process.exit(1); })();
switch (command) {
    case 'enable':
        cliList.forEach(enable);
        break;
    case 'disable':
        cliList.forEach(disable);
        break;
    case 'status':
        status();
        break;
    default:
        console.log('Usage: npm run setup -- <enable|disable|status> [--cli=copilot|claude|codex|all]');
        process.exit(1);
}
//# sourceMappingURL=setup.js.map
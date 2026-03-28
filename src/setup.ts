#!/usr/bin/env node
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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// ─── Types ────────────────────────────────────────────────────────────────────

type CLI = 'copilot' | 'claude' | 'codex';
const ALL_CLIS: CLI[] = ['copilot', 'claude', 'codex'];

// ─── Paths ────────────────────────────────────────────────────────────────────

/** Project root (works for both ts-node src/ and compiled dist/) */
const PROJECT_ROOT = path.resolve(__dirname, '..');

const LAUNCH_SCRIPTS: Record<CLI, string> = {
  copilot: path.join(PROJECT_ROOT, 'scripts', 'launch-copilot.ps1'),
  claude:  path.join(PROJECT_ROOT, 'scripts', 'launch-claude.ps1'),
  codex:   path.join(PROJECT_ROOT, 'scripts', 'launch-codex.ps1'),
};

const LAUNCH_SH = path.join(PROJECT_ROOT, 'scripts', 'launch.sh');

// ─── Profile path detection ───────────────────────────────────────────────────

function getPsProfilePath(): string {
  try {
    const result = execSync('pwsh -NoProfile -Command "$PROFILE"', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (result) return result;
  } catch { /* fall through */ }
  try {
    const result = execSync('powershell -NoProfile -Command "$PROFILE"', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (result) return result;
  } catch { /* fall through */ }
  // Sensible Windows default
  return path.join(os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
}

function getShRcPath(): string {
  if (process.env['SHELL']?.includes('zsh')) return path.join(os.homedir(), '.zshrc');
  return path.join(os.homedir(), '.bashrc');
}

// ─── Marker helpers ───────────────────────────────────────────────────────────

const markerStart = (cli: CLI) => `# === QUASAR_HUD:${cli} ===`;
const markerEnd   = (cli: CLI) => `# === /QUASAR_HUD:${cli} ===`;

function hasBlock(content: string, cli: CLI): boolean {
  return content.includes(markerStart(cli));
}

function removeBlock(content: string, cli: CLI): string {
  const start = escapeRegex(markerStart(cli));
  const end   = escapeRegex(markerEnd(cli));
  return content.replace(new RegExp(`\\n?${start}[\\s\\S]*?${end}\\n?`, 'g'), '');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Block generators ─────────────────────────────────────────────────────────

function makePsBlock(cli: CLI): string {
  const launchScript = LAUNCH_SCRIPTS[cli].replace(/\\/g, '\\\\');
  return [
    markerStart(cli),
    `function global:${cli} {`,
    `    & "${launchScript}" @args`,
    `}`,
    markerEnd(cli),
    '',
  ].join('\n');
}

function makeShBlock(cli: CLI): string {
  const launchSh = LAUNCH_SH.replace(/\\/g, '/');
  return [
    markerStart(cli),
    `${cli}() {`,
    `    "${launchSh}" ${cli} "$@"`,
    `}`,
    markerEnd(cli),
    '',
  ].join('\n');
}

// ─── Profile I/O ─────────────────────────────────────────────────────────────

function readProfile(profilePath: string): string {
  try { return fs.readFileSync(profilePath, 'utf-8'); } catch { return ''; }
}

function writeProfile(profilePath: string, content: string): void {
  fs.mkdirSync(path.dirname(profilePath), { recursive: true });
  fs.writeFileSync(profilePath, content, 'utf-8');
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function enable(cli: CLI): void {
  const isWindows = process.platform === 'win32';
  const profilePath = isWindows ? getPsProfilePath() : getShRcPath();
  const block       = isWindows ? makePsBlock(cli) : makeShBlock(cli);

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
  } else {
    console.log(`    Reload with: source ${profilePath}`);
  }
}

function disable(cli: CLI): void {
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

function status(): void {
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

const [,, command, cliArg] = process.argv;
const rawCli = cliArg?.replace(/^--cli=/, '');
const cliList: CLI[] = (!rawCli || rawCli === 'all')
  ? ALL_CLIS
  : ALL_CLIS.includes(rawCli as CLI)
    ? [rawCli as CLI]
    : (() => { console.error(`Unknown CLI: ${rawCli}. Use copilot, claude, codex, or all.`); process.exit(1); })()!;

switch (command) {
  case 'enable':  cliList.forEach(enable);  break;
  case 'disable': cliList.forEach(disable); break;
  case 'status':  status(); break;
  default:
    console.log('Usage: npm run setup -- <enable|disable|status> [--cli=copilot|claude|codex|all]');
    process.exit(1);
}

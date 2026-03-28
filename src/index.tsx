#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './ui/App';
import { DEFAULT_CONFIG, loadConfigFile } from './config';
import type { CLIName, HUDConfig } from './types';

const VALID_CLI_NAMES: readonly CLIName[] = ['copilot', 'claude', 'codex'];

// ─── CLI argument parsing ────────────────────────────────────────────────────

function parseArgs(): Partial<HUDConfig> {
  const args = process.argv.slice(2);
  const result: Partial<HUDConfig> = {};

  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    switch (key) {
      case 'cli':
        if (!VALID_CLI_NAMES.includes(value as CLIName)) {
          console.error(`--cli must be one of: ${VALID_CLI_NAMES.join(', ')}`);
          process.exit(1);
        }
        result.cli = value as CLIName;
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
    if (VALID_CLI_NAMES.includes(v as CLIName)) {
      result.cli = v as CLIName;
    } else {
      console.error(`QHUD_CLI must be one of: ${VALID_CLI_NAMES.join(', ')}`);
      process.exit(1);
    }
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

// Merge order: defaults < ~/.qhud.json < CLI args
const config: HUDConfig = { ...DEFAULT_CONFIG, ...loadConfigFile(), ...parseArgs() };

const { waitUntilExit } = render(<App config={config} />, {
  exitOnCtrlC: true,
});

waitUntilExit().then(() => process.exit(0));

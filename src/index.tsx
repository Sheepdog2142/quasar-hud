#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './ui/App';
import { DEFAULT_CONFIG } from './config';
import type { CLIName, HUDConfig } from './types';

// ─── CLI argument parsing ────────────────────────────────────────────────────

function parseArgs(): Partial<HUDConfig> {
  const args = process.argv.slice(2);
  const result: Partial<HUDConfig> = {};

  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    switch (key) {
      case 'cli':
        result.cli = value as CLIName;
        break;
      case 'refresh':
        result.refreshIntervalMs = parseInt(value, 10) * 1000;
        break;
      case 'warn-at':
        result.compactionWarnAt = parseFloat(value);
        break;
      case 'compact-at':
        result.compactionAutoAt = parseFloat(value);
        break;
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

  // Also honour QHUD_CLI env var
  if (!result.cli && process.env['QHUD_CLI']) {
    result.cli = process.env['QHUD_CLI'] as CLIName;
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const config: HUDConfig = { ...DEFAULT_CONFIG, ...parseArgs() };

const { waitUntilExit } = render(<App config={config} />, {
  // Disable alt-screen so the HUD stays at the top of the pane buffer
  exitOnCtrlC: true,
});

waitUntilExit().then(() => process.exit(0));

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import * as chokidar from 'chokidar';
import { readCopilotSession } from '../readers/copilot';
import { readClaudeSession }  from '../readers/claude';
import { readCodexSession }   from '../readers/codex';
import StatusBar from './StatusBar';
import CompactBar from './components/CompactBar';
import { getIdentity } from './logos/index';
import { getWatchPaths } from '../config';
import type { SessionData } from '../types';
import type { HUDConfig } from '../types';

interface AppProps {
  config: HUDConfig;
}

function readSession(config: HUDConfig): SessionData {
  try {
    switch (config.cli) {
      case 'copilot': return readCopilotSession();
      case 'claude':  return readClaudeSession();
      case 'codex':   return readCodexSession();
      default:        return { cli: 'unknown', lastUpdated: new Date(), notice: 'Unknown CLI — pass --cli=copilot|claude|codex' };
    }
  } catch (err) {
    return {
      cli: config.cli,
      lastUpdated: new Date(),
      notice: `Reader error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

const App: React.FC<AppProps> = ({ config }) => {
  const [data, setData] = useState<SessionData>(() => {
    const t0 = Date.now();
    const d = readSession(config);
    return { ...d, readTimeMs: Date.now() - t0 };
  });
  const [compact, setCompact] = useState(false);
  const [adaptiveInterval, setAdaptiveInterval] = useState(config.refreshIntervalMs);
  const identity = getIdentity(config.cli);

  const doRead = useCallback(() => {
    const t0 = Date.now();
    const next = readSession(config);
    const elapsed = Date.now() - t0;
    setData({ ...next, readTimeMs: elapsed });
    return elapsed;
  }, [config]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useInput((input) => {
    if (input === 'q') process.exit(0);
    if (input === 'r') doRead();
    if (input === 'c') setCompact(prev => !prev);
  });

  // ── Adaptive polling (fallback refresh) ─────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
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
  useEffect(() => {
    const paths = getWatchPaths(config.cli);
    if (!paths.length) return;
    try {
      const watcher = chokidar.watch(paths, {
        persistent:    true,
        ignoreInitial: true,
        depth:         2,
        awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
      });
      watcher.on('change', doRead).on('add', doRead).on('error', () => { /* swallow — polling continues */ });
      return () => { watcher.close(); };
    } catch {
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

  return (
    <Box flexDirection="column">
      {compact ? (
        <Box borderStyle="round" borderColor={identity.color} paddingX={1}>
          <CompactBar data={data} identity={identity} readTimeMs={readMs} />
        </Box>
      ) : (
        <StatusBar data={data} config={config} />
      )}
      <Box>
        <Text color="gray" dimColor>{' '}{footerHint}</Text>
      </Box>
    </Box>
  );
};

export default App;

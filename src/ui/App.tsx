import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { readCopilotSession } from '../readers/copilot';
import { readClaudeSession }  from '../readers/claude';
import { readCodexSession }   from '../readers/codex';
import StatusBar from './StatusBar';
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
  // Track adaptive interval: if reads are slow, back off to avoid 100% CPU.
  const adaptiveInterval = useRef(config.refreshIntervalMs);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const t0 = Date.now();
      const next = readSession(config);
      const elapsed = Date.now() - t0;
      setData({ ...next, readTimeMs: elapsed });

      // If the read took more than half the nominal interval, back off to 3× the
      // read time (min: nominal interval) so we never spin at 100% CPU.
      const nominal = config.refreshIntervalMs;
      adaptiveInterval.current = elapsed * 2 > nominal
        ? Math.max(nominal, elapsed * 3)
        : nominal;

      timer = setTimeout(tick, adaptiveInterval.current);
    };

    timer = setTimeout(tick, adaptiveInterval.current);
    return () => clearTimeout(timer);
  }, [config]);

  const readMs = data.readTimeMs ?? 0;
  const isSlowRead = readMs > config.refreshIntervalMs / 2;

  return (
    <Box flexDirection="column">
      <StatusBar data={data} config={config} />
      <Box>
        <Text color="gray" dimColor>
          {' '}Last refresh: {data.lastUpdated.toLocaleTimeString()}
          {'  ·  '}{readMs}ms read
          {isSlowRead ? `  ·  interval backed off to ${adaptiveInterval.current}ms` : ''}
          {'  ·  '}Press Ctrl+C to exit HUD
        </Text>
      </Box>
    </Box>
  );
};

export default App;

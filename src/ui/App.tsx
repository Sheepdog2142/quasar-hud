import React, { useState, useEffect } from 'react';
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
  const [data, setData] = useState<SessionData>(() => readSession(config));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(readSession(config));
    }, config.refreshIntervalMs);
    return () => clearInterval(interval);
  }, [config]);

  return (
    <Box flexDirection="column">
      <StatusBar data={data} config={config} />
      <Text color="gray" dimColor>
        {' '}Last refresh: {data.lastUpdated.toLocaleTimeString()}
        {'  ·  '}Press Ctrl+C to exit HUD
      </Text>
    </Box>
  );
};

export default App;

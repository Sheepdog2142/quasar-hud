import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { getIdentity } from './logos/index';
import TokenBar from './components/TokenBar';
import CompactionBar from './components/CompactionBar';
import MCPRow from './components/MCPRow';
import SessionRow from './components/SessionRow';
import RequestsBar from './components/RequestsBar';
import WeeklyUsageBar from './components/WeeklyUsageBar';
import CostRow from './components/CostRow';
import type { SessionData, HUDConfig } from '../types';

interface StatusBarProps {
  data: SessionData;
  config: HUDConfig;
}

const Divider: React.FC<{ width: number }> = ({ width }) => (
  <Text color="gray">{'─'.repeat(Math.max(width - 2, 10))}</Text>
);

const StatusBar: React.FC<StatusBarProps> = ({ data, config }) => {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 100;
  const identity = getIdentity(data.cli);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={identity.color}
      width={cols - 1}
      paddingX={1}
    >
      {/* Row 1 — identity + session meta */}
      <SessionRow data={data} identity={identity} />

      {/* Row 2 — context window token bar (session scope) */}
      {data.tokens ? (
        <TokenBar tokens={data.tokens} color={identity.accentColor} />
      ) : (
        <Text color="gray">  Context  —  no token data yet</Text>
      )}

      {/* Row 3 — compaction threshold bar */}
      {data.compaction ? (
        <CompactionBar compaction={data.compaction} />
      ) : null}

      {/* Row 4 — Copilot monthly request counter */}
      {config.showRequests && data.requests ? (
        <RequestsBar requests={data.requests} />
      ) : null}

      {/* Row 5 — Claude 7-day weekly token burn */}
      {config.showWeeklyUsage && data.weeklyUsage ? (
        <WeeklyUsageBar weeklyUsage={data.weeklyUsage} />
      ) : null}

      {/* Row 6 — Session cost estimate (Claude only; requires token breakdown) */}
      {data.costEstimate ? (
        <CostRow cost={data.costEstimate} color={identity.accentColor} />
      ) : null}

      {/* Row 7 — MCP servers + context-mode */}
      <MCPRow data={data} identity={identity} />

      {/* Notice / warning footer */}
      {data.notice ? (
        <Text color="yellow">  ⚠  {data.notice}</Text>
      ) : null}
    </Box>
  );
};

export default StatusBar;


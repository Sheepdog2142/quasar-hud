import React from 'react';
import { Box, Text } from 'ink';
import type { SessionData } from '../../types';
import type { CLIIdentity } from '../logos/index';
import { formatDuration } from '../../utils';

interface CompactBarProps {
  data: SessionData;
  identity: CLIIdentity;
  readTimeMs?: number;
}

/** Single-line HUD summary — toggled on with the 'c' key. */
const CompactBar: React.FC<CompactBarProps> = ({ data, identity, readTimeMs }) => {
  const ctx = data.tokens;
  const ctxPct = ctx ? Math.round(ctx.pct * 100) : null;
  const ctxColor = !ctx      ? 'gray'
                 : ctx.pct >= 0.8 ? 'red'
                 : ctx.pct >= 0.6 ? 'yellow'
                 : 'green';

  const cost = data.costEstimate;
  const costColor = !cost              ? 'gray'
                  : cost.totalUsd >= 1 ? 'red'
                  : cost.totalUsd >= 0.1 ? 'yellow'
                  : 'green';
  const costStr = cost
    ? (cost.totalUsd < 0.01 ? `$${cost.totalUsd.toFixed(4)}` : `$${cost.totalUsd.toFixed(3)}`)
    : null;

  const elapsed = data.startedAt
    ? formatDuration(Date.now() - data.startedAt.getTime())
    : null;

  const Sep = () => <Text color="gray">  │  </Text>;

  return (
    <Box flexDirection="row">
      {/* Identity */}
      <Text bold color={identity.color}>{identity.symbol}  {identity.label}</Text>

      {/* Model */}
      {data.model ? (<><Sep /><Text color="cyan">{data.model}</Text></>) : null}

      {/* Context % */}
      {ctxPct !== null ? (<><Sep /><Text color={ctxColor}>{ctxPct}% ctx</Text></>) : null}

      {/* Cost */}
      {costStr ? (<><Sep /><Text color={costColor}>{costStr}</Text></>) : null}

      {/* Git branch */}
      {data.gitBranch ? (<><Sep /><Text color="blue"> {data.gitBranch}</Text></>) : null}

      {/* Mode (only if non-interactive) */}
      {data.mode && data.mode !== 'interactive' && data.mode !== 'unknown' ? (
        <><Sep /><Text color={data.mode === 'autopilot' ? 'yellow' : 'green'}>{data.mode}</Text></>
      ) : null}

      {/* Turn count */}
      {data.turnCount !== undefined ? (
        <><Sep /><Text color="gray">{data.turnCount}t</Text></>
      ) : null}

      {/* Elapsed */}
      {elapsed ? (<><Sep /><Text color="gray">⏱ {elapsed}</Text></>) : null}

      {/* Read time */}
      {readTimeMs !== undefined ? (
        <><Sep /><Text color="gray" dimColor>{readTimeMs}ms</Text></>
      ) : null}
    </Box>
  );
};

export default CompactBar;

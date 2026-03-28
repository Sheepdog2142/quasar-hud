import React from 'react';
import { Box, Text } from 'ink';
import type { SessionData } from '../../types';
import type { CLIIdentity } from '../logos/index';
import { formatDuration } from '../../utils';

interface SessionRowProps {
  data: SessionData;
  identity: CLIIdentity;
}

const SessionRow: React.FC<SessionRowProps> = ({ data, identity }) => {
  const elapsed = data.startedAt
    ? formatDuration(Date.now() - data.startedAt.getTime())
    : null;

  const modeLabel = data.mode && data.mode !== 'unknown'
    ? data.mode
    : null;

  return (
    <Box flexDirection="row">
      {/* CLI logo + name */}
      <Text bold color={identity.color}>
        {identity.symbol}  {identity.label}
      </Text>

      {/* Separator */}
      <Text color="gray">│</Text>

      {/* Session name */}
      <Text color="white">
        {data.sessionName ?? data.sessionId?.slice(0, 8) ?? '—'}
      </Text>

      {/* Model */}
      {data.model ? (
        <>
          <Text color="gray">│</Text>
          <Text color="cyan">{data.model}</Text>
        </>
      ) : null}

      {/* Mode */}
      {modeLabel ? (
        <>
          <Text color="gray">│</Text>
          <Text color={modeLabel === 'autopilot' ? 'yellow' : 'green'}>{modeLabel}</Text>
        </>
      ) : null}

      {/* Git branch */}
      {data.gitBranch ? (
        <>
          <Text color="gray">│</Text>
          <Text color="blue"> {data.gitBranch}</Text>
        </>
      ) : null}

      {/* Turn count */}
      {data.turnCount !== undefined ? (
        <>
          <Text color="gray">│</Text>
          <Text color="gray">{data.turnCount} turns</Text>
        </>
      ) : null}

      {/* Elapsed */}
      {elapsed ? (
        <>
          <Text color="gray">│</Text>
          <Text color="gray">⏱ {elapsed}</Text>
        </>
      ) : null}
    </Box>
  );
};

export default SessionRow;

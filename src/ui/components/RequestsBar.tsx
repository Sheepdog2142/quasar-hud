import React from 'react';
import { Box, Text, useStdout } from 'ink';
import type { RequestsInfo } from '../../types';

interface RequestsBarProps {
  requests: RequestsInfo;
}

const RequestsBar: React.FC<RequestsBarProps> = ({ requests }) => {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 100;

  const { usedThisPeriod: used, limit, periodLabel } = requests;
  const pct = limit ? Math.min(used / limit, 1) : undefined;

  const barColor = pct === undefined ? 'green'
                 : pct >= 0.80       ? 'red'
                 : pct >= 0.50       ? 'yellow'
                 : 'green';

  if (pct !== undefined) {
    const prefix = '  Requests [';
    const suffix = `]  ${used} / ${limit}  (${Math.round(pct * 100)}%)  ${periodLabel}`;
    const barWidth = Math.max(cols - prefix.length - suffix.length - 4, 10);
    const filled   = Math.round(pct * barWidth);
    const empty    = barWidth - filled;

    return (
      <Box flexDirection="row">
        <Text color="gray">{prefix}</Text>
        <Text color={barColor}>{'█'.repeat(filled)}</Text>
        <Text color="gray">{'░'.repeat(empty)}</Text>
        <Text color="gray">]  </Text>
        <Text color={barColor} bold={pct >= 0.50}>{used} / {limit}</Text>
        <Text color="gray">  ({Math.round(pct * 100)}%)  {periodLabel}</Text>
      </Box>
    );
  }

  // No limit configured — show raw count with hint
  return (
    <Box flexDirection="row">
      <Text color="gray">  Requests  </Text>
      <Text color="green" bold>{used}</Text>
      <Text color="gray"> this period  ({periodLabel})</Text>
      <Text color="gray" dimColor>  · set COPILOT_MONTHLY_REQUESTS=N for progress bar</Text>
    </Box>
  );
};

export default RequestsBar;

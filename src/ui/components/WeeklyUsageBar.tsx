import React from 'react';
import { Box, Text, useStdout } from 'ink';
import type { WeeklyUsage } from '../../types';
import { formatTokens } from '../../utils';

interface WeeklyUsageBarProps {
  weeklyUsage: WeeklyUsage;
}

const WeeklyUsageBar: React.FC<WeeklyUsageBarProps> = ({ weeklyUsage }) => {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 100;

  const { tokensUsed, limit, periodDays, sessionsCount } = weeklyUsage;
  const pct = limit ? Math.min(tokensUsed / limit, 1) : undefined;

  const barColor = pct === undefined ? 'cyan'
                 : pct >= 0.80       ? 'red'
                 : pct >= 0.60       ? 'yellow'
                 : 'cyan';

  if (pct !== undefined) {
    const used   = formatTokens(tokensUsed);
    const cap    = formatTokens(limit!);
    const prefix = '  Weekly   [';
    const suffix = `]  ${used} / ${cap}  (${Math.round(pct * 100)}%)  ${sessionsCount} sessions`;
    const barWidth = Math.max(cols - prefix.length - suffix.length - 4, 10);
    const filled   = Math.round(pct * barWidth);
    const empty    = barWidth - filled;

    return (
      <Box flexDirection="row">
        <Text color="gray">{prefix}</Text>
        <Text color={barColor}>{'█'.repeat(filled)}</Text>
        <Text color="gray">{'░'.repeat(empty)}</Text>
        <Text color="gray">]  </Text>
        <Text color={barColor} bold={pct >= 0.60}>{used} / {cap}</Text>
        <Text color="gray">  ({Math.round(pct * 100)}%)  {sessionsCount} sessions</Text>
      </Box>
    );
  }

  // No limit — show raw burn totals
  return (
    <Box flexDirection="row">
      <Text color="gray">  Weekly   </Text>
      <Text color="cyan" bold>{formatTokens(tokensUsed)}</Text>
      <Text color="gray"> tokens  ·  {sessionsCount} sessions  ·  {periodDays}d window</Text>
      <Text color="gray" dimColor>  · set CLAUDE_WEEKLY_TOKENS=N for progress bar</Text>
    </Box>
  );
};

export default WeeklyUsageBar;

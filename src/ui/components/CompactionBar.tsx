import React from 'react';
import { Box, Text, useStdout } from 'ink';
import type { CompactionInfo } from '../../types';

interface CompactionBarProps {
  compaction: CompactionInfo;
}

const CompactionBar: React.FC<CompactionBarProps> = ({ compaction }) => {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 100;

  const prefixLen = '  Compact  ['.length;
  const suffixLen = `]  100%  ► warn 60%  ► auto 80%`.length;
  const barWidth  = Math.max(cols - prefixLen - suffixLen - 6, 10);

  const usedFilled   = Math.round(compaction.usedPct * barWidth);
  const warnPos      = Math.round(compaction.warnAt * barWidth);
  const compactPos   = Math.round(compaction.compactAt * barWidth);
  const empty        = barWidth - usedFilled;

  const barColor = compaction.usedPct >= compaction.compactAt ? 'red'
                 : compaction.usedPct >= compaction.warnAt    ? 'yellow'
                 : 'green';

  const pctDisplay = `${Math.round(compaction.usedPct * 100)}%`;
  const warnLabel  = `${Math.round(compaction.warnAt * 100)}%`;
  const autoLabel  = `${Math.round(compaction.compactAt * 100)}%`;

  return (
    <Box flexDirection="row">
      <Text color="gray">  Compact  [</Text>
      <Text color={barColor}>{'█'.repeat(usedFilled)}</Text>
      <Text color="gray">{'░'.repeat(empty)}</Text>
      <Text color="gray">]  </Text>
      <Text color={barColor} bold={compaction.usedPct >= compaction.warnAt}>
        {pctDisplay}
      </Text>
      <Text color="gray">  ► warn </Text>
      <Text color="yellow">{warnLabel}</Text>
      <Text color="gray">  ► auto </Text>
      <Text color="red">{autoLabel}</Text>
    </Box>
  );
};

export default CompactionBar;

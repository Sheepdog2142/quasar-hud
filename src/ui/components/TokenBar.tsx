import React from 'react';
import { Box, Text, useStdout } from 'ink';
import type { TokenUsage } from '../../types';
import { formatTokens } from '../../utils';

interface TokenBarProps {
  tokens: TokenUsage;
  color: string;
}

const TokenBar: React.FC<TokenBarProps> = ({ tokens, color }) => {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 100;

  // Reserve space for label prefix + suffix text
  const prefixLen = '  Context  ['.length;
  const suffixLen = `]  ${formatTokens(tokens.used)} / ${formatTokens(tokens.limit)}  (100%)`.length;
  const barWidth = Math.max(cols - prefixLen - suffixLen - 6, 10);

  const filled = Math.round(tokens.pct * barWidth);
  const empty  = barWidth - filled;

  const barColor = tokens.pct >= 0.80 ? 'red'
                 : tokens.pct >= 0.60 ? 'yellow'
                 : color;

  return (
    <Box flexDirection="row">
      <Text color="gray">  Context  [</Text>
      <Text color={barColor}>{'█'.repeat(filled)}</Text>
      <Text color="gray">{'░'.repeat(empty)}</Text>
      <Text color="gray">]  </Text>
      <Text color={barColor} bold={tokens.pct >= 0.60}>
        {formatTokens(tokens.used)} / {formatTokens(tokens.limit)}
      </Text>
      <Text color="gray">  ({Math.round(tokens.pct * 100)}%)</Text>
    </Box>
  );
};

export default TokenBar;

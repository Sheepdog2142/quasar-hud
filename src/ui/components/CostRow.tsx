import React from 'react';
import { Box, Text } from 'ink';
import { formatTokens } from '../../utils';
import type { CostEstimate } from '../../types';

interface CostRowProps {
  cost: CostEstimate;
  color: string;
}

function formatUsd(usd: number): string {
  if (usd < 0.0001) return '<$0.0001';
  if (usd < 0.01)   return `$${usd.toFixed(4)}`;
  if (usd < 1)      return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

const CostRow: React.FC<CostRowProps> = ({ cost, color }) => {
  // Colour-code by spend: green cheap, yellow moderate, red expensive
  const valueColor = cost.totalUsd >= 1.0  ? 'red'
                   : cost.totalUsd >= 0.10 ? 'yellow'
                   : 'green';

  const breakdown = [
    `in:${formatTokens(cost.inputTokens)}`,
    `out:${formatTokens(cost.outputTokens)}`,
    cost.cacheReadTokens > 0 ? `cached:${formatTokens(cost.cacheReadTokens)}` : null,
  ].filter(Boolean).join('  ');

  return (
    <Box>
      <Text color={color} bold>  Cost    </Text>
      <Text color={valueColor} bold>{formatUsd(cost.totalUsd)}</Text>
      <Text color="gray" dimColor>{'  '}{breakdown}</Text>
    </Box>
  );
};

export default CostRow;

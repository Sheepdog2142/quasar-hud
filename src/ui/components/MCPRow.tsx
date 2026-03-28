import React from 'react';
import { Box, Text } from 'ink';
import type { SessionData } from '../../types';
import type { CLIIdentity } from '../logos/index';

interface MCPRowProps {
  data: SessionData;
  identity: CLIIdentity;
}

const MCPRow: React.FC<MCPRowProps> = ({ data, identity }) => {
  const { mcpServers = [], contextMode } = data;

  if (!mcpServers.length && !contextMode?.installed) {
    return <Text color="gray">  MCP  —  no servers configured</Text>;
  }

  return (
    <Box flexDirection="row">
      <Text color="gray">  MCP  </Text>

      {/* Server badges */}
      {mcpServers.map(srv => (
        <Box key={srv.name} flexDirection="row" marginRight={2}>
          <Text color={srv.connected ? 'green' : 'red'}>●  </Text>
          <Text color={srv.name === 'context-mode' ? identity.color : 'white'}>
            {srv.name}
          </Text>
        </Box>
      ))}

      {/* context-mode savings */}
      {contextMode?.installed ? (
        <>
          <Text color="gray">│</Text>
          <Text color={identity.color}>⚡ context-mode</Text>
          {contextMode.tokensSaved !== undefined && contextMode.tokensSaved > 0 ? (
            <Text color="green"> saved ~{contextMode.tokensSaved.toLocaleString()} tokens</Text>
          ) : (
            <Text color="gray"> (active)</Text>
          )}
        </>
      ) : null}
    </Box>
  );
};

export default MCPRow;

import React from 'react';
import type { SessionData } from '../../types';
import type { CLIIdentity } from '../logos/index';
interface MCPRowProps {
    data: SessionData;
    identity: CLIIdentity;
}
declare const MCPRow: React.FC<MCPRowProps>;
export default MCPRow;

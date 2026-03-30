import React from 'react';
import type { SessionData } from '../../types';
import type { CLIIdentity } from '../logos/index';
interface SessionRowProps {
    data: SessionData;
    identity: CLIIdentity;
}
declare const SessionRow: React.FC<SessionRowProps>;
export default SessionRow;

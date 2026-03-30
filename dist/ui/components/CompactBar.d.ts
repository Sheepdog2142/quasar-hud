import React from 'react';
import type { SessionData } from '../../types';
import type { CLIIdentity } from '../logos/index';
interface CompactBarProps {
    data: SessionData;
    identity: CLIIdentity;
    readTimeMs?: number;
}
/** Single-line HUD summary — toggled on with the 'c' key. */
declare const CompactBar: React.FC<CompactBarProps>;
export default CompactBar;

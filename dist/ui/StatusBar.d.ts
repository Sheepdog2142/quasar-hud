import React from 'react';
import type { SessionData, HUDConfig } from '../types';
interface StatusBarProps {
    data: SessionData;
    config: HUDConfig;
}
declare const StatusBar: React.FC<StatusBarProps>;
export default StatusBar;

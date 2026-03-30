import React from 'react';
import type { TokenUsage } from '../../types';
interface TokenBarProps {
    tokens: TokenUsage;
    color: string;
}
declare const TokenBar: React.FC<TokenBarProps>;
export default TokenBar;

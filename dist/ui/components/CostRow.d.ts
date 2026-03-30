import React from 'react';
import type { CostEstimate } from '../../types';
interface CostRowProps {
    cost: CostEstimate;
    color: string;
}
declare const CostRow: React.FC<CostRowProps>;
export default CostRow;

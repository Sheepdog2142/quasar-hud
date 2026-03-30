"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const utils_1 = require("../../utils");
function formatUsd(usd) {
    if (usd < 0.0001)
        return '<$0.0001';
    if (usd < 0.01)
        return `$${usd.toFixed(4)}`;
    if (usd < 1)
        return `$${usd.toFixed(3)}`;
    return `$${usd.toFixed(2)}`;
}
const CostRow = ({ cost, color }) => {
    // Colour-code by spend: green cheap, yellow moderate, red expensive
    const valueColor = cost.totalUsd >= 1.0 ? 'red'
        : cost.totalUsd >= 0.10 ? 'yellow'
            : 'green';
    const breakdown = [
        `in:${(0, utils_1.formatTokens)(cost.inputTokens)}`,
        `out:${(0, utils_1.formatTokens)(cost.outputTokens)}`,
        cost.cacheReadTokens > 0 ? `cached:${(0, utils_1.formatTokens)(cost.cacheReadTokens)}` : null,
    ].filter(Boolean).join('  ');
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: color, bold: true, children: "  Cost    " }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: valueColor, bold: true, children: formatUsd(cost.totalUsd) }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", dimColor: true, children: ['  ', breakdown] })] }));
};
exports.default = CostRow;
//# sourceMappingURL=CostRow.js.map
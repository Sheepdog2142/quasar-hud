"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const utils_1 = require("../../utils");
const TokenBar = ({ tokens, color }) => {
    const { stdout } = (0, ink_1.useStdout)();
    const cols = stdout?.columns ?? 100;
    // Reserve space for label prefix + suffix text
    const prefixLen = '  Context  ['.length;
    const suffixLen = `]  ${(0, utils_1.formatTokens)(tokens.used)} / ${(0, utils_1.formatTokens)(tokens.limit)}  (100%)`.length;
    const barWidth = Math.max(cols - prefixLen - suffixLen - 6, 10);
    const filled = Math.round(tokens.pct * barWidth);
    const empty = barWidth - filled;
    const barColor = tokens.pct >= 0.80 ? 'red'
        : tokens.pct >= 0.60 ? 'yellow'
            : color;
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  Context  [" }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: barColor, children: '█'.repeat(filled) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: '░'.repeat(empty) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "]  " }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: barColor, bold: tokens.pct >= 0.60, children: [(0, utils_1.formatTokens)(tokens.used), " / ", (0, utils_1.formatTokens)(tokens.limit)] }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: ["  (", Math.round(tokens.pct * 100), "%)"] })] }));
};
exports.default = TokenBar;
//# sourceMappingURL=TokenBar.js.map
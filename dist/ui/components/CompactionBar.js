"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const CompactionBar = ({ compaction }) => {
    const { stdout } = (0, ink_1.useStdout)();
    const cols = stdout?.columns ?? 100;
    const prefixLen = '  Compact  ['.length;
    const suffixLen = `]  100%  ► warn 60%  ► auto 80%`.length;
    const barWidth = Math.max(cols - prefixLen - suffixLen - 6, 10);
    const usedFilled = Math.round(compaction.usedPct * barWidth);
    const warnPos = Math.round(compaction.warnAt * barWidth);
    const compactPos = Math.round(compaction.compactAt * barWidth);
    const empty = barWidth - usedFilled;
    const barColor = compaction.usedPct >= compaction.compactAt ? 'red'
        : compaction.usedPct >= compaction.warnAt ? 'yellow'
            : 'green';
    const pctDisplay = `${Math.round(compaction.usedPct * 100)}%`;
    const warnLabel = `${Math.round(compaction.warnAt * 100)}%`;
    const autoLabel = `${Math.round(compaction.compactAt * 100)}%`;
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  Compact  [" }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: barColor, children: '█'.repeat(usedFilled) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: '░'.repeat(empty) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "]  " }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: barColor, bold: compaction.usedPct >= compaction.warnAt, children: pctDisplay }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  \u25BA warn " }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "yellow", children: warnLabel }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  \u25BA auto " }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "red", children: autoLabel })] }));
};
exports.default = CompactionBar;
//# sourceMappingURL=CompactionBar.js.map
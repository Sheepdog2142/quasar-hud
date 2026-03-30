"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const RequestsBar = ({ requests }) => {
    const { stdout } = (0, ink_1.useStdout)();
    const cols = stdout?.columns ?? 100;
    const { usedThisPeriod: used, limit, periodLabel } = requests;
    const pct = limit ? Math.min(used / limit, 1) : undefined;
    const barColor = pct === undefined ? 'green'
        : pct >= 0.80 ? 'red'
            : pct >= 0.50 ? 'yellow'
                : 'green';
    if (pct !== undefined) {
        const prefix = '  Requests [';
        const suffix = `]  ${used} / ${limit}  (${Math.round(pct * 100)}%)  ${periodLabel}`;
        const barWidth = Math.max(cols - prefix.length - suffix.length - 4, 10);
        const filled = Math.round(pct * barWidth);
        const empty = barWidth - filled;
        return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: prefix }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: barColor, children: '█'.repeat(filled) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: '░'.repeat(empty) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "]  " }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: barColor, bold: pct >= 0.50, children: [used, " / ", limit] }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: ["  (", Math.round(pct * 100), "%)  ", periodLabel] })] }));
    }
    // No limit configured — show raw count with hint
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  Requests  " }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "green", bold: true, children: used }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: [" this period  (", periodLabel, ")"] }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", dimColor: true, children: "  \u00B7 set COPILOT_MONTHLY_REQUESTS=N for progress bar" })] }));
};
exports.default = RequestsBar;
//# sourceMappingURL=RequestsBar.js.map
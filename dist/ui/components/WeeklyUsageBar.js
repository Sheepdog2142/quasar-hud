"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const utils_1 = require("../../utils");
const WeeklyUsageBar = ({ weeklyUsage }) => {
    const { stdout } = (0, ink_1.useStdout)();
    const cols = stdout?.columns ?? 100;
    const { tokensUsed, limit, periodDays, sessionsCount } = weeklyUsage;
    const pct = limit ? Math.min(tokensUsed / limit, 1) : undefined;
    const barColor = pct === undefined ? 'cyan'
        : pct >= 0.80 ? 'red'
            : pct >= 0.60 ? 'yellow'
                : 'cyan';
    if (pct !== undefined) {
        const used = (0, utils_1.formatTokens)(tokensUsed);
        const cap = (0, utils_1.formatTokens)(limit);
        const prefix = '  Weekly   [';
        const suffix = `]  ${used} / ${cap}  (${Math.round(pct * 100)}%)  ${sessionsCount} sessions`;
        const barWidth = Math.max(cols - prefix.length - suffix.length - 4, 10);
        const filled = Math.round(pct * barWidth);
        const empty = barWidth - filled;
        return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: prefix }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: barColor, children: '█'.repeat(filled) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: '░'.repeat(empty) }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "]  " }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: barColor, bold: pct >= 0.60, children: [used, " / ", cap] }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: ["  (", Math.round(pct * 100), "%)  ", sessionsCount, " sessions"] })] }));
    }
    // No limit — show raw burn totals
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  Weekly   " }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "cyan", bold: true, children: (0, utils_1.formatTokens)(tokensUsed) }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: [" tokens  \u00B7  ", sessionsCount, " sessions  \u00B7  ", periodDays, "d window"] }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", dimColor: true, children: "  \u00B7 set CLAUDE_WEEKLY_TOKENS=N for progress bar" })] }));
};
exports.default = WeeklyUsageBar;
//# sourceMappingURL=WeeklyUsageBar.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const utils_1 = require("../../utils");
// Defined outside the component so React sees a stable component reference across renders.
const Sep = () => (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  \u2502  " });
/** Single-line HUD summary — toggled on with the 'c' key. */
const CompactBar = ({ data, identity, readTimeMs }) => {
    const ctx = data.tokens;
    const ctxPct = ctx ? Math.round(ctx.pct * 100) : null;
    const ctxColor = !ctx ? 'gray'
        : ctx.pct >= 0.8 ? 'red'
            : ctx.pct >= 0.6 ? 'yellow'
                : 'green';
    const cost = data.costEstimate;
    const costColor = !cost ? 'gray'
        : cost.totalUsd >= 1 ? 'red'
            : cost.totalUsd >= 0.1 ? 'yellow'
                : 'green';
    const costStr = cost
        ? (cost.totalUsd < 0.01 ? `$${cost.totalUsd.toFixed(4)}` : `$${cost.totalUsd.toFixed(3)}`)
        : null;
    const elapsed = data.startedAt
        ? (0, utils_1.formatDuration)(Date.now() - data.startedAt.getTime())
        : null;
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsxs)(ink_1.Text, { bold: true, color: identity.color, children: [identity.symbol, "  ", identity.label] }), data.model ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "cyan", children: data.model })] })) : null, ctxPct !== null ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: ctxColor, children: [ctxPct, "% ctx"] })] })) : null, costStr ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: costColor, children: costStr })] })) : null, data.gitBranch ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "blue", children: [" ", data.gitBranch] })] })) : null, data.mode && data.mode !== 'interactive' && data.mode !== 'unknown' ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: data.mode === 'autopilot' ? 'yellow' : 'green', children: data.mode })] })) : null, data.turnCount !== undefined ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: [data.turnCount, "t"] })] })) : null, elapsed ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: ["\u23F1 ", elapsed] })] })) : null, readTimeMs !== undefined ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Sep, {}), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", dimColor: true, children: [readTimeMs, "ms"] })] })) : null] }));
};
exports.default = CompactBar;
//# sourceMappingURL=CompactBar.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const utils_1 = require("../../utils");
const SessionRow = ({ data, identity }) => {
    const elapsed = data.startedAt
        ? (0, utils_1.formatDuration)(Date.now() - data.startedAt.getTime())
        : null;
    const modeLabel = data.mode && data.mode !== 'unknown'
        ? data.mode
        : null;
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsxs)(ink_1.Text, { bold: true, color: identity.color, children: [identity.symbol, "  ", identity.label] }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "\u2502" }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "white", children: data.sessionName ?? data.sessionId?.slice(0, 8) ?? '—' }), data.model ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "\u2502" }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "cyan", children: data.model })] })) : null, modeLabel ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "\u2502" }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: modeLabel === 'autopilot' ? 'yellow' : 'green', children: modeLabel })] })) : null, data.gitBranch ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "\u2502" }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "blue", children: [" ", data.gitBranch] })] })) : null, data.turnCount !== undefined ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "\u2502" }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: [data.turnCount, " turns"] })] })) : null, elapsed ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "\u2502" }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: ["\u23F1 ", elapsed] })] })) : null] }));
};
exports.default = SessionRow;
//# sourceMappingURL=SessionRow.js.map
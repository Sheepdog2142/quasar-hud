"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const MCPRow = ({ data, identity }) => {
    const { mcpServers = [], contextMode } = data;
    if (!mcpServers.length && !contextMode?.installed) {
        return (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  MCP  \u2014  no servers configured" });
    }
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  MCP  " }), mcpServers.map(srv => ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "row", marginRight: 2, children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: srv.connected ? 'green' : 'red', children: "\u25CF  " }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: srv.name === 'context-mode' ? identity.color : 'white', children: srv.name })] }, srv.name))), contextMode?.installed ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "\u2502" }), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: identity.color, children: "\u26A1 context-mode" }), contextMode.tokensSaved !== undefined && contextMode.tokensSaved > 0 ? ((0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "green", children: [" saved ~", contextMode.tokensSaved.toLocaleString(), " tokens"] })) : ((0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: " (active)" }))] })) : null] }));
};
exports.default = MCPRow;
//# sourceMappingURL=MCPRow.js.map
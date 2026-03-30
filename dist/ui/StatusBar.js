"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const index_1 = require("./logos/index");
const TokenBar_1 = __importDefault(require("./components/TokenBar"));
const CompactionBar_1 = __importDefault(require("./components/CompactionBar"));
const MCPRow_1 = __importDefault(require("./components/MCPRow"));
const SessionRow_1 = __importDefault(require("./components/SessionRow"));
const RequestsBar_1 = __importDefault(require("./components/RequestsBar"));
const WeeklyUsageBar_1 = __importDefault(require("./components/WeeklyUsageBar"));
const CostRow_1 = __importDefault(require("./components/CostRow"));
const Divider = ({ width }) => ((0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: '─'.repeat(Math.max(width - 2, 10)) }));
const StatusBar = ({ data, config }) => {
    const { stdout } = (0, ink_1.useStdout)();
    const cols = stdout?.columns ?? 100;
    const identity = (0, index_1.getIdentity)(data.cli);
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", borderStyle: "round", borderColor: identity.color, width: cols - 1, paddingX: 1, children: [(0, jsx_runtime_1.jsx)(SessionRow_1.default, { data: data, identity: identity }), data.tokens ? ((0, jsx_runtime_1.jsx)(TokenBar_1.default, { tokens: data.tokens, color: identity.accentColor })) : ((0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "  Context  \u2014  no token data yet" })), data.compaction ? ((0, jsx_runtime_1.jsx)(CompactionBar_1.default, { compaction: data.compaction })) : null, config.showRequests && data.requests ? ((0, jsx_runtime_1.jsx)(RequestsBar_1.default, { requests: data.requests })) : null, config.showWeeklyUsage && data.weeklyUsage ? ((0, jsx_runtime_1.jsx)(WeeklyUsageBar_1.default, { weeklyUsage: data.weeklyUsage })) : null, data.costEstimate ? ((0, jsx_runtime_1.jsx)(CostRow_1.default, { cost: data.costEstimate, color: identity.accentColor })) : null, (0, jsx_runtime_1.jsx)(MCPRow_1.default, { data: data, identity: identity }), data.notice ? ((0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "yellow", children: ["  \u26A0  ", data.notice] })) : null] }));
};
exports.default = StatusBar;
//# sourceMappingURL=StatusBar.js.map
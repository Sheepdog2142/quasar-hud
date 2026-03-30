"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI_IDENTITIES = void 0;
exports.getIdentity = getIdentity;
exports.CLI_IDENTITIES = {
    copilot: {
        symbol: '⬡',
        label: 'GitHub Copilot CLI',
        color: 'cyan',
        accentColor: 'blue',
    },
    claude: {
        symbol: '◆',
        label: 'Claude Code',
        color: 'magenta',
        accentColor: '#c97b4b',
    },
    codex: {
        symbol: '⬤',
        label: 'Codex CLI',
        color: 'green',
        accentColor: 'cyan',
    },
    unknown: {
        symbol: '●',
        label: 'AI CLI',
        color: 'white',
        accentColor: 'gray',
    },
};
function getIdentity(cli) {
    return exports.CLI_IDENTITIES[cli] ?? exports.CLI_IDENTITIES['unknown'];
}
//# sourceMappingURL=index.js.map
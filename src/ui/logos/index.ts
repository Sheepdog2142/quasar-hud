import type { CLIName } from '../../types';

export interface CLIIdentity {
  symbol: string;       // single glyph shown in the header
  label: string;        // full display name
  color: string;        // ink color string
  accentColor: string;  // secondary color for bars/badges
}

export const CLI_IDENTITIES: Record<CLIName, CLIIdentity> = {
  copilot: {
    symbol:      '⬡',
    label:       'GitHub Copilot CLI',
    color:       'cyan',
    accentColor: 'blue',
  },
  claude: {
    symbol:      '◆',
    label:       'Claude Code',
    color:       'magenta',
    accentColor: '#c97b4b',
  },
  codex: {
    symbol:      '⬤',
    label:       'Codex CLI',
    color:       'green',
    accentColor: 'cyan',
  },
  unknown: {
    symbol:      '●',
    label:       'AI CLI',
    color:       'white',
    accentColor: 'gray',
  },
};

export function getIdentity(cli: CLIName): CLIIdentity {
  return CLI_IDENTITIES[cli] ?? CLI_IDENTITIES['unknown'];
}

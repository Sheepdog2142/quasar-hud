import type { CLIName } from '../../types';
export interface CLIIdentity {
    symbol: string;
    label: string;
    color: string;
    accentColor: string;
}
export declare const CLI_IDENTITIES: Record<CLIName, CLIIdentity>;
export declare function getIdentity(cli: CLIName): CLIIdentity;

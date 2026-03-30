export declare function readYaml<T = Record<string, unknown>>(filePath: string): T | null;
export declare function readJson<T = Record<string, unknown>>(filePath: string): T | null;
export declare function readJsonLines<T = Record<string, unknown>>(filePath: string): T[];
export declare function readTomlFlat(filePath: string): Record<string, string>;
/** Return all subdirectory names of a given directory */
export declare function listDirs(dirPath: string): string[];
/** Find the most recently modified file matching a glob-like name pattern */
export declare function findMostRecent(dir: string, filePattern: RegExp): string | null;
/** Synchronously read the current git branch from .git/HEAD */
export declare function readGitBranch(cwd: string): string | undefined;
/** Check whether a process with the given PID is running */
export declare function isPidAlive(pid: number): boolean;
export declare function formatDuration(ms: number): string;
export declare function formatTokens(n: number): string;

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ─── YAML ─────────────────────────────────────────────────────────────────────

export function readYaml<T = Record<string, unknown>>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(raw) as T;
  } catch {
    return null;
  }
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function readJson<T = Record<string, unknown>>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

// ─── JSONL ────────────────────────────────────────────────────────────────────

export function readJsonLines<T = Record<string, unknown>>(filePath: string): T[] {
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    const results: T[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try { results.push(JSON.parse(trimmed) as T); } catch { /* skip malformed */ }
    }
    return results;
  } catch {
    return [];
  }
}

// ─── TOML (minimal key=value parser — covers Codex config.toml) ───────────────

export function readTomlFlat(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"?([^"#\n]+)"?/);
      if (m) result[m[1].trim()] = m[2].trim();
    }
  } catch { /* ignore */ }
  return result;
}

// ─── Directory helpers ────────────────────────────────────────────────────────

/** Return all subdirectory names of a given directory */
export function listDirs(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {
    return [];
  }
}

/** Find the most recently modified file matching a glob-like name pattern */
export function findMostRecent(dir: string, filePattern: RegExp): string | null {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isFile() && filePattern.test(e.name));
    if (!entries.length) return null;
    const withMtime = entries.map(e => {
      const full = path.join(dir, e.name);
      return { full, mtime: fs.statSync(full).mtimeMs };
    });
    withMtime.sort((a, b) => b.mtime - a.mtime);
    return withMtime[0].full;
  } catch {
    return null;
  }
}

// ─── Git branch ───────────────────────────────────────────────────────────────

/** Synchronously read the current git branch from .git/HEAD */
export function readGitBranch(cwd: string): string | undefined {
  try {
    let dir = cwd;
    // walk up to find .git
    for (let i = 0; i < 8; i++) {
      const headPath = path.join(dir, '.git', 'HEAD');
      if (fs.existsSync(headPath)) {
        const head = fs.readFileSync(headPath, 'utf-8').trim();
        const match = head.match(/^ref: refs\/heads\/(.+)$/);
        return match ? match[1] : head.slice(0, 8);
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch { /* ignore */ }
  return undefined;
}

// ─── Process detection ────────────────────────────────────────────────────────

/** Check whether a process with the given PID is running */
export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// ─── Time formatting ─────────────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

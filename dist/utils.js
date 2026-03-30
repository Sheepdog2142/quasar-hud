"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readYaml = readYaml;
exports.readJson = readJson;
exports.readJsonLines = readJsonLines;
exports.readTomlFlat = readTomlFlat;
exports.listDirs = listDirs;
exports.findMostRecent = findMostRecent;
exports.readGitBranch = readGitBranch;
exports.isPidAlive = isPidAlive;
exports.formatDuration = formatDuration;
exports.formatTokens = formatTokens;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
// ─── YAML ─────────────────────────────────────────────────────────────────────
function readYaml(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return yaml.load(raw);
    }
    catch {
        return null;
    }
}
// ─── JSON ─────────────────────────────────────────────────────────────────────
function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    catch {
        return null;
    }
}
// ─── JSONL ────────────────────────────────────────────────────────────────────
/** Max bytes to read from a JSONL file. Files larger than this are tail-read
 *  so we always get the most recent data without risking OOM on huge sessions. */
const MAX_JSONL_BYTES = 10 * 1024 * 1024; // 10 MB
function readJsonLines(filePath) {
    try {
        let content;
        const stat = fs.statSync(filePath);
        if (stat.size > MAX_JSONL_BYTES) {
            // Read only the tail of the file; the most recent events are at the end.
            const fd = fs.openSync(filePath, 'r');
            const buf = Buffer.allocUnsafe(MAX_JSONL_BYTES);
            fs.readSync(fd, buf, 0, MAX_JSONL_BYTES, stat.size - MAX_JSONL_BYTES);
            fs.closeSync(fd);
            const raw = buf.toString('utf-8');
            // Drop the first (likely partial) line so we only parse complete JSON objects.
            const firstNewline = raw.indexOf('\n');
            content = firstNewline >= 0 ? raw.slice(firstNewline + 1) : raw;
        }
        else {
            content = fs.readFileSync(filePath, 'utf-8');
        }
        const results = [];
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            try {
                results.push(JSON.parse(trimmed));
            }
            catch { /* skip malformed */ }
        }
        return results;
    }
    catch {
        return [];
    }
}
// ─── TOML (minimal key=value parser — covers Codex config.toml) ───────────────
function readTomlFlat(filePath) {
    const result = {};
    try {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
        for (const line of lines) {
            const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"?([^"#\n]+)"?/);
            if (m)
                result[m[1].trim()] = m[2].trim();
        }
    }
    catch { /* ignore */ }
    return result;
}
// ─── Directory helpers ────────────────────────────────────────────────────────
/** Return all subdirectory names of a given directory */
function listDirs(dirPath) {
    try {
        return fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
    }
    catch {
        return [];
    }
}
/** Find the most recently modified file matching a glob-like name pattern */
function findMostRecent(dir, filePattern) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
            .filter(e => e.isFile() && filePattern.test(e.name));
        if (!entries.length)
            return null;
        const withMtime = entries.map(e => {
            const full = path.join(dir, e.name);
            return { full, mtime: fs.statSync(full).mtimeMs };
        });
        withMtime.sort((a, b) => b.mtime - a.mtime);
        return withMtime[0].full;
    }
    catch {
        return null;
    }
}
// ─── Git branch ───────────────────────────────────────────────────────────────
/** Synchronously read the current git branch from .git/HEAD */
function readGitBranch(cwd) {
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
            if (parent === dir)
                break;
            dir = parent;
        }
    }
    catch { /* ignore */ }
    return undefined;
}
// ─── Process detection ────────────────────────────────────────────────────────
/** Check whether a process with the given PID is running */
function isPidAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
// ─── Time formatting ─────────────────────────────────────────────────────────
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0)
        return `${h}h ${m % 60}m`;
    if (m > 0)
        return `${m}m ${s % 60}s`;
    return `${s}s`;
}
function formatTokens(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}
//# sourceMappingURL=utils.js.map
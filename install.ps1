#!/usr/bin/env pwsh
# Quasar HUD — Windows installer
# Usage: iex (irm https://raw.githubusercontent.com/Sheepdog2142/quasar-hud/main/install.ps1)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step  { param($msg) Write-Host "  → $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Fail  { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  ⬡  Quasar HUD installer" -ForegroundColor Magenta
Write-Host ""

# ── Node.js check ──────────────────────────────────────────────────────────────
Write-Step "Checking Node.js..."
try {
    $nodeVersion = node --version 2>$null
    $nodeMajor   = [int]($nodeVersion -replace 'v(\d+).*','$1')
    if ($nodeMajor -lt 18) { Write-Fail "Node.js >=18 required (found $nodeVersion). Get it at https://nodejs.org" }
    Write-Ok "Node.js $nodeVersion"
} catch {
    Write-Fail "Node.js not found. Install it from https://nodejs.org then re-run this script."
}

# ── Install ────────────────────────────────────────────────────────────────────
Write-Step "Installing Quasar HUD..."
npm install -g "git+https://github.com/Sheepdog2142/quasar-hud.git" --silent
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed. Check the error above." }
Write-Ok "Installed"

# ── Done ───────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ✅ Quasar HUD is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    qhud-setup enable --cli=copilot   # auto-launch with GitHub Copilot" -ForegroundColor DarkCyan
Write-Host "    qhud-setup enable --cli=claude    # auto-launch with Claude Code" -ForegroundColor DarkCyan
Write-Host "    qhud-setup enable --cli=codex     # auto-launch with Codex CLI" -ForegroundColor DarkCyan
Write-Host "    qhud --cli=copilot                # run manually" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Reload your shell profile after setup: . `$PROFILE" -ForegroundColor DarkGray
Write-Host ""

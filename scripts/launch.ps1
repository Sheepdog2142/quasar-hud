#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Universal Quasar HUD launcher for Windows Terminal.
    Opens a split pane: HUD on top, AI CLI on bottom.

.PARAMETER CLI
    Which AI CLI to launch: copilot | claude | codex

.PARAMETER HUDRows
    Height of the HUD pane in rows (default: 9)

.PARAMETER Refresh
    HUD refresh interval in seconds (default: 2)

.EXAMPLE
    .\launch.ps1 -CLI copilot
    .\launch.ps1 -CLI codex -HUDRows 10
#>
param(
    [Parameter(Mandatory)]
    [ValidateSet('copilot', 'claude', 'codex')]
    [string]$CLI,

    [int]$HUDRows = 9,

    [int]$Refresh = 2,

    [string]$WorkDir = (Get-Location).Path
)

$ScriptDir = $PSScriptRoot
$ProjectDir = Split-Path $ScriptDir -Parent

# ── Resolve CLI command ───────────────────────────────────────────────────────
$cliCmd = switch ($CLI) {
    'copilot' { 'copilot' }
    'claude'  { 'claude' }
    'codex'   { 'codex' }
}

# ── Resolve HUD command ───────────────────────────────────────────────────────
$hudScript = Join-Path $ProjectDir 'src\index.tsx'
$hudCmd    = "tsx `"$hudScript`" --cli=$CLI --refresh=$Refresh"

# Try to use compiled dist if available
$distIndex = Join-Path $ProjectDir 'dist\index.js'
if (Test-Path $distIndex) {
    $hudCmd = "node `"$distIndex`" --cli=$CLI --refresh=$Refresh"
}

# ── Set QHUD_CLI env for the HUD process ─────────────────────────────────────
$env:QHUD_CLI = $CLI

# ── Launch in Windows Terminal ────────────────────────────────────────────────
$wtAvailable = Get-Command 'wt' -ErrorAction SilentlyContinue

if ($wtAvailable) {
    # Split pane: top pane = HUD, bottom pane = AI CLI
    $wtArgs = @(
        '--window', '0',
        'new-tab', '--title', "Quasar HUD — $CLI", '--startingDirectory', $WorkDir,
        'split-pane', '--horizontal', '--size', (1.0 - ($HUDRows / 40)),
        '--', 'pwsh', '-NoExit', '-Command', $hudCmd,
        ';', 'focus-pane', '--target', '0',
        ';', 'move-pane', '--direction', 'up',
        ';', 'split-pane', '--target', '0', '--horizontal',
        '--', 'pwsh', '-NoExit', '-Command', "Set-Location '$WorkDir'; $cliCmd"
    )
    Write-Host "Launching Quasar HUD + $CLI in Windows Terminal…" -ForegroundColor Cyan
    Start-Process 'wt' -ArgumentList $wtArgs
} else {
    # Fallback: open two separate windows
    Write-Host "Windows Terminal (wt) not found — opening separate windows." -ForegroundColor Yellow
    Write-Host "HUD:  $hudCmd"
    Write-Host "CLI:  $cliCmd"

    Start-Process 'pwsh' -ArgumentList "-NoExit", "-Command", $hudCmd
    Start-Sleep -Seconds 1
    Start-Process 'pwsh' -ArgumentList "-NoExit", "-Command", "Set-Location '$WorkDir'; $cliCmd"
}

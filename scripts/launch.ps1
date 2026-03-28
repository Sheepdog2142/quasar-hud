#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Universal Quasar HUD launcher for Windows Terminal.
    Opens a horizontal split in a new tab:
        TOP pane  (small) → Quasar HUD live display
        BOTTOM pane (large) → your AI CLI session

.PARAMETER CLI
    Which AI CLI to launch: copilot | claude | codex

.PARAMETER HUDPercent
    Percentage of the terminal height the HUD pane uses (default: 22).

.PARAMETER Refresh
    HUD refresh interval in seconds (default: 2)

.EXAMPLE
    .\launch.ps1 -CLI copilot
    .\launch.ps1 -CLI claude -HUDPercent 25
#>
param(
    [Parameter(Mandatory)]
    [ValidateSet('copilot', 'claude', 'codex')]
    [string]$CLI,

    [ValidateRange(10, 40)]
    [int]$HUDPercent = 22,

    [ValidateRange(1, 30)]
    [int]$Refresh = 2,

    [string]$WorkDir = (Get-Location).Path
)

$ScriptDir = $PSScriptRoot
$HudRunner = Join-Path $ScriptDir 'hud-runner.ps1'

# The CLI pane gets the larger share; HUD is the remainder at the top.
# wt split-pane --size is the fraction the NEW (bottom) pane receives.
$cliPct = [math]::Round((100 - $HUDPercent) / 100.0, 2)

$wt = Get-Command 'wt.exe' -ErrorAction SilentlyContinue

if ($wt) {
    # Build Windows Terminal command string.
    #
    # Strategy:
    #   new-tab  → opens a fresh tab; the first pane runs the HUD (top)
    #   ; split-pane --horizontal --size $cliPct
    #              → splits below the HUD; CLI runs in the larger bottom pane
    #
    # We use -File instead of -Command for the HUD pane to avoid inner-quote
    # escaping issues with paths that contain spaces.

    $wtArgs = (
        "--window 0 " +
        "new-tab " +
            "--title `"Quasar HUD — $CLI`" " +
            "--startingDirectory `"$WorkDir`" " +
            "-- pwsh -NoExit -File `"$HudRunner`" -CLI $CLI -Refresh $Refresh " +
        "; split-pane " +
            "--horizontal " +
            "--size $cliPct " +
            "--startingDirectory `"$WorkDir`" " +
            "-- pwsh -NoExit -Command $CLI"
    )

    Write-Host "▶  Launching Quasar HUD in Windows Terminal…" -ForegroundColor Cyan
    Write-Host "   HUD: top $HUDPercent%   $CLI`: bottom $([math]::Round(100 - $HUDPercent))%" -ForegroundColor Gray
    Start-Process 'wt.exe' -ArgumentList $wtArgs

} else {
    # Fallback: no Windows Terminal — open HUD in a separate pwsh window, then
    # run the CLI in the current terminal so the user can still use both.
    Write-Host "⚠  Windows Terminal (wt.exe) not found — opening HUD in a separate window." -ForegroundColor Yellow
    Write-Host "   Install Windows Terminal from the Microsoft Store for the best experience." -ForegroundColor Gray

    Start-Process 'pwsh' -ArgumentList "-NoExit -File `"$HudRunner`" -CLI $CLI -Refresh $Refresh"
    Start-Sleep -Seconds 1
    & $CLI
}


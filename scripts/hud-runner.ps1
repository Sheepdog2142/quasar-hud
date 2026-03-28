#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Internal helper: runs the Quasar HUD process inside a pane.
    Called by launch.ps1 when Windows Terminal opens the HUD split pane.

.PARAMETER CLI
    Which CLI to monitor: copilot | claude | codex

.PARAMETER Refresh
    Refresh interval in seconds (default 2)
#>
param(
    [ValidateSet('copilot', 'claude', 'codex')]
    [string]$CLI = 'copilot',

    [ValidateRange(1, 300)]
    [int]$Refresh = 2
)

$ProjectDir = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectDir

$distIndex  = Join-Path $ProjectDir 'dist\index.js'
$tsNodeBin  = Join-Path $ProjectDir 'node_modules\.bin\ts-node.cmd'
$entryPoint = Join-Path $ProjectDir 'src\index.tsx'

if (Test-Path $distIndex) {
    node $distIndex --cli=$CLI --refresh=$Refresh
} elseif (Test-Path $tsNodeBin) {
    & $tsNodeBin --transpile-only $entryPoint --cli=$CLI --refresh=$Refresh
} else {
    Write-Error "Could not find compiled dist\index.js or node_modules\.bin\ts-node.cmd`nRun 'npm install' inside $ProjectDir first."
    exit 1
}

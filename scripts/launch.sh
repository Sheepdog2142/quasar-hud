#!/usr/bin/env bash
# Quasar HUD universal launcher (Linux / macOS — tmux required)
# Usage: ./launch.sh copilot|claude|codex [--refresh=N] [--work-dir=PATH]

set -euo pipefail

CLI="${1:-}"
REFRESH="${2:-2}"
WORK_DIR="${3:-$PWD}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -z "$CLI" ]]; then
  echo "Usage: $0 <copilot|claude|codex> [refresh_secs] [work_dir]" >&2
  exit 1
fi

# Resolve HUD command
DIST_INDEX="$PROJECT_DIR/dist/index.js"
if [[ -f "$DIST_INDEX" ]]; then
  HUD_CMD="node \"$DIST_INDEX\" --cli=$CLI --refresh=$REFRESH"
else
  HUD_CMD="tsx \"$PROJECT_DIR/src/index.tsx\" --cli=$CLI --refresh=$REFRESH"
fi

CLI_CMD="$CLI"
SESSION="qhud-$CLI"

if command -v tmux &>/dev/null; then
  tmux new-session -d -s "$SESSION" -x "$(tput cols)" -y "$(tput lines)"
  # Top pane: HUD (8 lines tall)
  tmux send-keys -t "$SESSION" "export QHUD_CLI=$CLI && $HUD_CMD" Enter
  # Bottom pane: AI CLI
  tmux split-window -t "$SESSION" -v -p 85
  tmux send-keys -t "$SESSION" "cd \"$WORK_DIR\" && $CLI_CMD" Enter
  # Focus bottom pane by default
  tmux select-pane -t "$SESSION" -D
  tmux attach -t "$SESSION"
else
  echo "tmux not found — starting HUD and CLI in separate terminal tabs is not automated on this system." >&2
  echo "HUD:  $HUD_CMD"
  echo "CLI:  cd \"$WORK_DIR\" && $CLI_CMD"
  exit 1
fi

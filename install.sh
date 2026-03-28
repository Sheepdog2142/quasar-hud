#!/usr/bin/env bash
# Quasar HUD — Unix/macOS installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Sheepdog2142/quasar-hud/main/install.sh | bash

set -e

BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
RED="\033[31m"
GRAY="\033[90m"
RESET="\033[0m"

step() { echo -e "  ${CYAN}→ $1${RESET}"; }
ok()   { echo -e "  ${GREEN}✓ $1${RESET}"; }
fail() { echo -e "  ${RED}✗ $1${RESET}"; exit 1; }

echo ""
echo -e "  ${BOLD}⬡  Quasar HUD installer${RESET}"
echo ""

# ── Node.js check ──────────────────────────────────────────────────────────────
step "Checking Node.js..."
if ! command -v node &>/dev/null; then
    fail "Node.js not found. Install it from https://nodejs.org then re-run this script."
fi
NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
    fail "Node.js >=18 required (found $NODE_VERSION). Get it at https://nodejs.org"
fi
ok "Node.js $NODE_VERSION"

# ── Install ────────────────────────────────────────────────────────────────────
step "Installing Quasar HUD..."
npm install -g "git+https://github.com/Sheepdog2142/quasar-hud.git" --silent
ok "Installed"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}✅ Quasar HUD is ready!${RESET}"
echo ""
echo -e "  Next steps:"
echo -e "  ${CYAN}  qhud-setup enable --cli=copilot   ${GRAY}# auto-launch with GitHub Copilot${RESET}"
echo -e "  ${CYAN}  qhud-setup enable --cli=claude    ${GRAY}# auto-launch with Claude Code${RESET}"
echo -e "  ${CYAN}  qhud-setup enable --cli=codex     ${GRAY}# auto-launch with Codex CLI${RESET}"
echo -e "  ${CYAN}  qhud --cli=copilot                ${GRAY}# run manually${RESET}"
echo ""
echo -e "  ${GRAY}Reload your shell after setup: source ~/.bashrc  (or ~/.zshrc)${RESET}"
echo ""

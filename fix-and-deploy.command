#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo ""
echo "═══════════════════════════════════════"
echo "  Tracker — GitHub Pages Deploy"
echo "═══════════════════════════════════════"
echo ""

# ── Step 1: Clean any broken .git and reinit ──
echo "Cleaning broken git state..."
rm -rf .git
git init
git branch -m main
git config user.email "ashrockstar022@gmail.com"
git config user.name "Aneesh Kumar"
echo "✓ Git initialised"

# ── Step 2: Stage and commit everything ──
git add .
git commit -m "feat: initial release — Tracker v0.1.0"
echo "✓ Committed"

# ── Step 3: Prompt for GitHub repo ──
echo ""
echo "─────────────────────────────────────────"
echo "  Create the GitHub repo now:"
echo "─────────────────────────────────────────"
echo ""
open "https://github.com/new"
echo "  Fill in:"
echo "    Repository name : tracker"
echo "    Visibility       : Public"
echo "    Do NOT check 'Add README' or any other files"
echo ""
read -p "  Paste the repo URL (e.g. https://github.com/you/tracker.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "No URL entered. Exiting."
  exit 1
fi

# ── Step 4: Push ──
git remote add origin "$REPO_URL"
echo ""
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "═══════════════════════════════════════"
echo "  Pushed."
echo ""
PAGES_URL=$(echo "$REPO_URL" | sed 's|https://github.com/||' | sed 's|\.git$||' | awk -F/ '{print "https://"$1".github.io/"$2"/"}')
echo "  Final step: enable Pages"
echo "  Repo Settings → Pages → Source → GitHub Actions"
echo ""
echo "  Live at: $PAGES_URL"
echo "  (after the Actions workflow completes, ~60s)"
echo "═══════════════════════════════════════"
echo ""

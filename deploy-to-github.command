#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo ""
echo "═══════════════════════════════════════"
echo "  Tracker — GitHub Pages Deploy"
echo "═══════════════════════════════════════"
echo ""

# ── Step 1: Git init ──
# If .git exists but git status fails, it's broken — remove and reinit
if [ -d ".git" ]; then
  if ! git status &>/dev/null; then
    echo "Found broken .git — cleaning up..."
    rm -rf .git
  fi
fi

if [ ! -d ".git" ]; then
  git init
  git branch -m main
  echo "✓ Git initialised"
else
  git checkout -B main 2>/dev/null || true
  echo "✓ Git already initialised"
fi

# ── Step 2: Configure identity if not set ──
if [ -z "$(git config user.email)" ]; then
  git config user.email "ashrockstar022@gmail.com"
  git config user.name "Aneesh Kumar"
fi

# ── Step 3: Stage and commit ──
git add .
if git diff --cached --quiet; then
  echo "✓ Nothing new to commit"
else
  git commit -m "feat: initial release — Tracker v0.1.0"
  echo "✓ Committed"
fi

# ── Step 4: Create GitHub repo ──
echo ""
echo "─────────────────────────────────────────"
echo "  Next: create the GitHub repo"
echo "─────────────────────────────────────────"
echo ""
echo "  Opening github.com/new in your browser..."
echo ""
open "https://github.com/new"

echo "  Fill in:"
echo "    Repository name : tracker  (or any name)"
echo "    Visibility       : Public"
echo "    Leave everything else unchecked"
echo ""
read -p "  Paste the repo URL here (e.g. https://github.com/you/tracker.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "No URL entered. Exiting."
  exit 1
fi

# ── Step 5: Set remote and push ──
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo ""
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "═══════════════════════════════════════"
echo "  Done."
echo ""

# Extract username and repo name from URL for the Pages URL
PAGES_URL=$(echo "$REPO_URL" | sed 's|https://github.com/||' | sed 's|\.git$||' | awk -F/ '{print "https://"$1".github.io/"$2"/"}')
echo "  Live URL (after Actions run ~60s):"
echo "  $PAGES_URL"
echo ""
echo "  To enable Pages:"
echo "  GitHub repo → Settings → Pages → Source → GitHub Actions"
echo "═══════════════════════════════════════"
echo ""

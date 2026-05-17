#!/bin/bash
set -e

REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GH_USER="aneeshk-ds"
REPO="smoking-tracker"

echo ""
echo "═══════════════════════════════════════"
echo "  Push v0.6.0 — Headspace redesign"
echo "═══════════════════════════════════════"
echo ""

cd "$REPO_DIR"

# Remove any stale lock files from sandbox operations
rm -f .git/HEAD.lock .git/index.lock .git/objects/maintenance.lock 2>/dev/null || true

# Get token
CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)
if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi

if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: No GitHub token found."
  exit 1
fi

# Stage all changes
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
  echo "Nothing new to commit — pushing existing HEAD."
else
  git -c user.email="aneesh@tracker-update" -c user.name="Aneesh Kumar" \
    commit -m "feat: v0.6.0 — Headspace/Atmosphere redesign

- Deep navy palette (#0D1420) with warm amber streak accent
- SF Pro Display bold for headings + SF Pro Text normal for body
- BreathingOrb hero on home — pulsing orb shows today count
- StreakDisplay — fire icon, day count (bold), personal best, shield
- Journey page — 12-week calendar grid, achievement badges, health milestones
- History page — full log with Today/Week/Month/All filter chips
- AchievementBadge component — 11 badges from Day One to 100 Days
- achievements.js — badge engine, weekly XP, shield logic, calendar grid
- BottomNav — 5 tabs: Home | History | Journey | Insights | Settings
- Frosted glass nav bar with backdrop blur"
fi

# Push
git push "https://$GH_TOKEN@github.com/$GH_USER/$REPO.git" HEAD 2>&1 \
  | grep -v "token" | grep -v "https://"

echo ""
echo "Pushed. CI is building..."
echo "  https://github.com/$GH_USER/$REPO/actions"
echo ""

open "https://github.com/$GH_USER/$REPO/actions"

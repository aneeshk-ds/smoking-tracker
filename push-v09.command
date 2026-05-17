#!/bin/bash
set -e

REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GH_USER="aneeshk-ds"
REPO="smoking-tracker"

echo ""
echo "═══════════════════════════════════════"
echo "  Push v0.9.0 — Dual streak display"
echo "═══════════════════════════════════════"
echo ""

cd "$REPO_DIR"

rm -f .git/HEAD.lock .git/index.lock .git/objects/maintenance.lock 2>/dev/null || true

CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)
if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi

if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: No GitHub token found."
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "Nothing new to commit — pushing existing HEAD."
else
  git -c user.email="aneesh@tracker-update" -c user.name="Aneesh Kumar" \
    commit -m "feat: v0.9.0 — Dual streak display

- streaks.js: computeSmokingStreak() — consecutive days with any smoking, backwards from today
- storage.js: getSmokingStreak() export
- StreakDisplay: two-column card — left (violet flame) = clean/on-target days, right (red cigarette) = smoking days in a row
- Home.jsx: loads smokingStreak, passes to StreakDisplay
- Journey.jsx: loads smokingStreak, StreakSummaryCard updated with same two-column layout
- Awareness mode users also see the smoking streak (was hidden before)"
fi

git push "https://$GH_TOKEN@github.com/$GH_USER/$REPO.git" HEAD 2>&1 \
  | grep -v "token" | grep -v "https://"

echo ""
echo "Pushed. CI is building..."
echo "  https://github.com/$GH_USER/$REPO/actions"
echo ""

open "https://github.com/$GH_USER/$REPO/actions"

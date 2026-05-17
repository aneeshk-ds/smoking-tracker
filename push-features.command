#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo ""
echo "═══════════════════════════════════════"
echo "  Smoking Tracker — Push v0.2.0 features"
echo "═══════════════════════════════════════"
echo ""

git add \
  src/lib/storage.js \
  src/lib/streaks.js \
  src/lib/backup.js \
  src/components/WeekMonthSnapshot.jsx \
  src/components/TodayLog.jsx \
  src/components/EditEntryModal.jsx \
  src/components/HonestStreakDisplay.jsx \
  src/routes/Home.jsx \
  src/routes/Settings.jsx

git commit -m "feat: week/month snapshot, editable entries, momentum streak, folder backup"

GH_USER="aneeshk-ds"
REPO="smoking-tracker"

CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)
if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi

AUTH_URL="https://$GH_TOKEN@github.com/$GH_USER/$REPO.git"
git push "$AUTH_URL" main 2>&1 | grep -v "token" | grep -v "https://"

echo ""
echo "✓ Pushed. Building now (~60s)."
echo "  https://$GH_USER.github.io/$REPO/"
echo ""

open "https://github.com/$GH_USER/$REPO/actions"

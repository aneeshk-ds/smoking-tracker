#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo ""
echo "═══════════════════════════════════════"
echo "  Smoking Tracker — Push rename update"
echo "═══════════════════════════════════════"
echo ""

git add index.html public/manifest.json src/routes/Settings.jsx \
        src/components/InstallBanner.jsx src/lib/print-report.js README.md

git commit -m "chore: rename app to Smoking Tracker"

CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_USER=$(echo "$CRED" | grep '^username=' | cut -d= -f2)
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)

if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi

AUTH_URL="https://$GH_TOKEN@github.com/$GH_USER/tracker.git"
git push "$AUTH_URL" main 2>&1 | grep -v "token" | grep -v "https://"

echo ""
echo "✓ Pushed. GitHub Actions is rebuilding now (~60s)."
echo ""
echo "  Live at: https://$GH_USER.github.io/tracker/"
echo ""

open "https://github.com/$GH_USER/tracker/actions"

#!/bin/bash
set -e

REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GH_USER="aneeshk-ds"
REPO="smoking-tracker"

echo ""
echo "═══════════════════════════════════════"
echo "  Push v0.6b — cigarette icons"
echo "═══════════════════════════════════════"
echo ""

cd "$REPO_DIR"
rm -f .git/HEAD.lock .git/index.lock .git/objects/maintenance.lock 2>/dev/null || true

CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)
if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi
[ -z "$GH_TOKEN" ] && echo "ERROR: No token." && exit 1

git add -A

if git diff --cached --quiet; then
  echo "Nothing to commit — pushing existing HEAD."
else
  git -c user.email="aneesh@tracker-update" -c user.name="Aneesh Kumar" \
    commit -m "feat: cigarette icons throughout the UI

- BottomNav: Home = cig with smoke wisps, History = cig + log lines, Journey = vertical cig as milestone marker
- Log button: cigarette SVG replaces the generic plus icon
- Home quick-log CTA: cigarette icon
- favicon.svg: cigarette on dark navy circle with amber ember glow
- Insights and Settings keep standard icons (data/config don't need cig theming)"
fi

git push "https://$GH_TOKEN@github.com/$GH_USER/$REPO.git" HEAD 2>&1 \
  | grep -v "token" | grep -v "https://"

echo ""
echo "Pushed. CI building..."
echo ""
open "https://github.com/$GH_USER/$REPO/actions"

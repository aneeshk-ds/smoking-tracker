#!/bin/bash
set -e

REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GH_USER="aneeshk-ds"
REPO="smoking-tracker"

echo ""
echo "═══════════════════════════════════════"
echo "  Push v0.7.0 — Soothing violet palette"
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
    commit -m "feat: v0.7.0 — Soothing violet palette

- Replace amber (#E8A838) with soft violet (#A78BFA) throughout
- BreathingOrb ring: violet glow when on-target (was amber)
- StreakDisplay: violet streak count + PB badge (was amber)
- Journey StreakSummaryCard: violet text and border accents
- AchievementBadge: violet border on unlocked badges
- Home CTA button shadow: violet glow (was amber)
- CSS variables: --accent, --accent-dim, --accent-glow updated
- Tailwind config: accent token updated
- Favicon: violet ember circle (was amber)"
fi

# Push
git push "https://$GH_TOKEN@github.com/$GH_USER/$REPO.git" HEAD 2>&1 \
  | grep -v "token" | grep -v "https://"

echo ""
echo "Pushed. CI is building..."
echo "  https://github.com/$GH_USER/$REPO/actions"
echo ""

open "https://github.com/$GH_USER/$REPO/actions"

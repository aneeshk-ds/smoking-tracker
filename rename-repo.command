#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo ""
echo "═══════════════════════════════════════"
echo "  Renaming repo: tracker → smoking-tracker"
echo "═══════════════════════════════════════"
echo ""

GH_USER="aneeshk-ds"
OLD_REPO="tracker"
NEW_REPO="smoking-tracker"

# Get token from keychain
CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)

if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi

if [ -z "$GH_TOKEN" ]; then
  read -sp "  GitHub personal access token: " GH_TOKEN
  echo ""
fi

echo "Renaming repo via GitHub API..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$GH_USER/$OLD_REPO" \
  -d "{\"name\":\"$NEW_REPO\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Repo renamed to: $NEW_REPO"
else
  echo "API error ($HTTP_CODE):"
  echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','unknown'))" 2>/dev/null || echo "$BODY"
  exit 1
fi

# Update local git remote
NEW_URL="https://github.com/$GH_USER/$NEW_REPO.git"
git remote set-url origin "$NEW_URL" 2>/dev/null || git remote add origin "$NEW_URL"
echo "✓ Local remote updated to: $NEW_URL"

# GitHub automatically redirects the old Pages URL, but the new one needs
# a fresh push to rebuild with the correct VITE_BASE (new repo name)
echo ""
echo "Pushing to trigger rebuild with new base path..."
AUTH_URL="https://$GH_TOKEN@github.com/$GH_USER/$NEW_REPO.git"
git push "$AUTH_URL" main 2>&1 | grep -v "token" | grep -v "https://"

echo ""
echo "═══════════════════════════════════════"
echo "  Done."
echo ""
echo "  Repo  : https://github.com/$GH_USER/$NEW_REPO"
echo "  Pages : https://$GH_USER.github.io/$NEW_REPO/"
echo ""
echo "  Rebuild running (~60s). Old URL redirects automatically."
echo "═══════════════════════════════════════"
echo ""

open "https://github.com/$GH_USER/$NEW_REPO/actions"

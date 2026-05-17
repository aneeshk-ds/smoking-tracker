#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo ""
echo "═══════════════════════════════════════"
echo "  Tracker — Auto Deploy to GitHub Pages"
echo "═══════════════════════════════════════"
echo ""

# ── Get GitHub credentials from macOS Keychain ──
echo "Looking for stored GitHub credentials..."

# Try git credential helper first
CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_USER=$(echo "$CRED" | grep '^username=' | cut -d= -f2)
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)

# Fallback: try keychain directly
if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi

if [ -z "$GH_TOKEN" ] || [ -z "$GH_USER" ]; then
  echo ""
  echo "Could not retrieve GitHub credentials automatically."
  echo "Please enter them manually:"
  read -p "  GitHub username: " GH_USER
  read -sp "  GitHub personal access token (needs 'repo' scope): " GH_TOKEN
  echo ""
fi

echo "✓ Using account: $GH_USER"

# ── Create the repo via GitHub API ──
REPO_NAME="tracker"
echo "Creating repo '$REPO_NAME'..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Private smoking tracker PWA. No accounts, no cloud.\",\"auto_init\":false}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo "✓ Repo created: https://github.com/$GH_USER/$REPO_NAME"
elif [ "$HTTP_CODE" = "422" ]; then
  echo "✓ Repo already exists, continuing..."
else
  echo "GitHub API error ($HTTP_CODE):"
  echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','unknown error'))" 2>/dev/null || echo "$BODY"
  exit 1
fi

REPO_URL="https://github.com/$GH_USER/$REPO_NAME.git"

# ── Enable GitHub Pages via API ──
echo "Enabling GitHub Pages (GitHub Actions source)..."
curl -s -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$GH_USER/$REPO_NAME/pages" \
  -d '{"build_type":"workflow"}' > /dev/null 2>&1 || true

# ── Push code ──
echo "Pushing code..."
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

# Use token-authenticated HTTPS push
AUTH_URL="https://$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git"
git push "$AUTH_URL" main 2>&1 | grep -v "token" | grep -v "https://" || true
git push --set-upstream origin main 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════"
echo "  Done."
echo ""
echo "  Repo   : https://github.com/$GH_USER/$REPO_NAME"
echo "  Pages  : https://$GH_USER.github.io/$REPO_NAME/"
echo ""
echo "  The GitHub Actions workflow is now running."
echo "  App will be live in ~60 seconds."
echo ""
echo "  If Pages isn't enabled automatically, go to:"
echo "  Repo → Settings → Pages → Source → GitHub Actions"
echo "═══════════════════════════════════════"
echo ""

# Open the repo in browser
open "https://github.com/$GH_USER/$REPO_NAME/actions"

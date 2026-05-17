#!/bin/bash
set -e

echo ""
echo "═══════════════════════════════════════"
echo "  Enabling GitHub Pages → GitHub Actions"
echo "═══════════════════════════════════════"
echo ""

GH_USER="aneeshk-ds"
REPO_NAME="tracker"

# Get token from keychain
CRED=$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null) || true
GH_TOKEN=$(echo "$CRED" | grep '^password=' | cut -d= -f2)

if [ -z "$GH_TOKEN" ]; then
  GH_TOKEN=$(security find-internet-password -s github.com -a "$GH_USER" -w 2>/dev/null) || true
fi

if [ -z "$GH_TOKEN" ]; then
  echo "Could not get token from keychain. Enter manually:"
  read -sp "  GitHub personal access token: " GH_TOKEN
  echo ""
fi

echo "Setting Pages source to GitHub Actions..."

# First try updating existing Pages config
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$GH_USER/$REPO_NAME/pages" \
  -d '{"build_type":"workflow"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Pages source set to GitHub Actions"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "Pages not yet enabled. Creating..."
  RESPONSE2=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$GH_USER/$REPO_NAME/pages" \
    -d '{"build_type":"workflow"}')
  HTTP_CODE2=$(echo "$RESPONSE2" | tail -1)
  if [ "$HTTP_CODE2" = "201" ] || [ "$HTTP_CODE2" = "204" ]; then
    echo "✓ Pages enabled with GitHub Actions source"
  else
    echo "API response ($HTTP_CODE2):"
    echo "$RESPONSE2" | head -1
  fi
else
  echo "Response ($HTTP_CODE): $BODY"
fi

echo ""
echo "Opening Pages settings to verify..."
open "https://github.com/$GH_USER/$REPO_NAME/settings/pages"

echo ""
echo "Live URL:"
echo "  https://$GH_USER.github.io/$REPO_NAME/"
echo ""

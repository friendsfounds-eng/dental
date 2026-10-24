#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================================"
echo "      PUSH DENTAL ERP CODE TO GITHUB FOR RENDER"
echo "========================================================"
echo ""
echo "Make sure you have created an empty repository on GitHub:"
echo "https://github.com/new"
echo ""

read -p "Paste your GitHub repository URL here: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "[ERROR] No URL entered. Aborting."
    exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

echo "Pushing code to main branch..."
git push -u origin main

echo ""
echo "========================================================"
echo "[SUCCESS] Code uploaded to GitHub successfully!"
echo "========================================================"
echo "Now open Render to finish your free deployment:"
echo "1. Open https://dashboard.render.com"
echo "2. Click 'New +' -> 'Web Service'"
echo "3. Choose your repository and click 'Deploy'"
echo "========================================================"

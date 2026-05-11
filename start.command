#!/bin/bash
cd "$(dirname "$0")"
echo "Cleaning broken node_modules..."
rm -rf node_modules package-lock.json
echo "Installing dependencies (this takes ~60 seconds)..."
npm install
echo ""
echo "Starting dev server..."
npm run dev

#!/bin/bash
# Simple deployment script for GitHub Pages
# Copies web UI files to docs/ directory for GitHub Pages deployment

set -e

echo "📦 Preparing web UI for GitHub Pages deployment..."

# Create docs directory if it doesn't exist
mkdir -p docs

# Copy web UI files
echo "Copying web UI files..."
cp web/index.html docs/
cp web/app.js docs/
cp web/browser-csv-parser.js docs/

echo "✅ Files copied to docs/ directory"
echo ""
echo "Next steps:"
echo "1. Commit and push the docs/ directory"
echo "2. In GitHub repository settings → Pages, set source to '/docs'"
echo "3. Your site will be available at: https://dalssoft.github.io/cursor_cost_explorer/"
echo ""
echo "Note: Make sure src/ directory is committed so modules can be imported"


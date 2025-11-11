---
id: task-14
title: Create web UI for Cursor Cost Explorer
status: Done
assignee: []
created_date: '2025-11-11 15:59'
updated_date: '2025-11-11 15:59'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a browser-based interface for analyzing Cursor usage CSV files. The UI should be minimalist, terminal-like, and process all data client-side with no server communication. It should match the CLI output format with graphs enabled.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Web UI displays file drop zone with drag-and-drop support
- [x] #2 CSV parsing works in browser without Node.js fs module
- [x] #3 Output matches CLI format with --show-graphs flag enabled
- [x] #4 Terminal-like styling with beige/navy color scheme
- [x] #5 GitHub star count displayed in header
- [x] #6 Privacy-first messaging (local-only processing)
- [x] #7 Info bar with download instructions and links
- [x] #8 Responsive design works on mobile devices
- [x] #9 Deployable to GitHub Pages
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created complete web UI with the following components:

**Files Created:**
- web/index.html - Main HTML page with terminal-like styling
- web/app.js - Browser-compatible JavaScript for file handling and analysis
- web/browser-csv-parser.js - Browser-safe CSV parser (no fs dependency)
- web/deploy.sh - Deployment script for GitHub Pages
- web/README.md - Deployment guide

**Key Features Implemented:**
- Drag-and-drop CSV file upload with FileReader API
- Browser-compatible CSV parsing (parseCSVContent instead of parseCSVFile)
- Direct imports from src/domain modules (analyze, TextFormatter)
- Terminal-like retro-futuristic design with beige (#e8dcc4) and navy (#1a3a52) color scheme
- GitHub star count fetched from API and displayed in header
- Privacy-first messaging emphasizing local-only processing
- Info bar with download instructions linking to cursor.com/dashboard
- Output formatting matches CLI with --show-graphs flag (ASCII graphs enabled)
- Responsive layout with centered output container that adjusts to content width
- JetBrains Mono font for consistent monospace typography

**Technical Details:**
- Uses ES modules for browser compatibility
- All processing happens client-side (no server communication)
- Google Fonts integration for JetBrains Mono
- CSS variables for easy theming
- Output container uses fit-content width to match content size
- Proper error handling with user-friendly messages

**Deployment:**
- Designed for GitHub Pages (static hosting)
- Can be served from /docs directory or root
- All module paths configured for browser environment
<!-- SECTION:NOTES:END -->

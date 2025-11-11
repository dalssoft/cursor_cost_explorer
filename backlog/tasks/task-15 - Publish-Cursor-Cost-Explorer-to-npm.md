---
id: task-15
title: Publish Cursor Cost Explorer to npm
status: Done
assignee:
  - '@agent'
created_date: '2025-11-11 16:02'
updated_date: '2025-11-11 16:02'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Configure package.json and publish the CLI tool to npm for npx usage
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Add files field to package.json to specify what gets included in npm package
- [x] #2 Add publish script to package.json
- [x] #3 Update README with installation and usage instructions
- [x] #4 Test that CLI works with npx-style execution
- [x] #5 Publish package to npm registry
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Package configured for npm publishing with:
- bin field mapping cursor-cost-explorer to CLI entry point
- files field including only src/ and README.md
- publish script added for convenience
- README updated with installation and usage instructions
- CLI tested and working correctly

To publish: npm publish (requires npm login and proper credentials)
<!-- SECTION:NOTES:END -->

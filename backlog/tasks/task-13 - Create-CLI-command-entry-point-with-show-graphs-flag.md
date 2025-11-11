---
id: task-13
title: Create CLI command entry point with --show-graphs flag
status: Done
assignee:
  - '@agent'
created_date: '2025-11-10 15:15'
updated_date: '2025-11-11 14:45'
labels:
  - cli
  - entry-point
dependencies:
  - task-11
  - task-12
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create src/cli/index.js as the CLI entry point. Parse command-line arguments (file path, --show-graphs flag, --output flag). Integrate CSV parser and analysis engine. Call formatter with appropriate flag (with/without graphs). Handle errors gracefully with helpful messages. Support output to stdout or file (--output flag). Add to package.json as bin entry for npx usage. MUST support running via npx cursor-cost-explorer <csv-file> [--show-graphs] [--output <file>].
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLI accepts CSV file path as argument
- [x] #2 --show-graphs flag enables ASCII graph generation
- [x] #3 Default mode (no flag) shows text and numbers only
- [x] #4 --output <file> saves output to file
- [x] #5 --json flag outputs raw JSON (for programmatic use)
- [x] #6 Error handling provides actionable messages
- [x] #7 Exit codes: 0 (success), 1 (error)
- [x] #8 MUST work with npx cursor-cost-explorer command
- [x] #9 package.json bin entry configured correctly
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/cli/index.js entry point
2. Parse command-line arguments (file path, --show-graphs, --output, --json)
3. Integrate CSV parser and analysis engine
4. Call appropriate formatter based on flags
5. Handle file I/O for --output flag
6. Implement error handling with helpful messages
7. Set proper exit codes (0 for success, 1 for errors)
8. Update package.json with bin entry
9. Add shebang for npx execution
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created CLI entry point at src/cli/index.js with full argument parsing support.

Features implemented:
- CSV file path as positional argument
- --show-graphs/-g flag (parsed, will be used when task 12 completes)
- --output/-o flag for file output
- --json/-j flag for JSON output
- --help/-h and --version/-v flags
- Comprehensive error handling with actionable messages
- Proper exit codes (0 for success, 1 for errors)
- package.json bin entry configured for npx usage
- Shebang added for direct execution

Note: --show-graphs flag is parsed but graphs are not yet implemented (task 12 pending). When task 12 completes, the flag will enable ASCII graph generation.

All tests passing. CLI works both when run directly and via npx.

Task completed. The --show-graphs flag now works correctly with the enhanced graph implementation from task-12:
- Unicode braille characters for line charts
- Improved bar charts with visual contrast
- All CLI features tested and working
- Works correctly with npx cursor-cost-explorer command
<!-- SECTION:NOTES:END -->

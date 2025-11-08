---
id: task-3
title: Implement CSV parser and validation
status: To Do
assignee: []
created_date: '2025-11-08 00:57'
updated_date: '2025-11-08 00:58'
labels:
  - domain
  - parsing
dependencies:
  - task-2
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build CSV parsing logic to read Cursor usage exports. Validate required columns exist, handle missing/null values gracefully, and detect CSV format version. Return parse errors with actionable messages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CSV parser accepts file path or string content and returns array of UsageRecord objects
- [ ] #2 Validates required columns exist: Date, Kind, Model, Cost, Total Tokens, Cache Read, Input, Output
- [ ] #3 Handles missing/null values gracefully (skips invalid rows or uses defaults)
- [ ] #4 Returns parse errors with actionable messages (e.g., 'Column Cost missing - is this a Cursor usage export?')
- [ ] #5 Parse time <2 seconds for 2,000 rows
- [ ] #6 Detects CSV format version if Cursor changes export format over time
<!-- AC:END -->

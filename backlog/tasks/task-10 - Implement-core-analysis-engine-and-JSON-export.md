---
id: task-10
title: Implement core analysis engine and JSON export
status: To Do
assignee: []
created_date: '2025-11-08 00:58'
updated_date: '2025-11-08 00:58'
labels:
  - domain
  - api
dependencies:
  - task-4
  - task-5
  - task-6
  - task-7
  - task-8
  - task-9
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the main analyze() function that orchestrates all analysis modules and generates structured JSON output. This is the core API that will be consumed by Web UI, CLI, and programmatic interfaces.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Main analyze() function implemented that takes ParsedUsage[] and returns AnalysisResult
- [ ] #2 Orchestrates all analysis modules: cost, efficiency, plan, cache, opportunities, patterns
- [ ] #3 JSON export generates full analysis results as structured JSON with all metrics, recommendations, and metadata
- [ ] #4 JSON schema is validated and consistent
- [ ] #5 Analysis completes in <3 seconds for typical dataset (2,000 rows)
- [ ] #6 Public API exported: parseCSV() and analyze() functions
- [ ] #7 All domain logic is pure JavaScript with no external dependencies
<!-- AC:END -->

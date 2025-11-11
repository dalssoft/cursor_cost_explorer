---
id: task-11
title: 'Create CLI text formatter (base, no graphs)'
status: Done
assignee:
  - '@agent'
created_date: '2025-11-10 15:14'
updated_date: '2025-11-11 14:45'
labels:
  - cli
  - formatter
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a text formatter that converts AnalysisResult to plain text output. Output should be optimized for both AI agents and humans - structured and readable. Include all analysis sections: summary stats, cost breakdowns, model efficiency rankings, plan recommendations, opportunities list, and patterns. Use simple text tables with ASCII borders (no colors initially). Pure text output with numbers and explanations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Formatter accepts AnalysisResult and returns formatted string
- [x] #2 All analysis sections included in readable format
- [x] #3 Tables use ASCII borders (simple -, |, + characters)
- [x] #4 Output is deterministic and parseable
- [x] #5 No external dependencies (pure Node.js)
- [x] #6 Clear section headers and organized layout
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create formatters directory structure
2. Create TextFormatter class that accepts AnalysisResult
3. Implement helper methods for formatting numbers, currency, percentages
4. Implement section formatters: summary, cost breakdowns, model efficiency, plan recommendation, cache efficiency, opportunities, patterns
5. Implement ASCII table generation utilities
6. Combine all sections into formatted output
7. Add tests for the formatter
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TextFormatter class fully implemented with all required sections:
- Accepts AnalysisResult and returns formatted string
- All analysis sections included (summary, cost analysis, model efficiency, plan recommendation, cache efficiency, opportunities, patterns)
- Tables use ASCII borders (-, |, +)
- Output is deterministic and parseable
- Pure Node.js implementation with no external dependencies
- Clear section headers and organized layout
- Comprehensive test coverage
<!-- SECTION:NOTES:END -->

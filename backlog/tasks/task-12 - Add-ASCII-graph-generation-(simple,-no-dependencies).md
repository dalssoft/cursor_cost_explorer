---
id: task-12
title: 'Add ASCII graph generation (simple, no dependencies)'
status: In Progress
assignee:
  - '@agent'
created_date: '2025-11-10 15:15'
updated_date: '2025-11-11 00:28'
labels:
  - cli
  - formatter
  - graphs
dependencies:
  - task-11
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the text formatter to optionally generate simple ASCII graphs. Create bar charts for cost breakdowns (by model, by type) using # or █ characters. Create simple line charts for daily cost trends using * or · characters. Add horizontal bar charts showing percentages. All graphs use plain ASCII characters (no colors, no complex libraries). Graphs are optional and controlled by a flag.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bar charts render correctly using ASCII characters (#, █, *, ·)
- [x] #2 Charts fit within standard terminal width (80-120 chars)
- [x] #3 Graphs show key insights (top models, cost trends, percentages)
- [x] #4 Graph generation is optional (can be disabled)
- [x] #5 No external dependencies (pure string manipulation)
- [x] #6 Charts are readable and proportional
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add showGraphs parameter to TextFormatter.format() method
2. Create helper methods for ASCII graph generation:
   - generateBarChart() for vertical bar charts
   - generateHorizontalBarChart() for percentage bars
   - generateLineChart() for daily cost trends
3. Add graphs to cost analysis section (by model, by type)
4. Add line chart for daily cost trends
5. Add horizontal bar charts for percentages
6. Ensure all graphs fit within 80-120 character width
7. Use ASCII characters: #, █, *, ·
8. Make graphs optional and controlled by flag
<!-- SECTION:PLAN:END -->

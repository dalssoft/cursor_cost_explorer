---
id: task-2
title: Define domain types and data models
status: To Do
assignee: []
created_date: '2025-11-08 00:57'
updated_date: '2025-11-08 00:58'
labels:
  - domain
  - types
dependencies:
  - task-1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create TypeScript/JavaScript type definitions for Cursor usage data structures. Define interfaces for parsed CSV rows, analysis results, and all domain entities. This establishes the core data contracts for the entire system.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 UsageRecord type defined with all required fields (Date, Kind, Model, Cost, Total Tokens, Cache Read, Input, Output)
- [ ] #2 AnalysisResult type defined with summary, model efficiency, and recommendations structure
- [ ] #3 PlanRecommendation type defined with current/recommended plan, savings, and confidence
- [ ] #4 Opportunity type defined with type, title, savings, difficulty, impact, and action fields
- [ ] #5 All types are pure JavaScript objects/classes with no external dependencies
<!-- AC:END -->

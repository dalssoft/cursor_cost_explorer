---
id: task-2
title: Define domain types and data models
status: Done
assignee:
  - '@agent'
created_date: '2025-11-08 00:57'
updated_date: '2025-11-08 01:06'
labels:
  - domain
  - types
dependencies:
  - task-1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create JavaScript type definitions for Cursor usage data structures. Define objects/interfaces for parsed CSV rows, analysis results, and all domain entities using plain JavaScript with JSDoc comments for documentation. This establishes the core data contracts for the entire system.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 UsageRecord type defined with all required fields (Date, Kind, Model, Cost, Total Tokens, Cache Read, Input, Output)
- [x] #2 AnalysisResult type defined with summary, model efficiency, and recommendations structure
- [x] #3 PlanRecommendation type defined with current/recommended plan, savings, and confidence
- [x] #4 Opportunity type defined with type, title, savings, difficulty, impact, and action fields
- [x] #5 All types are pure JavaScript objects/classes with no external dependencies
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review PRD sample JSON structure
2. Create src/domain/types.js with JSDoc-commented type definitions
3. Define UsageRecord object structure
4. Define AnalysisResult object structure with all nested types
5. Define PlanRecommendation object structure
6. Define Opportunity object structure
7. Export all types as documentation/validation helpers
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Domain types defined in plain JavaScript:

- UsageRecord structure: date, kind, model, cost, totalTokens, cacheRead, input, output
- AnalysisResult structure: summary, model_efficiency, plan_recommendation, opportunities, patterns
- PlanRecommendation structure: current/recommended plan, savings, confidence, reasoning
- Opportunity structure: type, title, savings_monthly, difficulty, impact, action
- Helper functions: isValidUsageRecord() and createEmptyAnalysisResult()

No TypeScript, no JSDoc typedefs - just plain JavaScript objects and validation helpers.
<!-- SECTION:NOTES:END -->

---
id: task-6
title: Implement plan optimization logic
status: Done
assignee:
  - '@agent'
created_date: '2025-11-08 00:57'
updated_date: '2025-11-08 02:16'
labels:
  - domain
  - analysis
dependencies:
  - task-2
  - task-3
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Detect current Cursor plan from usage data, compare against Pro/Ultra tiers, and generate plan recommendations with savings calculations. Provide clear reasoning and actionable next steps.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Current plan type inferred from usage data (Pro, Ultra, or Free)
- [x] #2 Actual monthly cost calculated: (totalCost / days) * 30
- [x] #3 Request volume analyzed: fast vs slow, within limits or overages
- [x] #4 Plan comparison logic implemented against Cursor tiers (Free: --/50 req, Pro: /500 req, Ultra: /~10k req)
- [x] #5 Decision tree implemented: spending >/month → Ultra, -220 → Ultra, -180 → Pro, < → Free/downgrade
- [x] #6 Recommendation format includes: current plan, recommended plan, savings, confidence level, reasoning, and action steps
- [x] #7 Savings calculation is conservative (under-promise)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Plan optimization logic implemented:

- PlanOptimizer class with comprehensive plan analysis
- Current plan detection from usage data (Pro, Ultra, Free) with confidence levels
- Actual monthly cost calculation: (totalCost / days) * 30
- Request volume analysis: fast vs slow, within limits or overages
- Plan comparison logic against Cursor tiers (Free: 50 req, Pro: 500 req, Ultra: ~10k req)
- Decision tree implemented:
  - Spending >$220/month → Recommend Ultra (saves money)
  - Spending $180-220/month → Recommend Ultra (better experience)
  - Spending $15-180/month → Stay on Pro (optimal)
  - Spending <$15/month → Consider Free/downgrade
- Recommendation format includes: current plan, recommended plan, savings (monthly/yearly), confidence level, reasoning, and action steps
- Savings calculation is conservative (10% buffer - under-promise)
- 15 comprehensive tests covering all scenarios
- Integration test with real CSV data (1,330 records)

Pure JavaScript, class-based design, no external dependencies.
<!-- SECTION:NOTES:END -->

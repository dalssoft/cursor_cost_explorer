# Cursor Usage Analyzer - Product Requirements Document

## Executive Summary

Cursor IDE users spend $20-$370/month on AI coding assistance but lack visibility into their usage patterns and cost efficiency. This results in suboptimal model selection, wrong pricing tier choices, and wasted spend. We're building a privacy-first analyzer that transforms Cursor's raw usage CSV into actionable insights and specific optimization recommendations.

**Core Value Proposition:** Help Cursor users save 30-50% on costs while maintaining or improving productivity through data-driven model selection and plan optimization.

**Architecture Principle:** One core analysis engine, multiple consumption interfaces (Web UI, CLI, JSON output for AI agents).

---

## Problem Statement

### Pain Points

**P1: Cost Blindness**
- Users don't know if they're on the right pricing tier
- Example: Paying $370/month (Pro + On-Demand overages) when Ultra at $200/month would be cheaper
- No way to understand which models are expensive vs. efficient for their workload

**P2: Model Selection Inefficiency**
- Claude Thinking costs $0.56/request vs Grok at $0.048/request (11.6x difference)
- Users default to expensive models for simple tasks that could use cheaper alternatives
- Potential savings of $50-100/month just from better model selection

**P3: No Benchmarking Context**
- "Is 87% cache efficiency good?" (Yes, it's excellent)
- "Am I a power user?" (If spending >$100/month, yes)
- No way to understand if usage patterns are optimal

**P4: Privacy Concerns with Analysis Tools**
- Usage data reveals project details, work hours, coding patterns
- Existing analytics tools require uploading sensitive data to servers
- Users avoid analysis due to privacy concerns

**P5: Lack of Actionable Guidance**
- Raw CSV has 1,300+ rows of data but no insights
- Users don't know *what to do* with the information
- Need specific, prioritized recommendations, not just charts

---

## User Personas

### Primary: Solo Power User (David)
- **Profile:** Experienced developer/CTO, heavy Cursor user (40+ requests/day)
- **Current spend:** $300-400/month (Pro + overages or considering Ultra)
- **Pain:** "Am I wasting money? Should I upgrade to Ultra?"
- **Goal:** Optimize costs without reducing productivity
- **Tech savvy:** High - comfortable with CSV exports and technical metrics

### Secondary: Team Lead (Sarah)
- **Profile:** Engineering manager with 5-10 devs using Cursor
- **Current spend:** $200-400/month team budget
- **Pain:** "Which devs should get Ultra vs Pro? Are we using it efficiently?"
- **Goal:** Maximize team ROI on AI tooling budget
- **Tech savvy:** Medium-high

### Tertiary: Casual User (Alex)
- **Profile:** Freelance developer, intermittent Cursor usage
- **Current spend:** $20/month (Pro) or Free tier
- **Pain:** "Is this worth $20/month for me? Am I using it enough?"
- **Goal:** Understand if subscription is justified
- **Tech savvy:** Medium

---

## Solution Overview

A **privacy-first analysis engine** with multiple consumption interfaces:

### Architecture: One Core, Many UIs

**Core Engine (npm package)**
- Pure TypeScript/JavaScript functions
- Zero dependencies on UI frameworks
- Inputs: Parsed CSV data (array of objects)
- Outputs: Structured analysis results (JSON)
- Publishable as `@cursor-analyzer/core` on npm

**Consumption Interfaces**

1. **Web UI** - Browser-based, drag-and-drop CSV upload
   - Target: Non-technical users, visual learners
   - Technology: React/Next.js static export
   - Deployment: Vercel/Netlify (CDN-only)

2. **CLI** - Command-line tool for developers
   - Target: Technical users, CI/CD integration
   - Usage: `npx cursor-analyze usage.csv`
   - Output: Terminal tables + optional file exports

3. **JSON API** - Programmatic access for AI agents
   - Target: LLM agents, automation tools
   - Usage: `import { analyze } from '@cursor-analyzer/core'`
   - Output: Structured JSON for downstream processing

**Key Principle:** All three interfaces consume the same core analysis logic. Business logic lives in core, presentation logic lives in adapters.

---

## Core Requirements (80/20 Focus)

### CR-1: Data Ingestion & Validation

**User Need:** Safely load Cursor usage CSV without manual data cleaning.

**Requirements:**
- Accept CSV file with expected Cursor export structure
- Validate required columns exist: Date, Kind, Model, Cost, Total Tokens, Cache Read, Input, Output
- Handle missing/null values gracefully (skip rows or use defaults)
- Detect CSV format version (if Cursor changes export format over time)
- Return parse errors with actionable messages

**Success Criteria:**
- Handles 99% of valid Cursor exports without errors
- Parse time <2 seconds for 2,000 rows
- Error messages guide user to fix issues

**Example Error Messages:**
- ❌ "Column 'Cost' missing - is this a Cursor usage export?"
- ❌ "Date format invalid on row 42 - expected ISO 8601"
- ✅ "Parsed 1,330 rows from Oct 10 - Nov 7, 2025"

---

### CR-2: Cost Analysis Fundamentals

**User Need:** Understand where money is going at a glance.

**Metrics to Calculate:**

**2.1 Summary Statistics**
- Total cost (period)
- Average cost per day
- Total requests
- Unique days with usage
- Date range (first to last request)

**2.2 Cost Breakdown**
- By model: total cost + percentage of total
- By request type: Included, On-Demand, Errored
- By time: daily cost aggregation

**2.3 Top Expensive Items**
- 5 most expensive individual requests (with context)
- 5 most expensive days
- Most expensive model overall

**Success Criteria:**
- Numbers match manual spreadsheet calculation
- Percentages sum to 100%
- Can answer: "What's costing me the most?"

---

### CR-3: Model Efficiency Analysis

**User Need:** Know which models give best value for money.

**Metrics to Calculate:**

**3.1 Per-Model Economics**
For each model used:
- Total cost
- Total tokens processed (input + output)
- Output tokens generated
- Number of requests
- **Cost per million tokens** (primary efficiency metric)
- **Cost per million output tokens** (for thinking models)
- Average cost per request

**3.2 Efficiency Scoring**
- Score each model 0-100 on cost efficiency
- Account for model type (thinking models judged differently)
- Rank models from most to least efficient

**3.3 Model Categorization**
Classify each model:
- 🟢 **Cost-Efficient** (use more): Below $50/M tokens
- 🟡 **Specialized** (use selectively): $50-$500/M tokens
- 🔴 **Premium** (use sparingly): Above $500/M tokens

**Success Criteria:**
- Efficiency scores align with intuitive understanding
- Cheap models score high, expensive models score low (adjusted for value)
- User can instantly see "which model to use when"

**Example Output:**
```
Model Efficiency Ranking:

1. grok-code-fast-1        Score: 95  ($47/M tokens)   🟢 Use for: Syntax, refactors
2. gemini-2.5-pro          Score: 82  ($112/M tokens)  🟢 Use for: Analysis, docs  
3. composer-1              Score: 75  ($183/M tokens)  🟡 Use for: Multi-file edits
4. claude-4.5-sonnet       Score: 60  ($530/M tokens)  🟡 Use for: Complex features
5. claude-thinking         Score: 45  ($776/M tokens)  🔴 Use for: Architecture only
```

---

### CR-4: Plan Optimization

**User Need:** Know if I'm on the right Cursor pricing tier.

**4.1 Current State Detection**
Infer from usage data:
- Current plan type (Pro, Ultra, or Free)
- Actual monthly cost: `(totalCost / days) * 30`
- Request volume: fast vs slow, within limits or overages

**4.2 Plan Options**
Compare against Cursor's tiers:
- Free: $0, 50 requests/month
- Pro: $20/month, 500 fast requests
- Ultra: $200/month, ~10,000 fast requests

**4.3 Recommendation Logic**
Decision tree:
- If spending >$220/month → Recommend Ultra (saves money)
- If spending $180-220/month → Recommend Ultra (better experience)
- If spending $15-180/month → Stay on Pro (optimal)
- If spending <$15/month → Consider downgrading or Free tier

**4.4 Recommendation Format**
```
💡 PLAN RECOMMENDATION

Current: Pro + On-Demand = $342/month (estimated)
Recommended: Ultra = $200/month (fixed)

Savings: $142/month ($1,704/year)
Confidence: High (based on 26 days of data)

Why Ultra?
✓ You consistently exceed Pro's 500 request limit
✓ Buying overages costs more than Ultra subscription
✓ You'll get unlimited requests and priority access

Action: cursor.sh/settings → Billing → Upgrade to Ultra
```

**Success Criteria:**
- Recommendation matches manual cost-benefit analysis
- Savings calculation is conservative (under-promise)
- Clear next step provided

---

### CR-5: Cache Efficiency Assessment

**User Need:** Understand if I'm leveraging Cursor's cache effectively.

**5.1 Cache Metrics**
- Total tokens from cache
- Total tokens from input (non-cached)
- Cache hit rate: `cacheTokens / (cacheTokens + inputTokens)`
- Estimated cost savings from cache

**5.2 Cache Benchmarking**
Compare to static benchmarks:
- <60%: Poor - significant waste
- 60-75%: Average - room for improvement  
- 75-85%: Good - effective usage
- 85-92%: Excellent - top 10%
- >92%: Outstanding - top 1%

**5.3 Contextual Feedback**
If cache rate is low:
```
⚠️ Your cache rate (65%) is below average

This means Cursor is re-processing context you've already paid for.

Quick wins:
• Work in longer continuous sessions (not short bursts)
• Keep related files open together
• Use @Files references instead of copying code into prompts

Potential savings: $20-40/month with improved cache usage
```

**Success Criteria:**
- Cache calculation matches Cursor's accounting
- User understands if they're doing well or poorly
- Tips are specific and actionable

---

### CR-6: Savings Opportunities

**User Need:** Know exactly what to do to save money.

**6.1 Opportunity Identification**
Scan for 3-5 highest-impact savings opportunities:

**Opportunity Type 1: Plan Optimization**
- If wrong plan: Calculate exact savings from switching

**Opportunity Type 2: Model Migration**
- Identify expensive model overuse
- Suggest cheaper alternative for portion of requests
- Example: "30% of Claude Thinking could use Grok → Save $73/month"

**Opportunity Type 3: Error Reduction**
- If error rate >3%: Wasted requests
- Suggest prompt improvements

**Opportunity Type 4: Cache Optimization**
- If cache rate <75%: Workflow inefficiency
- Suggest session management improvements

**6.2 Opportunity Format**
```
💰 TOP SAVINGS OPPORTUNITIES

1. Upgrade to Ultra Plan
   Savings: $142/month | Difficulty: Easy | Time: 5 min
   Impact: 🔴 High
   → Your overages exceed the cost difference
   
2. Migrate 30% Claude Thinking → Grok  
   Savings: $73/month | Difficulty: Medium | Time: 1 week
   Impact: 🟡 Medium
   → Use Grok for: syntax, refactors, simple completions
   → Keep Claude for: architecture, complex algorithms
   
3. Reduce error rate from 5% to 2%
   Savings: $11/month | Difficulty: Medium | Time: 2 weeks
   Impact: 🟢 Low
   → Break large prompts into smaller chunks
   → Review failed requests to identify patterns

Total Potential: $226/month ($2,712/year)
```

**Success Criteria:**
- Opportunities ranked by ROI (high to low)
- Implementation difficulty is realistic
- User can act on recommendations immediately

---

### CR-7: Usage Pattern Insights

**User Need:** Understand when and how I use Cursor.

**7.1 Temporal Patterns**
- Hourly distribution: Which hours are most active?
- Daily distribution: Which days of week?
- Peak usage times: "Power hours"
- Sprint detection: Unusually high-cost days

**7.2 Pattern Analysis**
Identify characteristics:
- "You're a night coder" (peak usage 18h-23h)
- "Weekend warrior" (>20% usage on Sat/Sun)
- "Sprint worker" (usage in bursts, not consistent)
- "Steady user" (consistent daily usage)

**7.3 Pattern-Based Recommendations**
Examples:
- If bursty: "Consider timing sprints with billing cycle start"
- If consistent: "Your steady usage justifies Pro/Ultra investment"
- If weekend-heavy: "You may be paying for idle weekday capacity"

**Success Criteria:**
- User recognizes their own patterns
- Insights feel personalized, not generic
- Recommendations leverage patterns for optimization

---

### CR-8: Export Capabilities

**User Need:** Save, share, or integrate analysis results.

**8.1 JSON Export**
- Full analysis results as structured JSON
- Includes all metrics, recommendations, metadata
- Schema-validated for programmatic consumption
- Purpose: Import to other tools, save for comparison

**8.2 Markdown Export**
- Human-readable formatted report
- Includes summary, key metrics, recommendations
- Copy-paste into Notion, GitHub, Obsidian
- ASCII tables for compatibility

**8.3 PDF Export (Web UI only)**
- Professional multi-page report
- Includes charts/visualizations
- Executive summary + detailed sections
- Purpose: Sharing with non-technical stakeholders

**8.4 Terminal Output (CLI only)**
- Formatted tables and text for console
- Color-coded (green=good, yellow=warning, red=action)
- Optional: Save to file via redirect

**Success Criteria:**
- Exports contain all essential information
- Formats are platform-appropriate
- JSON validates against schema

---

## Non-Functional Requirements

### NFR-1: Privacy & Security
- **Zero server communication** during analysis (except CDN for assets)
- All data processing happens client-side (browser) or locally (CLI)
- No analytics tracking without explicit opt-in
- No data retention on any server
- CSV file never leaves user's device

### NFR-2: Performance
- Parse 2,000 row CSV in <2 seconds
- Complete analysis in <3 seconds total
- Web UI first meaningful paint <1 second
- CLI execution <5 seconds end-to-end

### NFR-3: Compatibility
- **Core package:** Node.js 18+, works in browser environments
- **Web UI:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **CLI:** Node.js 18+, works on macOS, Linux, Windows
- No native dependencies (pure JS/TS)

### NFR-4: Maintainability
- Core logic 100% covered by unit tests
- Clear separation: core (logic) vs adapters (UI/CLI)
- TypeScript for type safety
- Documented API for core functions

---

## Success Metrics

### Primary: User Value
- **Cost Savings:** Users save average 30-50% on Cursor spend after implementing recommendations
- **Time to Insight:** First recommendation visible within 30 seconds of file upload
- **Actionability:** 80% of recommendations have clear next steps

### Secondary: Product Quality  
- **Accuracy:** Recommendations match manual analysis 95%+ of time
- **Reliability:** Parse success rate >99% on valid Cursor exports
- **Performance:** Analysis completes in <3 seconds for typical dataset

### Adoption
- **Organic Growth:** GitHub stars, npm downloads, Twitter mentions
- **Repeat Usage:** 40% of users return monthly to re-analyze
- **Multi-Interface:** 60% web, 30% CLI, 10% programmatic usage

---

## Out of Scope (V1)

### Explicitly Excluded
❌ Real-time monitoring (no live Cursor integration)  
❌ Multi-user features (collaboration, sharing)  
❌ Payment processing (free tool)  
❌ Backend infrastructure (no servers)  
❌ Browser extension (web app sufficient)  
❌ Automated alerts (no background processes)  
❌ Social features (leaderboards, comparisons with others)

---

## Future Evolution Scenarios

*This section documents potential directions for V2+ without committing to implementation.*

### Scenario 1: Community Benchmarking
**User Pain:** Static benchmarks become stale; users want real-time percentiles.

**Potential Solution:**
- Opt-in anonymous data contribution
- Users export anonymized summary statistics to public GitHub gist
- App fetches and aggregates public gists for dynamic benchmarks
- Privacy: Only aggregate statistics shared (no raw data, no identifiable info)

**Example Flow:**
```
User: [Analyze] → [Export] → [Contribute to benchmarks? (optional)]
  If yes: Generate JSON with { month: "2025-11", cacheRate: 0.87, costPerDay: 13.2 }
  Post to public gist or IPFS
  
App: Periodically fetch public contributions
  Aggregate into percentiles: p25, p50, p75, p90
  Update static benchmarks with community data
```

**Challenges:** Trust, spam prevention, schema evolution

---

### Scenario 2: Team Analytics
**User Pain:** Team leads want to compare efficiency across developers.

**Potential Solution:**
- Generate shareable analysis "snapshot" (static HTML)
- Leader collects snapshots from team (via email/Slack)
- Upload multiple CSVs to compare side-by-side
- All processing still client-side (no central storage)

**Example:**
```
Team Lead workflow:
1. Ask each dev to export their Cursor CSV
2. Collect files (5-10 CSVs)
3. Upload all to analyzer together
4. View team dashboard:
   - Who has best cache efficiency?
   - Who's on wrong pricing tier?
   - Total team spend and optimization potential
```

**Challenges:** Manual collection, no persistence, privacy concerns

---

### Scenario 3: Predictive Analysis
**User Pain:** "Will I exceed my budget next month?"

**Potential Solution:**
- Detect spending trends (linear regression on daily costs)
- Project forward 30 days
- Alert if projected spend exceeds threshold
- Suggest preemptive actions

**Example:**
```
🔮 SPENDING FORECAST

Based on last 26 days:
Current trajectory: +15% monthly growth

Projected next month: $425
Your typical: $340

⚠️ You may exceed your budget!

Likely causes:
• Project deadline approaching? (Sprint on Oct 10 cost $36)
• New model experimentation? (Using Claude Thinking 20% more)

Actions to consider:
• Upgrade to Ultra now (locks in $200/month)
• Review model selection this week
• Set cost alerts at $300 threshold
```

**Challenges:** Prediction accuracy, data volume requirements

---

### Scenario 4: IDE Integration
**User Pain:** "I want insights without leaving my editor."

**Potential Solution:**
- VS Code extension that imports core analyzer library
- Auto-fetch Cursor usage via Cursor's API (if available)
- Show real-time cost ticker: "Today: $4.20 | This month: $87"
- Inline suggestions: "Consider using Grok for this task (11x cheaper)"

**Example:**
```
VS Code Status Bar: "💰 $87 / $200 monthly budget | ⚡ Cache: 89%"

On expensive model invocation:
  VS Code notification: "Claude Thinking costs $0.56/request
  Consider: Grok ($0.05) for syntax, Gemini ($0.11) for analysis"
```

**Challenges:** Cursor API access, real-time tracking, performance impact

---

### Scenario 5: Budget Management
**User Pain:** "I want to cap my monthly Cursor spend at $150."

**Potential Solution:**
- User sets budget in localStorage
- CLI/Web tracks running total against budget
- Alerts at 80%, 100%, 120% of budget
- Suggest actions when nearing limit

**Example:**
```
$ cursor-analyze usage.csv --budget 150

📊 BUDGET STATUS
Spent so far: $127 (85% of $150 budget)
Days remaining: 8
Projected end-of-month: $178 (⚠️ 18% over budget)

RECOMMENDATIONS:
• Switch to slow mode for routine tasks (saves $3/day)
• Defer non-critical refactors until next month
• Consider one-time Ultra upgrade to lock in predictable cost
```

**Challenges:** Only works with historical data (not preventive), budget detection

---

### Scenario 6: Prompt Quality Insights
**User Pain:** "Why do 5% of my requests error out?"

**Potential Solution:**
- Analyze errored requests for patterns
- Detect: timeouts, parsing errors, rate limits, context overflows
- Suggest prompt engineering improvements
- Link to Cursor best practices documentation

**Example:**
```
⚠️ ERROR ANALYSIS

67 requests (5%) resulted in errors, costing $21 wasted.

Error breakdown:
• 45% Timeout (30 requests)
  → Your prompts may be too complex
  → Try: Break into 2-3 smaller requests
  
• 30% Parsing Error (20 requests)  
  → Context too large (>100k tokens)
  → Try: Use @Files to reference code, not paste full files
  
• 25% Rate Limit (17 requests)
  → Rapid-fire requests in short bursts
  → Try: Batch questions, wait 1-2 seconds between

📚 Resource: Cursor Prompt Engineering Guide
```

**Challenges:** Limited error metadata in CSV, inferring root causes

---

### Scenario 7: Model Recommendation Engine
**User Pain:** "Which model should I use for this task?"

**Potential Solution:**
- Build decision tree based on user's historical patterns
- Input: Task description (text)
- Output: Recommended model with reasoning

**Example:**
```
User: "I need to refactor this authentication module"

Recommendation Engine:
→ Recommended: composer-1 ($0.18/req)
→ Reasoning: Refactoring matches 80% of your composer-1 usage
→ Alternative: grok-code-fast-1 ($0.05/req) if simple rename/move
→ Avoid: claude-thinking ($0.56/req) - overkill for this task

Based on your past 1,330 requests:
• Refactors: 60% composer, 30% grok, 10% claude
• Your best results: composer-1 (fewest errors)
```

**Challenges:** NLP for task classification, accuracy of recommendations

---

### Scenario 8: Historical Comparison
**User Pain:** "Am I getting better at using Cursor efficiently?"

**Potential Solution:**
- Store monthly analysis snapshots (localStorage or JSON exports)
- Visualize trends: cost, efficiency, cache rate, error rate
- Gamification: "You've improved 23% since last month! 🎉"

**Example:**
```
📈 YOUR EFFICIENCY JOURNEY

Month      Cost    Cache%   Error%   Score
Oct 2025   $342    87%      5%       847/1000
Nov 2025   $210    89%      2%       912/1000  ⬆️ +65
Dec 2025   $195    91%      1%       941/1000  ⬆️ +29

Improvements:
✓ Reduced cost by 43% ($147/month savings)
✓ Improved cache efficiency +4%
✓ Reduced errors from 5% to 1%

🏆 You're now in the top 5% of Cursor users!
```

**Challenges:** Cross-session persistence, schema evolution, comparison logic

---

### Scenario 9: Multi-CSV Analysis
**User Pain:** "I want to analyze my entire team's usage at once."

**Potential Solution:**
- Upload multiple CSV files simultaneously
- Aggregate and compare metrics
- Identify team patterns and outliers
- Generate team-level recommendations

**Example:**
```
Uploaded: 5 CSVs (Dev1.csv, Dev2.csv, Dev3.csv, Dev4.csv, Dev5.csv)

TEAM SUMMARY
Total spend: $1,850/month
Average per dev: $370/month
Range: $180 (Dev4) to $570 (Dev1)

EFFICIENCY LEADERBOARD
1. Dev4: $180/month, 92% cache, Score 967 ⭐
2. Dev2: $320/month, 89% cache, Score 891
3. Dev3: $340/month, 87% cache, Score 847
4. Dev5: $440/month, 81% cache, Score 723
5. Dev1: $570/month, 73% cache, Score 651 ⚠️

RECOMMENDATIONS
• Train Dev1 and Dev5 on cache optimization (save $400/month team-wide)
• Dev1 should upgrade to Ultra ($200 vs paying $570)
• Standardize on Dev4's model selection patterns
```

**Challenges:** Privacy (seeing teammate data), fair comparison (different projects)

---

### Scenario 10: Savings Experiments Tracker
**User Pain:** "I made changes—did they actually save money?"

**Potential Solution:**
- User marks "intervention date" (e.g., "Switched to Grok on Nov 15")
- Compare pre/post metrics automatically
- Validate if expected savings materialized
- Build experiment log over time

**Example:**
```
EXPERIMENT LOG

Experiment 1: "Use Grok for refactors"
Started: Nov 15, 2025
Hypothesis: Save $70/month
Status: In Progress (12 days)

Results so far:
• Grok usage: +120% ✓
• Claude Thinking usage: -25% ✓
• Cost reduction: $4.2/day → $2.8/day ✓
• Projected monthly: $84 vs predicted $63

Verdict: On track! Continue for 30 days to confirm.

---

Experiment 2: "Upgraded to Ultra"  
Started: Oct 25, 2025
Hypothesis: Lock in $200/month cost
Status: ✅ Complete (validated over 30 days)

Results:
• Before: $342/month average
• After: $200/month fixed
• Actual savings: $142/month ($1,704/year)
• ROI: 100% (paid for itself immediately)

Verdict: ✅ Successful - keep Ultra plan
```

**Challenges:** Detecting causality, confounding variables (project changes)

---

## Technical Architecture

### Core Package Structure
```
@cursor-analyzer/core
├── src/
│   ├── parsers/
│   │   └── cursor-csv.ts       # CSV parsing & validation
│   ├── analyzers/
│   │   ├── cost.ts             # Cost calculations
│   │   ├── efficiency.ts       # Model efficiency scoring
│   │   ├── cache.ts            # Cache analysis
│   │   ├── patterns.ts         # Usage pattern detection
│   │   └── recommendations.ts  # Opportunity identification
│   ├── types/
│   │   ├── usage.ts            # Data type definitions
│   │   └── analysis.ts         # Result type definitions
│   └── index.ts                # Public API
└── README.md

Public API:
  parseCSV(file: File | string) → ParsedUsage[]
  analyze(data: ParsedUsage[]) → AnalysisResult
  generateRecommendations(analysis: AnalysisResult) → Recommendation[]
```

### Adapter Structure
```
@cursor-analyzer/web
├── Uses core package via npm
├── React components for visualization
└── Static export (no server)

@cursor-analyzer/cli  
├── Uses core package via npm
├── Terminal formatting (chalk, cli-table)
└── Published as executable

AI Agent Usage:
import { parseCSV, analyze } from '@cursor-analyzer/core';
const data = parseCSV(csvString);
const results = analyze(data);
// Process results programmatically
```

---

## Appendix: Sample Output

### Full Analysis Example
```json
{
  "summary": {
    "period": {
      "start": "2025-10-10",
      "end": "2025-11-07",
      "days": 26
    },
    "cost": {
      "total": 342.59,
      "daily_average": 13.18,
      "by_type": {
        "included": 62.76,
        "on_demand": 258.92,
        "errored": 20.91
      }
    },
    "usage": {
      "total_requests": 1330,
      "requests_per_day": 51.2,
      "total_tokens": 895000000,
      "cache_efficiency": 0.872
    }
  },
  
  "model_efficiency": [
    {
      "model": "grok-code-fast-1",
      "cost_per_million_tokens": 46.92,
      "efficiency_score": 95,
      "category": "cost_efficient",
      "recommendation": "Use more for syntax and refactors"
    },
    {
      "model": "claude-4.5-sonnet-thinking",
      "cost_per_million_tokens": 776.08,
      "efficiency_score": 45,
      "category": "premium",
      "recommendation": "Reserve for complex architecture decisions only"
    }
  ],
  
  "plan_recommendation": {
    "current_plan": "Pro",
    "current_monthly_cost": 370,
    "recommended_plan": "Ultra",
    "recommended_cost": 200,
    "savings": 170,
    "confidence": "high",
    "reasoning": "You consistently exceed Pro's request limits and pay overages"
  },
  
  "opportunities": [
    {
      "type": "plan_optimization",
      "title": "Upgrade to Ultra Plan",
      "savings_monthly": 170,
      "difficulty": "easy",
      "impact": "high",
      "action": "cursor.sh/settings → Upgrade to Ultra"
    },
    {
      "type": "model_migration",
      "title": "Migrate 30% Claude Thinking to Grok",
      "savings_monthly": 73,
      "difficulty": "medium",
      "impact": "medium",
      "action": "Use Grok for: syntax, refactors, simple completions"
    }
  ],
  
  "patterns": {
    "peak_hours": [18, 19, 22],
    "work_style": "night_coder",
    "usage_consistency": "steady",
    "weekend_ratio": 0.15
  }
}
```

---

## Success Definition

**V1 is successful if:**
1. ✅ Users save measurable money (30%+ report cost reduction)
2. ✅ Core package is consumed by all three interfaces (web, CLI, JSON)
3. ✅ 90% of analyses complete without errors on valid CSVs
4. ✅ Recommendations are acted upon (70%+ follow-through on plan changes)
5. ✅ Tool is recommended organically (Twitter/GitHub mentions, word-of-mouth)

**V1 is ready to ship when:**
- All 8 core requirements (CR-1 through CR-8) are implemented
- Core package passes 95%+ test coverage
- Web UI and CLI both consume core successfully
- Documentation is complete for all three usage modes
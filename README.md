# Cursor Cost Explorer

A privacy-first analyzer for Cursor IDE usage data. Transforms CSV exports into actionable cost insights and optimization recommendations.

## Overview

Cursor IDE users spend $20-$370/month on AI coding assistance but lack visibility into their usage patterns and cost efficiency. This tool helps users:

- **Understand costs**: See where money is going at a glance
- **Optimize spending**: Get specific recommendations to save 30-50% on costs
- **Improve efficiency**: Identify model selection inefficiencies and cache optimization opportunities
- **Privacy-first**: All processing happens locally - your data never leaves your device

## Architecture

**Core Principle**: One core analysis engine, multiple consumption interfaces.

- **Core Domain Logic** (`src/domain/`): Pure JavaScript domain logic with zero external dependencies
- **Future Interfaces**: Web UI, CLI, and JSON API will consume the core engine

## Project Structure

```
cursor_cost_explorer/
├── src/
│   └── domain/          # Domain logic (pure JS, no dependencies)
├── docs/                # Project documentation
├── backlog/             # Project management and tasks
└── package.json
```

## Requirements

- Node.js >= 24.0.0 (latest LTS)

## Setup

```bash
# Install latest Node.js LTS (if using nvm)
nvm install --lts
nvm use --lts

# Verify Node.js version
node --version  # Should be v24.x.x
```

## Development

This project focuses on **domain logic first** with pure JavaScript and minimal dependencies.

### Current Focus

- ✅ Project setup with latest Node.js
- 🔄 Domain types and data models
- 🔄 CSV parser and validation
- 🔄 Cost analysis engine
- 🔄 Model efficiency analysis
- 🔄 Plan optimization logic
- 🔄 Cache efficiency assessment
- 🔄 Savings opportunities identification
- 🔄 Usage pattern analysis
- 🔄 Core analysis engine and JSON export

## License

ISC


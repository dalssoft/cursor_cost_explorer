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
- **CLI Interface** (`src/cli/`): Command-line tool for terminal usage
- **Web UI** (`docs/`): Browser-based interface for interactive analysis
- **JSON API** (`src/index.js`): Programmatic access to analysis engine

## Project Structure

```
cursor_cost_explorer/
├── src/
│   ├── domain/          # Domain logic (pure JS, no dependencies)
│   │   ├── analyzers/   # Analysis modules (cost, efficiency, optimization)
│   │   ├── entities/    # Domain entities (UsageRecord, DailyUsage, etc.)
│   │   ├── parsers/     # CSV parsing and validation
│   │   └── models/      # Model registry and pricing
│   ├── cli/             # CLI entry point and text formatter
│   └── index.js         # Public API for programmatic use
├── docs/                # Web UI (HTML/CSS/JS)
├── tests/               # Test suite
├── backlog/             # Project management and tasks
└── package.json
```

## Requirements

- Node.js >= 21.0.0

## Installation

### Option 1: Install globally (recommended)

```bash
npm install -g cursor-cost-explorer
```

### Option 2: Use with npx (no installation required)

```bash
npx cursor-cost-explorer <csv-file> [options]
```

## Usage

After installation, analyze your Cursor IDE usage data:

```bash
# Basic usage - analyze CSV file
cursor-cost-explorer usage.csv

# Enable ASCII graphs for visual insights
cursor-cost-explorer usage.csv --show-graphs

# Save output to a file
cursor-cost-explorer usage.csv --output analysis.txt

# Export raw JSON for programmatic use
cursor-cost-explorer usage.csv --json --output analysis.json
```

### Command Line Options

- `<csv-file>`: Path to CSV file exported from Cursor IDE (required)
- `--show-graphs, -g`: Enable ASCII graph generation (bar charts, trends)
- `--output <file>, -o`: Save output to file instead of stdout
- `--json, -j`: Output raw JSON (for programmatic use)
- `--help, -h`: Show help message
- `--version, -v`: Show version number

### Web UI

For an interactive browser-based experience, open `docs/index.html` in your browser and upload your CSV file directly. The web UI provides:

- Interactive visualizations
- Real-time analysis
- No command-line required
- Works entirely in your browser (no server needed)

## Setup (for development)

```bash
# Install latest Node.js LTS (if using nvm)
nvm install --lts
nvm use --lts

# Verify Node.js version
node --version  # Should be v21.x.x or higher
```

## Features

### Core Analysis Capabilities

- ✅ **Cost Analysis**: Daily, weekly, and monthly cost breakdowns with model-level insights
- ✅ **Model Efficiency Analysis**: Identifies inefficient model usage patterns and recommendations
- ✅ **Plan Optimization**: Analyzes usage patterns and recommends optimal Cursor subscription plans
- ✅ **Cache Efficiency Assessment**: Evaluates cache hit rates and optimization opportunities
- ✅ **Savings Opportunities**: Identifies specific actions to reduce costs by 30-50%
- ✅ **Usage Pattern Analysis**: Analyzes work style, peak usage times, and productivity patterns

### Interfaces

- ✅ **CLI Tool**: Full-featured command-line interface with ASCII graph support
- ✅ **Web UI**: Interactive browser-based interface for visual analysis
- ✅ **JSON API**: Programmatic access for integration with other tools

### Technical Highlights

- **Zero External Dependencies**: Core domain logic is pure JavaScript
- **Privacy-First**: All processing happens locally - your data never leaves your device
- **Comprehensive Testing**: Full test coverage for all analysis modules
- **Clean Architecture**: Domain logic separated from infrastructure concerns

## Development

This project follows clean architecture principles with domain logic separated from infrastructure.

### Running Tests

```bash
npm test
```

### Development Workflow

1. Domain logic lives in `src/domain/` with zero external dependencies
2. CLI and Web UI consume the core engine via `src/index.js`
3. All analysis modules are thoroughly tested in `tests/`

## License

ISC


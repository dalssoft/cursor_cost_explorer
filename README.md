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

## Setup (for development)

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


#!/usr/bin/env node
/**
 * CLI entry point for Cursor Cost Explorer
 * Usage: cursor-cost-explorer <csv-file> [--show-graphs] [--output <file>] [--json]
 */

import { parseCSVFile, analyze, exportJSON, TextFormatter } from '../index.js';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parses command-line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        csvFile: null,
        showGraphs: false,
        outputFile: null,
        json: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--show-graphs' || arg === '-g') {
            result.showGraphs = true;
        } else if (arg === '--output' || arg === '-o') {
            if (i + 1 < args.length) {
                result.outputFile = args[++i];
            } else {
                throw new Error('--output requires a file path');
            }
        } else if (arg === '--json' || arg === '-j') {
            result.json = true;
        } else if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        } else if (arg === '--version' || arg === '-v') {
            printVersion();
            process.exit(0);
        } else if (!arg.startsWith('-')) {
            // Positional argument - CSV file path
            if (!result.csvFile) {
                result.csvFile = arg;
            } else {
                throw new Error(`Unexpected argument: ${arg}`);
            }
        } else {
            throw new Error(`Unknown option: ${arg}`);
        }
    }

    return result;
}

/**
 * Prints help message
 */
function printHelp() {
    console.log(`
Cursor Cost Explorer - Analyze Cursor IDE usage and costs

Usage:
  cursor-cost-explorer <csv-file> [options]

Arguments:
  <csv-file>              Path to CSV file exported from Cursor IDE

Options:
  --show-graphs, -g       Enable ASCII graph generation (bar charts, trends)
  --output <file>, -o     Save output to file instead of stdout
  --json, -j              Output raw JSON (for programmatic use)
  --help, -h              Show this help message
  --version, -v           Show version number

Examples:
  cursor-cost-explorer usage.csv
  cursor-cost-explorer usage.csv --show-graphs
  cursor-cost-explorer usage.csv --output report.txt
  cursor-cost-explorer usage.csv --json --output analysis.json
`);
}

/**
 * Prints version information
 */
function printVersion() {
    // Read version from package.json
    try {
        const packageJsonPath = resolve(__dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        console.log(`cursor-cost-explorer v${packageJson.version}`);
    } catch (e) {
        console.log('cursor-cost-explorer v1.0.0');
    }
}

/**
 * Main CLI function
 */
async function main() {
    try {
        // Parse arguments
        const args = parseArgs();

        // Validate CSV file argument
        if (!args.csvFile) {
            console.error('Error: CSV file path is required');
            console.error('Usage: cursor-cost-explorer <csv-file> [options]');
            console.error('Run with --help for more information');
            process.exit(1);
        }

        // Parse CSV file
        let parseResult;
        try {
            parseResult = await parseCSVFile(args.csvFile);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`Error: File not found: ${args.csvFile}`);
                console.error('Please check the file path and try again.');
            } else if (error.message.includes('parse')) {
                console.error(`Error: Failed to parse CSV file: ${args.csvFile}`);
                console.error(error.message);
            } else {
                console.error(`Error reading file: ${error.message}`);
            }
            process.exit(1);
        }

        if (!parseResult.records || parseResult.records.length === 0) {
            console.error('Error: CSV file contains no valid records');
            console.error('Please check that the file is a valid Cursor usage export.');
            process.exit(1);
        }

        // Run analysis
        let analysisResult;
        try {
            analysisResult = analyze(parseResult.records);
        } catch (error) {
            console.error('Error: Failed to analyze usage data');
            console.error(error.message);
            process.exit(1);
        }

        // Format output
        let output;
        if (args.json) {
            // JSON output
            output = exportJSON(analysisResult, true);
        } else {
            // Text output
            const formatter = new TextFormatter();

            // TODO: When task 12 is complete, pass showGraphs flag to formatter
            // For now, graphs are not yet implemented
            if (args.showGraphs) {
                console.error('Warning: --show-graphs flag is not yet implemented (task 12 pending)');
                console.error('Proceeding with text-only output...\n');
            }

            output = formatter.format(analysisResult);
        }

        // Output results
        if (args.outputFile) {
            try {
                writeFileSync(args.outputFile, output, 'utf-8');
                console.error(`Output saved to: ${args.outputFile}`);
            } catch (error) {
                console.error(`Error: Failed to write output file: ${args.outputFile}`);
                console.error(error.message);
                process.exit(1);
            }
        } else {
            // Output to stdout
            console.log(output);
        }

        // Success
        process.exit(0);

    } catch (error) {
        // Handle argument parsing errors
        if (error.message.includes('requires') || error.message.includes('Unknown') || error.message.includes('Unexpected')) {
            console.error(`Error: ${error.message}`);
            console.error('Run with --help for usage information');
            process.exit(1);
        }

        // Handle other errors
        console.error('Error:', error.message);
        if (error.stack && process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run CLI when executed directly (not when imported)
// Check if this is being run directly vs imported
const isMainModule = process.argv[1] &&
    fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
    main();
}

export { main, parseArgs };


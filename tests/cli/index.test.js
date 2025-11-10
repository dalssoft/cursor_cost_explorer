import { test } from 'node:test';
import assert from 'node:assert';
import { parseArgs } from '../../src/cli/index.js';

test('parseArgs parses CSV file argument', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test.csv'];

    const args = parseArgs();
    assert.strictEqual(args.csvFile, 'test.csv');
    assert.strictEqual(args.showGraphs, false);
    assert.strictEqual(args.outputFile, null);
    assert.strictEqual(args.json, false);

    process.argv = originalArgv;
});

test('parseArgs parses --show-graphs flag', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test.csv', '--show-graphs'];

    const args = parseArgs();
    assert.strictEqual(args.csvFile, 'test.csv');
    assert.strictEqual(args.showGraphs, true);

    process.argv = originalArgv;
});

test('parseArgs parses --output flag', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test.csv', '--output', 'output.txt'];

    const args = parseArgs();
    assert.strictEqual(args.csvFile, 'test.csv');
    assert.strictEqual(args.outputFile, 'output.txt');

    process.argv = originalArgv;
});

test('parseArgs parses --json flag', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test.csv', '--json'];

    const args = parseArgs();
    assert.strictEqual(args.csvFile, 'test.csv');
    assert.strictEqual(args.json, true);

    process.argv = originalArgv;
});

test('parseArgs parses short flags', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test.csv', '-g', '-o', 'out.txt', '-j'];

    const args = parseArgs();
    assert.strictEqual(args.csvFile, 'test.csv');
    assert.strictEqual(args.showGraphs, true);
    assert.strictEqual(args.outputFile, 'out.txt');
    assert.strictEqual(args.json, true);

    process.argv = originalArgv;
});

test('parseArgs throws error for missing --output value', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test.csv', '--output'];

    assert.throws(() => {
        parseArgs();
    }, /--output requires a file path/);

    process.argv = originalArgv;
});

test('parseArgs throws error for unknown option', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test.csv', '--unknown'];

    assert.throws(() => {
        parseArgs();
    }, /Unknown option/);

    process.argv = originalArgv;
});

test('parseArgs throws error for multiple CSV files', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', 'test1.csv', 'test2.csv'];

    assert.throws(() => {
        parseArgs();
    }, /Unexpected argument/);

    process.argv = originalArgv;
});


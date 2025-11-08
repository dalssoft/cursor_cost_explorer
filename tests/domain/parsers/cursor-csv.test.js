import { test } from 'node:test';
import assert from 'node:assert';
import { parseCSV, parseCSVContent, CSVParser } from '../../../src/domain/parsers/cursor-csv.js';
import { readFileSync } from 'fs';

test('CSVParser class can be instantiated', () => {
    const parser = new CSVParser();
    assert.ok(parser instanceof CSVParser);
    assert.ok(Array.isArray(parser.requiredColumns));
});

test('parseCSVLine handles simple CSV', () => {
    const parser = new CSVParser();
    const result = parser.parseCSVLine('a,b,c');
    assert.deepStrictEqual(result, ['a', 'b', 'c']);
});

test('parseCSVLine handles quoted fields', () => {
    const parser = new CSVParser();
    const result = parser.parseCSVLine('"a,b","c","d"');
    assert.deepStrictEqual(result, ['a,b', 'c', 'd']);
});

test('parseCSVLine handles escaped quotes', () => {
    const parser = new CSVParser();
    const result = parser.parseCSVLine('"a""b","c"');
    assert.deepStrictEqual(result, ['a"b', 'c']);
});

test('parseNumber converts string to number', () => {
    const parser = new CSVParser();
    assert.strictEqual(parser.parseNumber('123'), 123);
    assert.strictEqual(parser.parseNumber('"123"'), 123);
    assert.strictEqual(parser.parseNumber('0.03'), 0.03);
    assert.strictEqual(parser.parseNumber(''), 0);
    assert.strictEqual(parser.parseNumber(null), 0);
});

test('findColumnIndex is case-insensitive', () => {
    const parser = new CSVParser();
    const headers = ['Date', 'Kind', 'Model'];
    assert.strictEqual(parser.findColumnIndex(headers, 'date'), 0);
    assert.strictEqual(parser.findColumnIndex(headers, 'DATE'), 0);
    assert.strictEqual(parser.findColumnIndex(headers, 'Model'), 2);
    assert.strictEqual(parser.findColumnIndex(headers, 'Missing'), -1);
});

test('validateColumns detects missing columns', () => {
    const parser = new CSVParser();
    const headers = ['Date', 'Kind', 'Model', 'Cost'];
    const result = parser.validateColumns(headers);
    assert.strictEqual(result.valid, false);
    assert.ok(result.missing.length > 0);
});

test('validateColumns maps all required columns', () => {
    const parser = new CSVParser();
    const headers = ['Date', 'Kind', 'Model', 'Cost', 'Total Tokens', 'Cache Read'];
    const result = parser.validateColumns(headers);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.missing.length, 0);
    assert.ok('Date' in result.columnMap);
    assert.ok('Cost' in result.columnMap);
});

test('parseCSVContent parses valid CSV', () => {
    const csv = `Date,Kind,Model,Cost,Total Tokens,Cache Read,Output Tokens,Input (w/o Cache Write)
"2025-11-07T20:13:36.375Z","Included","grok-code-fast-1","0.03","1440897","1432959","1627","6311"`;

    const result = parseCSVContent(csv);
    assert.strictEqual(result.validRows, 1);
    assert.strictEqual(result.totalRows, 1);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.records.length, 1);

    const record = result.records[0];
    assert.strictEqual(record.date, '2025-11-07T20:13:36.375Z');
    assert.strictEqual(record.kind, 'Included');
    assert.strictEqual(record.model, 'grok-code-fast-1');
    assert.strictEqual(record.cost, 0.03);
    assert.strictEqual(record.totalTokens, 1440897);
    assert.strictEqual(record.cacheRead, 1432959);
    assert.strictEqual(record.input, 6311);
    assert.strictEqual(record.output, 1627);
});

test('parseCSVContent throws on missing columns', () => {
    const csv = `Date,Kind,Model
"2025-11-07","Included","grok-code-fast-1"`;

    assert.throws(() => {
        parseCSVContent(csv);
    }, /Column.*missing/);
});

test('parseCSVContent skips invalid rows', () => {
    const csv = `Date,Kind,Model,Cost,Total Tokens,Cache Read,Output Tokens,Input (w/o Cache Write)
"2025-11-07T20:13:36.375Z","Included","grok-code-fast-1","0.03","1440897","1432959","1627","6311"
"","","","","","","",""
"2025-11-07T20:13:36.375Z","Included","model","0.03","1440897","1432959","1627","6311"`;

    const result = parseCSVContent(csv);
    assert.strictEqual(result.validRows, 2);
    assert.strictEqual(result.totalRows, 3);
    assert.ok(result.errors.length > 0);
});

test('parseCSVFile reads and parses file', () => {
    const result = parseCSV('data/usage-events-2025-11-07.csv');
    assert.ok(result.validRows > 0);
    assert.ok(result.records.length > 0);
    assert.strictEqual(result.formatVersion, '1.0');
});

test('parseCSV handles file path detection', () => {
    const fileResult = parseCSV('data/usage-events-2025-11-07.csv');
    assert.ok(fileResult.validRows > 0);

    const content = readFileSync('data/usage-events-2025-11-07.csv', 'utf-8');
    const contentResult = parseCSVContent(content);
    assert.strictEqual(contentResult.validRows, fileResult.validRows);
});

test('parseCSV throws on invalid input', () => {
    assert.throws(() => {
        parseCSV(null);
    }, /Input must be/);

    assert.throws(() => {
        parseCSV(123);
    }, /Input must be/);
});

test('parseCSVContent throws on empty content', () => {
    assert.throws(() => {
        parseCSVContent('');
    }, /CSV content must be/);

    assert.throws(() => {
        parseCSVContent(null);
    }, /CSV content must be/);
});

test('detectFormatVersion returns 1.0 for valid format', () => {
    const parser = new CSVParser();
    const headers = ['Date', 'Kind', 'Model', 'Cost', 'Total Tokens', 'Cache Read'];
    assert.strictEqual(parser.detectFormatVersion(headers), '1.0');
});

test('detectFormatVersion returns unknown for invalid format', () => {
    const parser = new CSVParser();
    const headers = ['Date', 'Kind'];
    assert.strictEqual(parser.detectFormatVersion(headers), 'unknown');
});

test('rowToUsageRecord handles missing optional columns', () => {
    const parser = new CSVParser();
    const headers = ['Date', 'Kind', 'Model', 'Cost', 'Total Tokens', 'Cache Read'];
    const columnMap = {
        'Date': 0,
        'Kind': 1,
        'Model': 2,
        'Cost': 3,
        'Total Tokens': 4,
        'Cache Read': 5
    };
    const row = ['"2025-11-07"', '"Included"', '"grok-code-fast-1"', '"0.03"', '"1000"', '"500"'];

    const record = parser.rowToUsageRecord(row, columnMap, headers, 1);
    assert.strictEqual(record.input, 0); // Default when missing
    assert.strictEqual(record.output, 0); // Default when missing
});

test('parseCSVContent handles multiple rows correctly', () => {
    const csv = `Date,Kind,Model,Cost,Total Tokens,Cache Read,Output Tokens,Input (w/o Cache Write)
"2025-11-07T20:13:36.375Z","Included","grok-code-fast-1","0.03","1440897","1432959","1627","6311"
"2025-11-07T20:08:40.938Z","Included","grok-code-fast-1","0.04","808795","714628","1448","92719"`;

    const result = parseCSVContent(csv);
    assert.strictEqual(result.validRows, 2);
    assert.strictEqual(result.records.length, 2);
    assert.strictEqual(result.records[0].cost, 0.03);
    assert.strictEqual(result.records[1].cost, 0.04);
});

test('parseCSVContent validates date format', () => {
    const csv = `Date,Kind,Model,Cost,Total Tokens,Cache Read,Output Tokens,Input (w/o Cache Write)
"invalid-date","Included","grok-code-fast-1","0.03","1440897","1432959","1627","6311"`;

    const result = parseCSVContent(csv);
    assert.strictEqual(result.validRows, 0);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some(e => e.includes('Date format invalid')));
});


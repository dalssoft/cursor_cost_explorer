/**
 * Browser-compatible wrapper for CSV parser
 * Exports parseCSVContent without fs dependency
 */

// Import the parser class directly and create a browser-safe version
import { UsageRecord } from '../src/domain/entities/UsageRecord.js';

class BrowserCSVParser {
    constructor() {
        this.requiredColumns = [
            'Date',
            'Kind',
            'Model',
            'Cost',
            'Total Tokens',
            'Cache Read'
        ];

        this.columnAliases = {
            'Input': ['Input', 'Input (w/o Cache Write)'],
            'Output': ['Output', 'Output Tokens']
        };
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        // Add last field
        result.push(current.trim());
        return result;
    }

    findColumnIndex(headers, columnName) {
        const normalized = columnName.toLowerCase().trim();
        return headers.findIndex(h => h.toLowerCase().trim() === normalized);
    }

    findColumnIndexWithAliases(headers, aliases) {
        for (const alias of aliases) {
            const index = this.findColumnIndex(headers, alias);
            if (index !== -1) return index;
        }
        return -1;
    }

    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        // Remove quotes and parse
        const cleaned = value.replace(/^"|"$/g, '').replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    rowToUsageRecord(row, columnMap, headers, rowNumber) {
        const getValue = (columnName, defaultValue = 0) => {
            const index = columnMap[columnName];
            if (index === undefined || index < 0) {
                return defaultValue;
            }
            const value = row[index];
            if (value === null || value === undefined || value === '') {
                return defaultValue;
            }
            return value;
        };

        const getValueWithAliases = (aliases, defaultValue = 0) => {
            const index = this.findColumnIndexWithAliases(headers, aliases);
            if (index === -1 || index >= row.length) {
                return defaultValue;
            }
            const value = row[index];
            if (value === null || value === undefined || value === '') {
                return defaultValue;
            }
            return value;
        };

        const date = getValue('Date', '');
        const kind = getValue('Kind', '');
        const model = getValue('Model', '');

        const recordData = {
            date: date.replace(/^"|"$/g, '').trim(),
            kind: kind.replace(/^"|"$/g, '').trim(),
            model: model.replace(/^"|"$/g, '').trim(),
            cost: this.parseNumber(getValue('Cost')),
            totalTokens: this.parseNumber(getValue('Total Tokens')),
            cacheRead: this.parseNumber(getValue('Cache Read')),
            input: this.parseNumber(getValueWithAliases(this.columnAliases['Input'])),
            output: this.parseNumber(getValueWithAliases(this.columnAliases['Output']))
        };

        return new UsageRecord(recordData);
    }

    validateColumns(headers) {
        const missing = [];
        const columnMap = {};

        for (const required of this.requiredColumns) {
            const index = this.findColumnIndex(headers, required);
            if (index === -1) {
                missing.push(required);
            } else {
                columnMap[required] = index;
            }
        }

        return { valid: missing.length === 0, missing, columnMap };
    }

    detectFormatVersion(headers) {
        // Future: detect format changes by checking for new columns
        // For now, return '1.0' if all required columns present
        const { valid } = this.validateColumns(headers);
        return valid ? '1.0' : 'unknown';
    }

    parseContent(csvContent) {
        const errors = [];
        const records = [];

        if (!csvContent || typeof csvContent !== 'string') {
            throw new Error('CSV content must be a non-empty string');
        }

        const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }

        // Parse header
        const headers = this.parseCSVLine(lines[0]);
        const { valid, missing, columnMap } = this.validateColumns(headers);

        if (!valid) {
            const missingList = missing.join(', ');
            throw new Error(
                `Column${missing.length > 1 ? 's' : ''} '${missingList}' missing - is this a Cursor usage export?`
            );
        }

        const formatVersion = this.detectFormatVersion(headers);

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            try {
                const row = this.parseCSVLine(line);
                const record = this.rowToUsageRecord(row, columnMap, headers, i + 1);

                // Skip records with missing essential data
                if (!record.date || !record.model) {
                    errors.push(`Row ${i + 1}: Missing date or model, skipped`);
                    continue;
                }

                // Validate date format (basic check)
                if (!/^\d{4}-\d{2}-\d{2}/.test(record.date)) {
                    errors.push(`Row ${i + 1}: Date format invalid - expected ISO 8601 (YYYY-MM-DD), got "${record.date}"`);
                    continue;
                }

                records.push(record);
            } catch (error) {
                errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }

        return {
            records,
            errors,
            formatVersion,
            totalRows: lines.length - 1,
            validRows: records.length
        };
    }
}

// Create browser-safe parser instance
const browserParser = new BrowserCSVParser();

// Export browser-compatible parseCSVContent
export function parseCSVContent(csvContent) {
    return browserParser.parseContent(csvContent);
}


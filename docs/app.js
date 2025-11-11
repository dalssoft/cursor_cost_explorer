/**
 * Browser-compatible entry point for Cursor Cost Explorer Web UI
 * Uses ES modules - all processing happens client-side
 */

// Import browser-compatible CSV parser (no fs dependency)
import { parseCSVContent } from './browser-csv-parser.js';

// Import analysis engine and formatter directly (avoiding CSV parser's fs import)
import { analyze } from '../src/domain/analyzer.js';
import { TextFormatter } from '../src/formatters/text-formatter.js';

// GitHub API to fetch star count
async function fetchGitHubStars() {
    try {
        const response = await fetch('https://api.github.com/repos/dalssoft/cursor_cost_explorer');
        if (response.ok) {
            const data = await response.json();
            const stars = data.stargazers_count || 0;
            document.getElementById('github-stars').textContent = `${stars} ⭐`;
        } else {
            document.getElementById('github-stars').textContent = 'GitHub';
        }
    } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
        document.getElementById('github-stars').textContent = 'GitHub';
    }
}

// File handling
function setupFileHandling() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const outputSection = document.getElementById('outputSection');
    const outputContent = document.getElementById('outputContent');
    const errorContainer = document.getElementById('errorContainer');

    // Click to browse
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    async function handleFile(file) {
        // Clear previous errors
        errorContainer.innerHTML = '';
        outputSection.classList.remove('active');
        outputContent.textContent = '';

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            showError('Please select a CSV file.');
            return;
        }

        // Show loading state
        outputSection.classList.add('active');
        outputContent.textContent = 'Loading and analyzing...\n\n';

        try {
            // Read file content
            const fileContent = await readFileAsText(file);

            // Parse CSV
            outputContent.textContent = 'Parsing CSV...\n';
            const parseResult = parseCSVContent(fileContent);

            if (!parseResult.records || parseResult.records.length === 0) {
                throw new Error('CSV file contains no valid records. Please check that the file is a valid Cursor usage export.');
            }

            // Show parse warnings if any
            if (parseResult.errors && parseResult.errors.length > 0) {
                console.warn('Parse warnings:', parseResult.errors);
                // Show warnings in output
                const warningText = parseResult.errors.slice(0, 5).join('\n');
                outputContent.textContent += `\n⚠️ Warnings:\n${warningText}\n\n`;
            }

            // Analyze
            outputContent.textContent += `Parsed ${parseResult.records.length} records.\nAnalyzing...\n`;
            const analysisResult = analyze(parseResult.records);

            // Format output (with graphs enabled)
            outputContent.textContent += 'Formatting results...\n';
            const formatter = new TextFormatter();
            const formattedOutput = formatter.format(analysisResult, true); // showGraphs = true

            // Display results
            outputContent.textContent = formattedOutput;

            // Scroll to output
            setTimeout(() => {
                outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (error) {
            console.error('Error processing file:', error);
            showError(`Error: ${error.message}\n\nPlease ensure you're uploading a valid Cursor usage export CSV file.`);
            outputSection.classList.remove('active');
        }
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    function showError(message) {
        errorContainer.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupFileHandling();
        fetchGitHubStars();
    });
} else {
    setupFileHandling();
    fetchGitHubStars();
}

/**
 * Text formatter for AnalysisResult
 * Converts analysis results to human-readable plain text with ASCII tables
 * Pure JavaScript - no external dependencies
 */

class TextFormatter {
    /**
     * Formats an AnalysisResult object to plain text
     * @param {Object} analysisResult - Analysis result from analyzer
     * @returns {string} Formatted text output
     */
    format(analysisResult) {
        if (!analysisResult) {
            throw new Error('AnalysisResult cannot be null or undefined');
        }

        const sections = [];

        // Add metadata header
        sections.push(this.formatMetadata(analysisResult.metadata));

        // Add summary section
        sections.push(this.formatSummary(analysisResult.summary));

        // Add cost analysis section
        sections.push(this.formatCostAnalysis(analysisResult.cost_analysis));

        // Add model efficiency section
        sections.push(this.formatModelEfficiency(analysisResult.model_efficiency));

        // Add plan recommendation section
        sections.push(this.formatPlanRecommendation(analysisResult.plan_recommendation));

        // Add cache efficiency section
        sections.push(this.formatCacheEfficiency(analysisResult.cache_efficiency));

        // Add opportunities section
        sections.push(this.formatOpportunities(analysisResult.opportunities));

        // Add patterns section
        sections.push(this.formatPatterns(analysisResult.patterns));

        return sections.filter(s => s).join('\n\n');
    }

    /**
     * Formats metadata section
     * @param {Object} metadata - Metadata object
     * @returns {string} Formatted metadata
     */
    formatMetadata(metadata) {
        if (!metadata) return '';

        const lines = [
            '='.repeat(80),
            'CURSOR COST EXPLORER - ANALYSIS REPORT',
            '='.repeat(80),
            '',
            `Generated: ${this.formatDate(metadata.generated_at)}`,
            `Total Records: ${metadata.total_records || 0}`,
            `Analysis Version: ${metadata.analysis_version || '1.0'}`
        ];

        return lines.join('\n');
    }

    /**
     * Formats summary section
     * @param {Object} summary - Summary object
     * @returns {string} Formatted summary
     */
    formatSummary(summary) {
        if (!summary) return '';

        const lines = [
            '-'.repeat(80),
            'SUMMARY',
            '-'.repeat(80),
            ''
        ];

        // Period
        if (summary.period) {
            lines.push(`Period: ${summary.period.start} to ${summary.period.end} (${summary.period.days} days)`);
            lines.push('');
        }

        // Cost summary table
        if (summary.cost) {
            const costTable = [
                ['Metric', 'Value'],
                ['Total Cost', this.formatCurrency(summary.cost.total)],
                ['Daily Average', this.formatCurrency(summary.cost.daily_average)],
                ['Included Cost', this.formatCurrency(summary.cost.by_type?.included || 0)],
                ['On-Demand Cost', this.formatCurrency(summary.cost.by_type?.on_demand || 0)]
            ];
            lines.push(...this.formatTable(costTable));
            lines.push('');
        }

        // Usage summary table
        if (summary.usage) {
            const usageTable = [
                ['Metric', 'Value'],
                ['Total Requests', this.formatNumber(summary.usage.total_requests)],
                ['Requests per Day', this.formatNumber(summary.usage.requests_per_day, 2)],
                ['Total Tokens', this.formatNumber(summary.usage.total_tokens)],
                ['Cache Efficiency', this.formatPercentage(summary.usage.cache_efficiency)]
            ];
            lines.push(...this.formatTable(usageTable));
        }

        return lines.join('\n');
    }

    /**
     * Formats cost analysis section
     * @param {Object} costAnalysis - Cost analysis object
     * @returns {string} Formatted cost analysis
     */
    formatCostAnalysis(costAnalysis) {
        if (!costAnalysis) return '';

        const lines = [
            '-'.repeat(80),
            'COST ANALYSIS',
            '-'.repeat(80),
            ''
        ];

        // Breakdown by model
        if (costAnalysis.breakdown_by_model && costAnalysis.breakdown_by_model.length > 0) {
            lines.push('Cost Breakdown by Model:');
            lines.push('');
            const modelTable = [
                ['Model', 'Cost', 'Requests', 'Percentage']
            ];

            costAnalysis.breakdown_by_model.forEach(item => {
                modelTable.push([
                    item.model || 'Unknown',
                    this.formatCurrency(item.total_cost || 0),
                    this.formatNumber(item.request_count || 0),
                    this.formatPercentage(item.percentage || 0)
                ]);
            });

            lines.push(...this.formatTable(modelTable));
            lines.push('');
        }

        // Breakdown by type
        if (costAnalysis.breakdown_by_type) {
            lines.push('Cost Breakdown by Type:');
            lines.push('');
            const typeTable = [
                ['Type', 'Cost', 'Requests', 'Avg Cost/Request']
            ];

            const types = ['included', 'on_demand'];
            types.forEach(type => {
                const data = costAnalysis.breakdown_by_type[type];
                if (data) {
                    const avgCost = data.request_count > 0 ? data.cost / data.request_count : 0;
                    typeTable.push([
                        type.charAt(0).toUpperCase() + type.slice(1).replace('_', '-'),
                        this.formatCurrency(data.cost || 0),
                        this.formatNumber(data.request_count || 0),
                        this.formatCurrency(avgCost)
                    ]);
                }
            });

            // Show errored requests separately (they are not charged)
            const erroredData = costAnalysis.breakdown_by_type.errored;
            if (erroredData && erroredData.request_count > 0) {
                typeTable.push([
                    'Errored (Not Charged)',
                    '$0.00',
                    this.formatNumber(erroredData.request_count || 0),
                    '$0.00'
                ]);
            }

            lines.push(...this.formatTable(typeTable));
            lines.push('');
        }

        // Most expensive model
        if (costAnalysis.most_expensive_model) {
            lines.push(`Most Expensive Model: ${costAnalysis.most_expensive_model.model || 'Unknown'}`);
            lines.push(`  Total Cost: ${this.formatCurrency(costAnalysis.most_expensive_model.total_cost || 0)}`);
            lines.push('');
        }

        // Top expensive days
        if (costAnalysis.top_expensive_days && costAnalysis.top_expensive_days.length > 0) {
            lines.push('Top 5 Most Expensive Days:');
            lines.push('');
            const daysTable = [
                ['Date', 'Cost', 'Requests']
            ];

            costAnalysis.top_expensive_days.forEach(day => {
                daysTable.push([
                    day.date || 'Unknown',
                    this.formatCurrency(day.cost || 0),
                    this.formatNumber(day.request_count || 0)
                ]);
            });

            lines.push(...this.formatTable(daysTable));
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Formats model efficiency section
     * @param {Object} modelEfficiency - Model efficiency object
     * @returns {string} Formatted model efficiency
     */
    formatModelEfficiency(modelEfficiency) {
        if (!modelEfficiency || !modelEfficiency.rankings || modelEfficiency.rankings.length === 0) {
            return '';
        }

        const lines = [
            '-'.repeat(80),
            'MODEL EFFICIENCY RANKINGS',
            '-'.repeat(80),
            '',
            'Ranked by efficiency score (higher is better):',
            '',
            'Efficiency Score Calculation:',
            '  - Base score: 100 - (cost_per_million_tokens / 10)',
            '  - For thinking models: Uses output tokens instead of total tokens',
            '  - Thinking models get a 20% boost (they provide unique value despite cost)',
            '  - Score is clamped between 0-100',
            '  - Higher score = more cost-efficient (cheaper per token)',
            ''
        ];

        const rankingsTable = [
            ['Rank', 'Model', 'Efficiency', 'Cost/M Tokens', 'Cost/M Output']
        ];

        modelEfficiency.rankings.forEach(item => {
            rankingsTable.push([
                String(item.rank || ''),
                item.model || 'Unknown',
                this.formatNumber(item.efficiency_score || 0, 2),
                this.formatCurrency(item.cost_per_million_tokens || 0),
                this.formatCurrency(item.cost_per_million_output_tokens || 0)
            ]);
        });

        lines.push(...this.formatTable(rankingsTable));
        lines.push('');

        // Add recommendations if available
        const recommendations = modelEfficiency.rankings
            .filter(item => item.recommendation)
            .map(item => `  ${item.model}: ${item.recommendation}`);

        if (recommendations.length > 0) {
            lines.push('Recommendations:');
            lines.push(...recommendations);
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Formats plan recommendation section
     * @param {Object} planRecommendation - Plan recommendation object
     * @returns {string} Formatted plan recommendation
     */
    formatPlanRecommendation(planRecommendation) {
        if (!planRecommendation) return '';

        const lines = [
            '-'.repeat(80),
            'PLAN RECOMMENDATION',
            '-'.repeat(80),
            ''
        ];

        const planTable = [
            ['Metric', 'Value'],
            ['Current Plan (Estimated)', planRecommendation.current_plan || 'Unknown'],
            ['Current Monthly Cost', this.formatCurrency(planRecommendation.current_monthly_cost || 0)],
            ['Recommended Plan', planRecommendation.recommended_plan || 'Unknown'],
            ['Recommended Monthly Cost', this.formatCurrency(planRecommendation.recommended_cost || 0)],
            ['Monthly Savings', this.formatCurrency(planRecommendation.savings_monthly || 0)],
            ['Yearly Savings', this.formatCurrency(planRecommendation.savings_yearly || 0)],
            ['Confidence', planRecommendation.confidence || 'low']
        ];

        lines.push(...this.formatTable(planTable));
        lines.push('');

        if (planRecommendation.reasoning) {
            lines.push('Reasoning:');
            lines.push(this.wrapText(planRecommendation.reasoning, 78));
            lines.push('');
        }

        if (planRecommendation.actions && planRecommendation.actions.length > 0) {
            lines.push('Recommended Actions:');
            planRecommendation.actions.forEach((action, index) => {
                lines.push(`  ${index + 1}. ${action}`);
            });
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Formats cache efficiency section
     * @param {Object} cacheEfficiency - Cache efficiency object
     * @returns {string} Formatted cache efficiency
     */
    formatCacheEfficiency(cacheEfficiency) {
        if (!cacheEfficiency) return '';

        const lines = [
            '-'.repeat(80),
            'CACHE EFFICIENCY',
            '-'.repeat(80),
            ''
        ];

        if (cacheEfficiency.metrics) {
            const metricsTable = [
                ['Metric', 'Value'],
                ['Overall Cache Efficiency', this.formatPercentage(cacheEfficiency.metrics.overall_cache_efficiency || 0)],
                ['Cache Hit Rate', this.formatPercentage(cacheEfficiency.metrics.cache_hit_rate || 0)],
                ['Average Cache Read Ratio', this.formatPercentage(cacheEfficiency.metrics.average_cache_read_ratio || 0)]
            ];

            if (cacheEfficiency.metrics.total_cache_reads !== undefined) {
                metricsTable.push(['Total Cache Reads', this.formatNumber(cacheEfficiency.metrics.total_cache_reads)]);
            }
            if (cacheEfficiency.metrics.total_tokens !== undefined) {
                metricsTable.push(['Total Tokens', this.formatNumber(cacheEfficiency.metrics.total_tokens)]);
            }

            lines.push(...this.formatTable(metricsTable));
            lines.push('');
        }

        // Note: Benchmark and savings data removed as they were not based on real data

        if (cacheEfficiency.feedback && cacheEfficiency.feedback.length > 0) {
            lines.push('Feedback:');
            cacheEfficiency.feedback.forEach(feedback => {
                lines.push(`  - ${feedback}`);
            });
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Formats opportunities section
     * @param {Object} opportunities - Opportunities object
     * @returns {string} Formatted opportunities
     */
    formatOpportunities(opportunities) {
        if (!opportunities || !opportunities.list || opportunities.list.length === 0) {
            return '';
        }

        const lines = [
            '-'.repeat(80),
            'SAVINGS OPPORTUNITIES',
            '-'.repeat(80),
            ''
        ];

        if (opportunities.total_potential_savings_monthly !== undefined) {
            lines.push(`Total Potential Savings: ${this.formatCurrency(opportunities.total_potential_savings_monthly)}/month`);
            lines.push(`  (${this.formatCurrency(opportunities.total_potential_savings_yearly || 0)}/year)`);
            lines.push('');
        }

        opportunities.list.forEach((opp, index) => {
            lines.push(`${index + 1}. ${opp.title || 'Untitled Opportunity'}`);
            lines.push(`   Type: ${opp.type || 'Unknown'}`);
            lines.push(`   Monthly Savings: ${this.formatCurrency(opp.savings_monthly || 0)}`);
            lines.push(`   Yearly Savings: ${this.formatCurrency(opp.savings_yearly || 0)}`);
            lines.push(`   Difficulty: ${opp.difficulty || 'medium'} | Impact: ${opp.impact || 'medium'} | Confidence: ${opp.confidence || 'low'}`);

            if (opp.action) {
                lines.push(`   Action: ${opp.action}`);
            }

            if (opp.reasoning) {
                lines.push(`   Reasoning: ${this.wrapText(opp.reasoning, 72)}`);
            }

            if (opp.from_model && opp.to_model) {
                lines.push(`   Migration: ${opp.from_model} → ${opp.to_model}`);
                if (opp.migration_percentage !== undefined) {
                    lines.push(`   Migration Percentage: ${this.formatPercentage(opp.migration_percentage)}`);
                }
            }

            if (opp.tips && opp.tips.length > 0) {
                lines.push('   Tips:');
                opp.tips.forEach(tip => {
                    lines.push(`     - ${tip}`);
                });
            }

            lines.push('');
        });

        return lines.join('\n');
    }

    /**
     * Formats patterns section
     * @param {Object} patterns - Patterns object
     * @returns {string} Formatted patterns
     */
    formatPatterns(patterns) {
        if (!patterns) return '';

        const lines = [
            '-'.repeat(80),
            'USAGE PATTERNS',
            '-'.repeat(80),
            ''
        ];

        // Work style
        if (patterns.work_style) {
            lines.push('Work Style:');
            if (typeof patterns.work_style === 'string') {
                lines.push(`  ${patterns.work_style}`);
            } else if (patterns.work_style.primary_style) {
                lines.push(`  Primary: ${patterns.work_style.primary_style}`);
                if (patterns.work_style.secondary_style) {
                    lines.push(`  Secondary: ${patterns.work_style.secondary_style}`);
                }
                if (patterns.work_style.description) {
                    lines.push(`  Description: ${patterns.work_style.description}`);
                }
            }
            lines.push('');
        }

        // Peak hours
        if (patterns.peak_hours && patterns.peak_hours.length > 0) {
            lines.push('Peak Hours:');
            const peakHoursStr = patterns.peak_hours
                .map(h => {
                    // Handle both number and object formats
                    if (typeof h === 'object' && h.hour !== undefined) {
                        return `${h.hour}:00`;
                    }
                    return `${h}:00`;
                })
                .join(', ');
            lines.push(`  ${peakHoursStr}`);
            lines.push('');
        }

        // Hourly distribution
        if (patterns.hourly_distribution && patterns.hourly_distribution.length > 0) {
            lines.push('Hourly Distribution (Top 5):');
            lines.push('');

            // Handle both array of numbers and array of objects
            const distribution = patterns.hourly_distribution.map((count, hour) => {
                if (typeof count === 'object' && count.requests !== undefined) {
                    return { hour: count.hour || hour, count: count.requests };
                }
                return { hour, count };
            });

            const sorted = distribution
                .filter(item => item.count > 0) // Only show hours with activity
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            if (sorted.length > 0) {
                const hourlyTable = [
                    ['Hour', 'Request Count']
                ];

                sorted.forEach(item => {
                    hourlyTable.push([
                        `${item.hour}:00`,
                        this.formatNumber(item.count)
                    ]);
                });

                lines.push(...this.formatTable(hourlyTable));
            } else {
                lines.push('  No hourly data available');
            }
            lines.push('');
        }

        // Daily distribution
        if (patterns.daily_distribution && patterns.daily_distribution.length > 0) {
            lines.push('Daily Distribution:');
            lines.push('');

            // Handle both array of numbers and array of objects
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dailyTable = [
                ['Day', 'Request Count']
            ];

            patterns.daily_distribution.forEach((item, index) => {
                let dayName, count;

                if (typeof item === 'object' && item.requests !== undefined) {
                    // Object format: {day: 0-6, dayName: '...', requests: n, cost: n}
                    dayName = dayNames[item.day] || item.dayName || `Day ${item.day}`;
                    count = item.requests;
                } else {
                    // Number format: array of counts
                    dayName = dayNames[index] || `Day ${index}`;
                    count = item;
                }

                dailyTable.push([
                    dayName,
                    this.formatNumber(count)
                ]);
            });

            lines.push(...this.formatTable(dailyTable));
            lines.push('');
        }

        // Usage consistency
        if (patterns.usage_consistency) {
            lines.push(`Usage Consistency: ${patterns.usage_consistency}`);
            lines.push('');
        }

        // Weekend ratio
        if (patterns.weekend_ratio !== undefined) {
            lines.push(`Weekend Usage Ratio: ${this.formatPercentage(patterns.weekend_ratio)}`);
            lines.push('');
        }

        // Recommendations
        if (patterns.recommendations && patterns.recommendations.length > 0) {
            lines.push('Recommendations:');
            patterns.recommendations.forEach((rec, index) => {
                // Handle both string and object formats
                if (typeof rec === 'string') {
                    lines.push(`  ${index + 1}. ${rec}`);
                } else if (rec.message) {
                    lines.push(`  ${index + 1}. ${rec.message}`);
                } else if (rec.title) {
                    lines.push(`  ${index + 1}. ${rec.title}`);
                } else {
                    lines.push(`  ${index + 1}. ${JSON.stringify(rec)}`);
                }
            });
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Formats a table with ASCII borders
     * @param {Array<Array<string>>} rows - Array of rows, each row is an array of cells
     * @returns {Array<string>} Formatted table lines
     */
    formatTable(rows) {
        if (!rows || rows.length === 0) return [];

        // Filter out separator rows (rows with dashes) - handle both Unicode and ASCII dashes
        const dataRows = rows.filter(row => !row.some(cell => String(cell).match(/^[-─]+$/)));

        if (dataRows.length === 0) return [];

        // Calculate column widths
        const numCols = Math.max(...dataRows.map(row => row.length));
        const colWidths = Array(numCols).fill(0);

        dataRows.forEach(row => {
            row.forEach((cell, colIndex) => {
                const cellLength = String(cell || '').length;
                if (cellLength > colWidths[colIndex]) {
                    colWidths[colIndex] = cellLength;
                }
            });
        });

        // Format rows
        const formattedRows = [];
        dataRows.forEach((row, rowIndex) => {
            const cells = row.map((cell, colIndex) => {
                const cellStr = String(cell || '');
                const width = colWidths[colIndex];
                return cellStr.padEnd(width, ' ');
            });

            // Regular row with borders using simple ASCII: | and -
            const rowStr = cells.join(' | ');
            formattedRows.push(`| ${rowStr} |`);

            // Add separator after header row
            if (rowIndex === 0) {
                const separator = colWidths.map(width => '-'.repeat(width)).join('-+-');
                formattedRows.push(`+-${separator}-+`);
            }
        });

        // Add top and bottom borders using simple ASCII
        const topBorder = colWidths.map(width => '-'.repeat(width)).join('-+-');
        const bottomBorder = colWidths.map(width => '-'.repeat(width)).join('-+-');

        return [
            `+-${topBorder}-+`,
            ...formattedRows,
            `+-${bottomBorder}-+`
        ];
    }

    /**
     * Formats a number with optional decimal places
     * @param {number} value - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    formatNumber(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        return Number(value).toFixed(decimals);
    }

    /**
     * Formats a currency value
     * @param {number} value - Currency value
     * @returns {string} Formatted currency
     */
    formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return '$0.00';
        }
        return `$${Number(value).toFixed(2)}`;
    }

    /**
     * Formats a percentage value
     * @param {number} value - Percentage value (0-100)
     * @returns {string} Formatted percentage
     */
    formatPercentage(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0.00%';
        }
        return `${Number(value).toFixed(2)}%`;
    }

    /**
     * Formats a date string
     * @param {string} dateStr - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString();
        } catch (e) {
            return dateStr;
        }
    }

    /**
     * Wraps text to a specified width
     * @param {string|Array} text - Text to wrap (string or array of strings)
     * @param {number} width - Maximum width
     * @returns {string} Wrapped text
     */
    wrapText(text, width = 80) {
        if (!text) return '';

        // Handle arrays by joining them
        if (Array.isArray(text)) {
            text = text.join(' ');
        }

        // Convert to string if not already
        const textStr = String(text);
        if (!textStr) return '';

        const words = textStr.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const wordLength = word.length;
            const currentLineLength = currentLine.length;
            const spaceNeeded = currentLineLength > 0 ? 1 : 0; // Space before word if line not empty

            // If word itself is longer than width, break it
            if (wordLength > width) {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = '';
                }
                // Break long word into chunks
                for (let i = 0; i < wordLength; i += width) {
                    lines.push(word.substring(i, i + width));
                }
            } else if (currentLineLength + spaceNeeded + wordLength <= width) {
                // Word fits on current line
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                // Word doesn't fit, start new line
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.join('\n');
    }
}

export { TextFormatter };


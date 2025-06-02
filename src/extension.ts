import * as vscode from "vscode";
import { loadUsageData } from "./data-loader";
import { calculateTotals } from "./calculate-cost";
import Table from "cli-table3";

let statusBarItem: vscode.StatusBarItem;
let updateInterval: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100,
	);
	statusBarItem.command = "ccusage.showDetails";
	statusBarItem.show();

	// Register commands
	const refreshCommand = vscode.commands.registerCommand(
		"ccusage.refresh",
		updateUsageDisplay,
	);

	const showDetailsCommand = vscode.commands.registerCommand(
		"ccusage.showDetails",
		showUsageDetails,
	);

	context.subscriptions.push(refreshCommand, showDetailsCommand, statusBarItem);

	// Initial update
	updateUsageDisplay();

	// Set up periodic updates (every 30 seconds)
	updateInterval = setInterval(updateUsageDisplay, 30000);
}

export function deactivate() {
	if (updateInterval) {
		clearInterval(updateInterval);
	}
}

async function updateUsageDisplay() {
	try {
		// Get today's date in YYYYMMDD format
		const today = new Date();
		const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");

		// Load usage data for today only
		const usageData = await loadUsageData({
			since: todayStr,
			until: todayStr,
		});

		if (usageData.length === 0) {
			statusBarItem.text = "Today: $0.00";
			statusBarItem.tooltip = "No Claude Code usage today";
			return;
		}

		// Calculate today's total cost
		const totals = calculateTotals(usageData);
		const costText = `$${totals.totalCost.toFixed(2)}`;

		statusBarItem.text = `Today: ${costText}`;
		statusBarItem.tooltip = `Claude Code usage today: ${costText}\\nClick for details`;
	} catch (error) {
		statusBarItem.text = "Error";
		statusBarItem.tooltip = `Error loading usage data: ${error}`;
		console.error("Error updating usage display:", error);
	}
}

async function showUsageDetails() {
	try {
		// Load usage data for the last 7 days
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - 6); // 7 days including today

		const usageData = await loadUsageData({
			since: startDate.toISOString().slice(0, 10).replace(/-/g, ""),
			until: endDate.toISOString().slice(0, 10).replace(/-/g, ""),
		});

		if (usageData.length === 0) {
			vscode.window.showInformationMessage("No Claude Code usage in the last 7 days");
			return;
		}

		// Group data by date
		const dailyData = new Map<string, typeof usageData>();
		for (const item of usageData) {
			const date = item.date;
			if (!dailyData.has(date)) {
				dailyData.set(date, []);
			}
			dailyData.get(date)!.push(item);
		}

		// Create table
		const table = new Table({
			head: ['Date', 'Input', 'Output', 'Cache Create', 'Cache Read', 'Total Tokens', 'Cost (USD)'],
			style: {
				head: [],
				border: []
			}
		});

		let totalCost = 0;
		let totalInput = 0;
		let totalOutput = 0;
		let totalCacheCreate = 0;
		let totalCacheRead = 0;

		// Sort dates and add rows
		const sortedDates = Array.from(dailyData.keys()).sort().reverse();
		for (const date of sortedDates) {
			const dayData = dailyData.get(date)!;
			const dayTotals = calculateTotals(dayData);
			
			totalCost += dayTotals.totalCost;
			totalInput += dayTotals.inputTokens;
			totalOutput += dayTotals.outputTokens;
			totalCacheCreate += dayTotals.cacheCreationTokens;
			totalCacheRead += dayTotals.cacheReadTokens;

			const totalTokens = dayTotals.inputTokens + dayTotals.outputTokens + 
						       dayTotals.cacheCreationTokens + dayTotals.cacheReadTokens;

			// Date is already in YYYY-MM-DD format from data-loader
			const formattedDate = date;
			
			table.push([
				formattedDate,
				dayTotals.inputTokens.toLocaleString(),
				dayTotals.outputTokens.toLocaleString(),
				dayTotals.cacheCreationTokens.toLocaleString(),
				dayTotals.cacheReadTokens.toLocaleString(),
				totalTokens.toLocaleString(),
				`$${dayTotals.totalCost.toFixed(2)}`
			]);
		}

		// Add separator and total row
		if (sortedDates.length > 1) {
			table.push([
				'──────────────', '────────────', '────────────', 
				'────────────', '────────────', '────────────', '──────────'
			]);
			
			const grandTotal = totalInput + totalOutput + totalCacheCreate + totalCacheRead;
			table.push([
				'Total',
				totalInput.toLocaleString(),
				totalOutput.toLocaleString(),
				totalCacheCreate.toLocaleString(),
				totalCacheRead.toLocaleString(),
				grandTotal.toLocaleString(),
				`$${totalCost.toFixed(2)}`
			]);
		}

		// Show details in a webview panel
		const panel = vscode.window.createWebviewPanel(
			"ccusage",
			"Claude Code Usage Details",
			vscode.ViewColumn.One,
			{},
		);

		panel.webview.html = getWebviewContent(table.toString());
	} catch (error) {
		vscode.window.showErrorMessage(`Error loading usage details: ${error}`);
		console.error("Error showing usage details:", error);
	}
}

function getWebviewContent(tableContent: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Usage Details</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.2;
        }
        pre {
            font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
            font-size: 13px;
            white-space: pre;
            background-color: var(--vscode-textBlockQuote-background);
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            overflow-x: auto;
        }
        h2 {
            color: var(--vscode-foreground);
            margin-top: 0;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h2>Claude Code Usage Details (Last 7 Days)</h2>
    <pre>${tableContent}</pre>
</body>
</html>`;
}
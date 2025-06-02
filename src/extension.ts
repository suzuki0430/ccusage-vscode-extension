import * as vscode from "vscode";
import { loadUsageData } from "./data-loader";
import { calculateTotals } from "./calculate-cost";

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
		// Get today's date in YYYYMMDD format
		const today = new Date();
		const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");

		// Load usage data for today only
		const usageData = await loadUsageData({
			since: todayStr,
			until: todayStr,
		});

		if (usageData.length === 0) {
			vscode.window.showInformationMessage("No Claude Code usage today");
			return;
		}

		const totals = calculateTotals(usageData);

		// Create detailed breakdown
		const details = [
			`**Claude Code Usage - ${today.toLocaleDateString()}**`,
			"",
			`**Total Cost:** $${totals.totalCost.toFixed(2)}`,
			"",
			"**Token Usage:**",
			`• Input tokens: ${totals.inputTokens.toLocaleString()}`,
			`• Output tokens: ${totals.outputTokens.toLocaleString()}`,
			`• Cache creation: ${totals.cacheCreationTokens.toLocaleString()}`,
			`• Cache read: ${totals.cacheReadTokens.toLocaleString()}`,
			"",
			`**Total tokens:** ${(
				totals.inputTokens +
				totals.outputTokens +
				totals.cacheCreationTokens +
				totals.cacheReadTokens
			).toLocaleString()}`,
		].join("\\n");

		// Show details in a webview panel
		const panel = vscode.window.createWebviewPanel(
			"ccusage",
			"Claude Code Usage Details",
			vscode.ViewColumn.One,
			{},
		);

		panel.webview.html = getWebviewContent(details);
	} catch (error) {
		vscode.window.showErrorMessage(`Error loading usage details: ${error}`);
		console.error("Error showing usage details:", error);
	}
}

function getWebviewContent(details: string): string {
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
            line-height: 1.6;
        }
        pre {
            white-space: pre-wrap;
            background-color: var(--vscode-textBlockQuote-background);
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid var(--vscode-textBlockQuote-border);
        }
    </style>
</head>
<body>
    <pre>${details}</pre>
</body>
</html>`;
}
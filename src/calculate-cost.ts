import type { DailyUsage, SessionUsage } from "./data-loader";
import type { TokenData, TokenTotals } from "./types";

// Claude Opus pricing per million tokens (as of June 2025)
const PRICING = {
	input: 15.0,              // $15 per million input tokens
	output: 75.0,             // $75 per million output tokens
	cacheCreation: 18.75,     // $18.75 per million cache creation tokens
	cacheRead: 1.5,           // $1.50 per million cache read tokens
};

export function calculateCostFromTokens(
	inputTokens: number,
	outputTokens: number,
	cacheCreationTokens: number,
	cacheReadTokens: number,
): number {
	const inputCost = (inputTokens / 1_000_000) * PRICING.input;
	const outputCost = (outputTokens / 1_000_000) * PRICING.output;
	const cacheCreationCost = (cacheCreationTokens / 1_000_000) * PRICING.cacheCreation;
	const cacheReadCost = (cacheReadTokens / 1_000_000) * PRICING.cacheRead;
	
	return inputCost + outputCost + cacheCreationCost + cacheReadCost;
}

export function calculateTotals(
	data: Array<DailyUsage | SessionUsage>,
): TokenTotals {
	return data.reduce(
		(acc, item) => ({
			inputTokens: acc.inputTokens + item.inputTokens,
			outputTokens: acc.outputTokens + item.outputTokens,
			cacheCreationTokens: acc.cacheCreationTokens + item.cacheCreationTokens,
			cacheReadTokens: acc.cacheReadTokens + item.cacheReadTokens,
			totalCost: acc.totalCost + item.totalCost,
		}),
		{
			inputTokens: 0,
			outputTokens: 0,
			cacheCreationTokens: 0,
			cacheReadTokens: 0,
			totalCost: 0,
		},
	);
}

export function getTotalTokens(tokens: TokenData): number {
	return (
		tokens.inputTokens +
		tokens.outputTokens +
		tokens.cacheCreationTokens +
		tokens.cacheReadTokens
	);
}

export function createTotalsObject(totals: TokenTotals) {
	return {
		inputTokens: totals.inputTokens,
		outputTokens: totals.outputTokens,
		cacheCreationTokens: totals.cacheCreationTokens,
		cacheReadTokens: totals.cacheReadTokens,
		totalTokens: getTotalTokens(totals),
		totalCost: totals.totalCost,
	};
}
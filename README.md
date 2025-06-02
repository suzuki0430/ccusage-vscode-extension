# Claude Code Usage Monitor for VS Code

Monitor your Claude Code usage and costs directly in your VS Code status bar.

## Features

- **Real-time cost tracking**: Shows today's Claude Code usage cost in the status bar
- **Automatic updates**: Refreshes every 30 seconds to show current usage
- **Detailed breakdown**: Click the status bar item to see a table with the last 7 days of usage data
- **Zero configuration**: Works out of the box with your existing Claude Code setup

## Usage

Once installed, the extension will automatically:

1. Display today's Claude Code usage cost in the status bar (e.g., "Today: $2.45")
2. Update the display every 30 seconds
3. Show a detailed table with the last 7 days of usage when you click on the status bar item

### Commands

- `Claude Code Usage: Refresh Usage Data` - Manually refresh the usage data
- `Claude Code Usage: Show Usage Details` - Show detailed usage breakdown

## Requirements

- VS Code 1.74.0 or higher (also works with Cursor)
- Claude Code must be installed and have generated usage data in `~/.claude/projects/`

## Installation

### From Source

1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Run `npm run package` to create a VSIX file
5. Install the VSIX file in VS Code

### Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

## How it Works

The extension reads Claude Code usage data from the local JSONL files stored in `~/.claude/projects/`. It aggregates the data to show:

- Today's total cost in the status bar
- Detailed table view showing the last 7 days of usage data
- Daily breakdown of token usage (input, output, cache creation, cache read)
- Cost per day and total costs
- Real-time updates as you use Claude Code

## Privacy

This extension only reads local Claude Code usage data from your machine. No data is sent to external services.

## License

MIT
# Zeno - Simple Timer App

A desktop application built with Tauri and React that helps you manage timers with a simple text-based interface.

## Features

- Simple text-based timer creation (e.g., "meeting in 10m")
- Timers displayed in a clean, organized list
- Desktop notifications when timers trigger
- Command history with up/down navigation
- Minimal and non-intrusive interface
- Persistent storage of timers and command history
- Text-to-speech announcements
- Sound notifications

## Tech Stack

- [Tauri](https://tauri.app/) - For building cross-platform desktop applications
- [React](https://reactjs.org/) - For the user interface
- [TypeScript](https://www.typescriptlang.org/) - For type safety

## Prerequisites

- Node.js (v16 or later)
- Rust (latest stable version)
- Platform-specific dependencies for Tauri

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run tauri dev
   ```

## Building for Production

```bash
npm run tauri build
```

## Usage

1. Launch the application
2. Type your timer command in the text input (e.g., "meeting in 10m")
3. Press Enter to create the timer
4. The timer will appear in the list
5. When the timer triggers, you'll receive a desktop notification and sound alert

## Supported Timer Formats

- "message in Xm" - Creates a timer in X minutes
- "message in Xh Ym" - Creates a timer in X hours and Y minutes
- "message in time keep" - Creates a timer that stays after triggering
- Time units: d (days), h (hours), m (minutes), s (seconds)

## Quick Commands

- `clear` - Delete all timers
- `help` - Show this help message
- `f` - Add a 10-minute timer
- `t` - Add a 15-minute timer

## Keyboard Shortcuts

- `Tab` - Focus the input field
- `Enter` - Submit the current input
- `Up/Down Arrows` - Navigate through command history

## License

MIT License - see [LICENSE](LICENSE) file for details 
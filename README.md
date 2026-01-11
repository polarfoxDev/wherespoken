# 🗣️ WhereSpoken

A daily language guessing game where players listen to audio samples and try to identify the language or dialect being spoken. Similar to Wordle, but for language recognition!

## 🎮 How It Works

1. **Listen** to an audio sample of someone speaking
2. **Guess** the language from a dropdown of options
3. **Get hints** if you're wrong — text transcripts, translations, and more audio
4. **Win or lose** within 6 attempts

Each day features a new puzzle. Players can also browse the history to play past puzzles.

## 🏗️ Architecture

### Tech Stack

- **Framework**: Angular 21 with standalone components
- **State Management**: Angular Signals
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest
- **Package Manager**: pnpm

### Project Structure

```
src/
├── app/
│   ├── api.ts                 # API service for fetching puzzles
│   ├── app.ts                 # Root component
│   ├── consts.ts              # App constants (name, first riddle date)
│   ├── game-state.service.ts  # LocalStorage persistence for game state
│   ├── calendar/              # Date picker for history
│   ├── game/                  # Game container component
│   ├── history/               # History page with calendar
│   ├── riddle/                # Core game logic and UI
│   ├── spinner/               # Loading spinner
│   └── types/                 # TypeScript interfaces
├── environments/              # Environment configs (dev/prod)
└── styles.css                 # Global styles
```

### Data Flow

1. **Schedule** is fetched from S3 (`schedule.json`) — maps dates to sample IDs
2. **Sample metadata** is fetched per puzzle (`{sampleId}/metadata.json`)
3. **Audio files** are served from S3 (`sample.mp3`, `hint.mp3`)
4. **Game state** is persisted to localStorage per date

## 🚀 Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
pnpm install
```

### Development Server

```bash
pnpm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The app auto-reloads on file changes.

### Testing

```bash
pnpm test
```

### Building

```bash
pnpm build
```

Build artifacts are stored in `dist/`.

## 🌐 Deployment

The app is containerized and deployed via GitHub Actions. On push to `main`:

1. Docker images are built and tagged with version from `package.json`
2. Images are pushed to GitHub Container Registry (ghcr.io)

## 📝 License

Private project by [polarnight.eu](https://polarnight.eu)

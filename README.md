# Habit Playlists

[![Deploy to GitHub Pages](https://github.com/Ra13s/habit-playlist/actions/workflows/deploy.yml/badge.svg)](https://github.com/Ra13s/habit-playlist/actions/workflows/deploy.yml)

[Live Site](https://ra13s.github.io/habit-playlist/)

A local-first, privacy-focused app for managing daypart playlists (morning, midday, evening) with mixed item types including timers, checks, links, and notes.

**🎯 The Playlist Advantage**: Instead of scanning a calendar and deciding what to do, just click your slot (Morning/Evening) and start. The wizard walks you through each item one-by-one, removing decision fatigue and keeping you in flow.

## Quick Links

- 🌐 **[Live Site](https://ra13s.github.io/habit-playlist/)**

## Features

- **Daypart Playlists**: Morning, Midday, and Evening routines
- **Mixed Item Types**:
  - ⏱️ Timer: Timed exercises with audio completion tones
  - ✓ Check: Simple completion checkboxes
  - 🔗 Link: External resources that open in new tabs
  - 📝 Note: Reminders or quick tasks
- **Dynamic Scheduling**: Weekday-based and interval-based rules (e.g., every 3 days)
- **100% Local & Private**: All data stored in localStorage, no cloud sync
- **Import/Export**: Full program portability with JSON
- **One-off Items**: Items that disappear after completion
- **Multilingual**: English and Estonian (extensible)
- **Mobile-First**: Responsive design optimized for phones
- **Wake Lock**: Optional screen wake lock during timers
- **Timer Sounds**: Gentle, soothing chimes at start and peaceful meditation bell at completion

## Tech Stack

- React 19
- Vite 7
- Client-only SPA
- localStorage for persistence
- Dynamic i18n loading
- GitHub Pages hosting

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Deployment (GitHub Pages)

Already configured for GitHub Pages via GitHub Actions.

### Setup

1. Enable GitHub Pages
   - Repo Settings → Pages → Source: "GitHub Actions"

2. Push to main
   ```bash
   git push origin main
   ```

3. Access your app
   - Live at: `https://[username].github.io/habit-playlist/`
   - Example: `https://ra13s.github.io/habit-playlist/`

Notes
- `vite.config.js` is set with `base: '/habit-playlist/'` for proper asset paths.
- Workflow: `.github/workflows/deploy.yml` builds and deploys `dist/` on push to `main`.

### Quick Deployment Checklist

- [ ] Repo created and code pushed to `main`
- [ ] Pages enabled (Settings → Pages → GitHub Actions)
- [ ] Wait for workflow to finish (Actions tab)
- [ ] Visit `https://[username].github.io/habit-playlist/`

## Data Structure

### Program V2

The app uses a JSON-based program structure:

```json
{
  "version": 2,
  "items": { ... },
  "playlists": {
    "morning": [...],
    "midday": [...],
    "evening": [...]
  },
  "schedule": {
    "rules": [...],
    "overrides": {...}
  },
  "content": {
    "exercises": {...}
  },
  "settings": {
    "tones": true,
    "wakeLockDefault": false,
    "language": "en"
  }
}
```

### Import/Export

- Export your program as JSON (with optional progress data)
- Import programs with Replace or Merge modes
- Share routines with others

## Usage

1. **Select a daypart** (Morning/Midday/Evening) from the Today tab
2. **Start All** to run through the entire playlist
3. Or **tap individual items** to run them standalone
4. **Timer items** auto-advance on completion with optional tones
5. **Check/Note items** require manual "Mark Done"
6. **Link items** open externally and can be marked done
7. **One-off items** disappear after completion (reset in Settings)

## Customizing Your Schedule

You can edit items and weekday/interval schedules in‑app.

For large changes, use Import/Export (JSON):
1. Export your program from Settings
2. Edit the JSON externally (any editor)
3. Import the updated JSON back into the app

### Program Schema Reference

Your program JSON structure:

```json
{
  "program": {
    "version": 2,
    "items": {
      "item_id": {
        "id": "item_id",
        "type": "timer|check|link|note",
        "title": "Display Title",
        "description": "Item description",
        "duration": 3600,  // seconds (timer only)
        "url": "https://...",  // (link only)
        "tags": ["tag1", "tag2"],
        "oneOff": false,
        "enabled": true
      }
    },
    "playlists": {
      "morning": [{ "id": "item_id" }],
      "midday": [],
      "evening": [{ "id": "item_id" }]
    },
    "schedule": {
      "rules": [
        {
          "type": "weekday",
          "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
          "slot": "morning|midday|evening",
          "routines": ["item_id"]
        },
        {
          "type": "interval",
          "every": 3,  // every N days
          "startDate": "2025-01-01",
          "slot": "evening",
          "routines": ["item_id"]
        }
      ],
      "overrides": {}
    },
    "settings": {
      "tones": true,
      "wakeLockDefault": false,
      "language": "en",
      "theme": "lofi"
    }
  }
}
```

<!-- AI instructions removed for a lean end-user README -->

## Themes

Switch between visual styles in Settings:

- Lo‑Fi 🎵 — warm, nostalgic flat design
- Animal Crossing 🍃 — cheerful, rounded UI
- Transport Tycoon 🚂 — retro simulation vibe
- Might & Magic VII ⚔️ — medieval fantasy accents
- Baldur’s Gate 🐉 — deep parchment reds, medieval buttons
- Minecraft ⛏️ — sky/grass palette, retro bevels
- Contra 🔥 — dark UI, neon accents
- Super Mario 🍄 — bright red/blue, rounded buttons
- Red Alert 🚨 — military red/graphite, retro bevels
- Witcher 3 🪵 — wood-and-brass palette, medieval buttons

## Settings

- **Theme**: Choose any theme listed above
- **Language**: Switch between English and Estonian
- **Tones**: Enable/disable completion sound effects
- **Wake Lock**: Keep screen awake during exercises
- **Import/Export**: Backup and restore your program
- **Reset One-offs**: Make one-off items reappear

## License

MIT

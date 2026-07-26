# Spell Quest

A small React app for kids to practice English spellings with points and a local leaderboard.

## Features

- Nickname (no accounts)
- CSV word import (`word,clue`)
- **Letter Scramble** practice mode
- Points: 10 / 5 / 2 / 0 by attempt
- Local leaderboard (device only; shared backend later)

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Sample words

Import [`sample-words.csv`](sample-words.csv) from the Import screen, or paste:

```csv
word,clue
because,for the reason that
friend,someone you like and trust
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm test` | Unit tests |
| `npm run build` | Production build |

## Docs

- Design: [`docs/superpowers/specs/2026-07-24-learn-vocab-design.md`](docs/superpowers/specs/2026-07-24-learn-vocab-design.md)
- Plan: [`docs/superpowers/plans/2026-07-24-learn-vocab.md`](docs/superpowers/plans/2026-07-24-learn-vocab.md)

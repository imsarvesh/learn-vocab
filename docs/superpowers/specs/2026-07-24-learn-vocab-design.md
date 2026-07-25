# Learn Vocab — Design Spec

**Date:** 2026-07-24  
**Status:** Approved for planning  
**Product:** Small React app for kids to learn spellings, with points and a local leaderboard (shared leaderboard later).

## Goal

Help kids practice English spellings through two kid-friendly game modes, earn points based on how quickly they get the word right, and see a nickname-based leaderboard on the same device.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope path | Hybrid: local play now; shared leaderboard later |
| Audience | Kids learning spellings |
| Practice modes | Meaning/sentence → type spelling; scrambled letters → correct spelling |
| Word source | CSV import only (`word,clue`) |
| Identity | Simple nickname on device; no accounts |
| Scoring | Full points first try; fewer on retries |
| Architecture | Vite + React + TypeScript; `localStorage`; swappable score store |

## Product overview

A child enters a nickname, imports a CSV word list, then practices in two modes:

1. **Meaning → spell** — show definition or sentence clue; type the word  
2. **Scramble** — show jumbled letters; rearrange/type the correct spelling  

Points decrease with each failed attempt. A local leaderboard ranks nicknames by total points. All data stays on the device in v1. A thin `scoreStore` interface allows a shared backend later without rewriting the game UI.

## Screens & flow

1. **Welcome** — enter nickname, continue  
2. **Home** — show total points; actions: Practice (Meaning), Practice (Scramble), Import words, Leaderboard  
3. **Practice** — clue or scrambled letters → answer input → Check → feedback → next word; show attempt count and points earned this round  
4. **Leaderboard** — nicknames ranked by total points on this device  
5. **Import** — upload or paste CSV (`word,clue`), preview rows, save list  

### CSV format

- Required columns: `word`, `clue`  
- `word` — target spelling  
- `clue` — definition or sentence (used in Meaning mode; Scramble needs only `word`)  
- Require a header row with `word` and `clue`, plus at least one valid data row  
- Blank rows skipped; rows missing `word` rejected  
- If zero valid words after parse, show an error and do not overwrite the existing list  

## Scoring & rounds

Each practice session draws from the imported list (shuffled).

| Attempt | Points if correct |
|---------|-------------------|
| 1st try | 10 |
| 2nd try | 5 |
| 3rd try | 2 |
| After 3 misses | 0; reveal the answer; move on |

- Comparison is case-insensitive; leading/trailing spaces trimmed  
- Round size: `min(10, list length)` words per session  
- Session points add to that nickname’s lifetime total on the local leaderboard  

## Architecture

**Stack:** Vite + React + TypeScript + plain CSS (large tap targets, bright kid-friendly UI; no heavy UI kit).

**Modules:**

| Module | Responsibility |
|--------|----------------|
| `storage` | Persist nickname, word lists, scores in `localStorage` |
| `scoreStore` | `getLeaderboard()`, `addPoints(nickname, points)` — local impl in v1 |
| `csv` | Parse and validate `word,clue` rows |
| `game` | Scramble letters, check answers, map attempt → points |
| `screens` | Welcome, Home, Practice, Leaderboard, Import |

**Persisted data (local):**

- Current nickname  
- Active word list: `{ id, name, words: [{ word, clue }] }` — single list in v1; successful import replaces it  
- Leaderboard: `{ nickname, totalPoints }[]`  

**Data flow:**

1. User sets nickname → stored as current player  
2. User imports CSV → validated → saved as active word list  
3. User starts a mode → `game` builds a shuffled round → UI collects answers  
4. On correct (or give-up after 3) → points computed → `scoreStore.addPoints` → storage updated  
5. Leaderboard screen reads `scoreStore.getLeaderboard()`  

**Errors:**

- Bad CSV → clear message; do not overwrite existing list  
- Empty / missing list → block practice until import  
- No network required for v1  

## Look & feel

- Bright, simple, large controls suitable for kids  
- Nickname and points visible during practice  
- Obvious correct / wrong feedback  
- No account or settings clutter in the kid path  

## Scope

### In scope (v1)

- Nickname entry  
- CSV import (`word,clue`)  
- Meaning → spell and Scramble modes  
- Retry-based points (10 / 5 / 2 / 0)  
- Local leaderboard  
- `scoreStore` interface ready for a future shared backend  

### Out of scope (v1)

- Audio / text-to-speech  
- Accounts, auth, parent dashboard  
- Multi-device sync / shared leaderboard implementation  
- Multiple named libraries beyond replace/import of the active list  
- Picture clues  

## Success criteria

A kid can import a CSV, practice both modes, earn points by attempt number, and see nicknames ranked on a local leaderboard.

## Future (not in this plan)

Replace the local `scoreStore` implementation with a remote one (e.g. Supabase) so nicknames compete across devices, still without full accounts if possible (soft identity / nickname + device token, to be designed later).

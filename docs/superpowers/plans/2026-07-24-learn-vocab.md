# Learn Vocab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React + TypeScript spelling practice app for kids with CSV word import, meaning/scramble modes, retry-based points, and a local leaderboard.

**Architecture:** Single-page React app. Pure modules for CSV parsing, game logic, and localStorage persistence. `scoreStore` interface with a local implementation so a shared backend can replace it later. Screens: Welcome, Home, Practice, Import, Leaderboard.

**Tech Stack:** Vite, React 19, TypeScript, Vitest, plain CSS

## Global Constraints

- Spelling check: case-insensitive, trim spaces
- Points: 10 / 5 / 2 / 0 for attempts 1 / 2 / 3 / fail
- Round size: `min(10, list length)`
- CSV: header `word,clue`; at least one valid row; failed import must not overwrite existing list
- Single active word list; import replaces it on success
- Nickname only; no auth
- Kid-friendly UI: large controls, bright colors, clear feedback
- No audio, accounts, or remote leaderboard in v1

---

## File Structure

```
learn-vocab/
  package.json
  vite.config.ts
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  index.html
  src/
    main.tsx
    App.tsx
    App.css
    index.css
    types.ts
    lib/
      csv.ts
      csv.test.ts
      game.ts
      game.test.ts
      storage.ts
      scoreStore.ts
      scoreStore.test.ts
    screens/
      Welcome.tsx
      Home.tsx
      Practice.tsx
      ImportWords.tsx
      Leaderboard.tsx
  sample-words.csv
  docs/superpowers/specs/2026-07-24-learn-vocab-design.md
```

---

### Task 1: Scaffold project + shared types

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/types.ts`, `src/index.css`, `src/vite-env.d.ts`
- Test: vitest configured in `vite.config.ts`

**Interfaces:**
- Produces: `WordEntry`, `WordList`, `LeaderboardEntry`, `PracticeMode`, `AppView` types

- [ ] **Step 1: Scaffold Vite React-TS app**

Run: `npm create vite@latest . -- --template react-ts` (in project root if empty enough), then `npm install` and `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`

- [ ] **Step 2: Add types**

```ts
// src/types.ts
export type WordEntry = { word: string; clue: string };
export type WordList = { id: string; name: string; words: WordEntry[] };
export type LeaderboardEntry = { nickname: string; totalPoints: number };
export type PracticeMode = "meaning" | "scramble";
export type AppView =
  | "welcome"
  | "home"
  | "practice"
  | "import"
  | "leaderboard";
```

- [ ] **Step 3: Configure vitest in vite.config.ts** with `test: { environment: "jsdom", globals: true }`

- [ ] **Step 4: Commit** `chore: scaffold vite react-ts app with types`

---

### Task 2: CSV parser

**Files:**
- Create: `src/lib/csv.ts`, `src/lib/csv.test.ts`
- Consumes: `WordEntry`
- Produces: `parseWordCsv(text: string): { ok: true; words: WordEntry[] } | { ok: false; error: string }`

- [ ] **Step 1: Write failing tests** for valid CSV, missing header, empty words, blank row skip, quoted fields optional (simple split is OK if documented)

- [ ] **Step 2: Implement `parseWordCsv`** — require `word` and `clue` headers (case-insensitive); skip blank rows; reject if zero valid words

- [ ] **Step 3: Run** `npx vitest run src/lib/csv.test.ts` — expect PASS

- [ ] **Step 4: Commit** `feat: parse and validate word CSV`

---

### Task 3: Game logic

**Files:**
- Create: `src/lib/game.ts`, `src/lib/game.test.ts`
- Produces:
  - `pointsForAttempt(attempt: number): number` — attempt 1→10, 2→5, 3→2, else 0
  - `normalizeAnswer(s: string): string`
  - `isCorrect(answer: string, word: string): boolean`
  - `scrambleWord(word: string, random?: () => number): string` — not identical to word when possible
  - `pickRound(words: WordEntry[], size?: number, random?: () => number): WordEntry[]`

- [ ] **Step 1: Write failing tests** covering points table, normalize/isCorrect, scramble ≠ original when length > 1, pickRound size

- [ ] **Step 2: Implement game helpers**

- [ ] **Step 3: Run** `npx vitest run src/lib/game.test.ts` — expect PASS

- [ ] **Step 4: Commit** `feat: add spelling game scoring and scramble helpers`

---

### Task 4: Storage + scoreStore

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/scoreStore.ts`, `src/lib/scoreStore.test.ts`
- Produces:
  - storage: `getNickname`, `setNickname`, `getWordList`, `setWordList`
  - `createLocalScoreStore(storage?: Storage): { getLeaderboard(): LeaderboardEntry[]; addPoints(nickname: string, points: number): void; getPoints(nickname: string): number }`

- [ ] **Step 1: Write failing tests** using in-memory Storage mock

- [ ] **Step 2: Implement localStorage-backed storage and scoreStore**

- [ ] **Step 3: Run** `npx vitest run src/lib/scoreStore.test.ts` — expect PASS

- [ ] **Step 4: Commit** `feat: local storage and score store`

---

### Task 5: Screens + App shell

**Files:**
- Create: `src/App.tsx`, `src/App.css`, `src/screens/*.tsx`, `sample-words.csv`
- Consumes: all lib modules and types

- [ ] **Step 1: Implement Welcome** — nickname input → save → home

- [ ] **Step 2: Implement Home** — points, practice buttons (disabled if no list), import, leaderboard, change nickname

- [ ] **Step 3: Implement ImportWords** — file upload + paste; preview; save via parseWordCsv

- [ ] **Step 4: Implement Practice** — meaning and scramble modes; attempts; points; advance; end summary → home

- [ ] **Step 5: Implement Leaderboard** — ranked list

- [ ] **Step 6: Wire App view state**; add sample CSV; polish CSS

- [ ] **Step 7: Run** `npm test` and `npm run build` — expect PASS

- [ ] **Step 8: Commit** `feat: kid spelling practice UI with points and leaderboard`

---

## Spec coverage checklist

- [x] Nickname — Task 5 Welcome
- [x] CSV import — Tasks 2, 5
- [x] Meaning + Scramble — Tasks 3, 5
- [x] Retry points 10/5/2/0 — Task 3
- [x] Local leaderboard — Tasks 4, 5
- [x] scoreStore interface — Task 4
- [x] Round size min(10, n) — Task 3

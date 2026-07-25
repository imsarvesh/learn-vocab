# Spelling Hint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional “Show hint” control in practice that reveals first-letter + blanks and caps points when used.

**Architecture:** Pure helpers in `game.ts` (`formatSpellingHint`, extended `pointsForAttempt`); `Practice.tsx` owns `hintUsed` UI state and wires scoring/feedback.

**Tech Stack:** React 19, TypeScript, Vitest

## Global Constraints

- Hint format: first character of full answer shown; later non-space chars → `_`; word spaces → `   ` between groups (`candy` → `c _ _ _ _`, `ice cream` → `i _ _   _ _ _ _ _`)
- Scoring with hint: `Math.min(base, 5)` on the 10/5/2 table
- Both modes; answering phase only; reset each word
- Do not commit unless the user asks

---

### Task 1: Hint helpers + scoring

**Files:**
- Modify: `src/lib/game.ts`
- Modify: `src/lib/game.test.ts`

**Interfaces:**
- Produces: `formatSpellingHint(word: string): string`
- Produces: `pointsForAttempt(attempt: number, usedHint?: boolean): number`

- [x] **Step 1: Write failing tests** for format + capped scoring
- [x] **Step 2: Run `npm test` — expect fail** (missing export / wrong scores)
- [x] **Step 3: Implement `formatSpellingHint` + `usedHint` cap in `pointsForAttempt`**
- [ ] **Step 4: Run `npm test` — expect pass** (blocked: agent shell exit 137)

---

### Task 2: Practice UI

**Files:**
- Modify: `src/screens/Practice.tsx`
- Modify: `src/App.css` (hint pattern styles if needed)

**Interfaces:**
- Consumes: `formatSpellingHint`, `pointsForAttempt(attempt, hintUsed)`

- [x] **Step 1: Add `hintUsed` state; reset in `goNext`**
- [x] **Step 2: Show hint button + pattern; wire capped points + feedback copy**
- [ ] **Step 3: Run `npm test` and `npm run build` — expect pass** (blocked: agent shell exit 137)

---

## Execution

Inline in this session (user asked to implement).

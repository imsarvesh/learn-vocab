# Spelling hint (Show hint)

Date: 2026-07-25  
Status: approved design

## Goal

During practice, kids can optionally reveal a spelling hint (first letter + blanks) when stuck. Using the hint reduces the points available for that word.

## Scope

- Both practice modes: **Meaning → Spell** and **Letter Scramble**
- Answering phase only (not feedback / summary)
- Existing scramble “Hint: {clue}” text stays as-is (meaning clue); this feature is a separate **spelling** hint

## Behavior

1. While `phase === "answering"`, show a **Show hint** control under the prompt card.
2. On tap:
   - Reveal a spelling pattern for the current word, e.g. `candy` → `c _ _ _ _`
   - Only the **first character** of the full answer is shown; every later non-space character is `_`
   - Spaces in the answer are kept as gaps between tokens (e.g. `ice cream` → `i _ _   _ _ _ _ _`)
   - Case of the revealed first character matches the stored word
   - Mark hint as used for this word; control becomes disabled / labeled **Hint shown**
3. Hint visibility and `hintUsed` reset when moving to the next word (`goNext`) or starting a new round.

## Scoring

Existing attempt scores without hint:

| Attempt | Points |
|---------|--------|
| 1       | 10     |
| 2       | 5      |
| 3       | 2      |

With hint used for that word:

| Attempt | Points |
|---------|--------|
| 1       | 5 (capped) |
| 2       | 5 (capped) |
| 3       | 2      |

Rule: `min(pointsForAttempt(attempt), hintUsed ? 5 : 10)` with attempt-3 remaining 2 — equivalently: after hint, attempt 1–2 award 5, attempt 3 awards 2.

Feedback on success may mention the hint when relevant (e.g. `Nice! +5 points (hint used)`), optional but preferred for clarity.

Wrong answers and the 3-try limit are unchanged.

## API / code changes

### `src/lib/game.ts`

- `formatSpellingHint(word: string): string`  
  - Walk characters left to right. Show the first character unchanged. For later characters: whitespace → keep a single space separator in the output gap; any other character → `_`. Join letter/blank tokens with a single space (`candy` → `c _ _ _ _`; `ice cream` → `i _ _   _ _ _ _ _`).
- Extend scoring: `pointsForAttempt(attempt: number, usedHint = false): number`  
  - When `usedHint` is true, return `Math.min(base, 5)` where base is the existing 10/5/2 table (so 10→5, 5→5, 2→2).

### `src/screens/Practice.tsx`

- State: `hintUsed: boolean` (default false; reset in `goNext`)
- Wire `pointsForAttempt(attempt, hintUsed)`
- UI: Show hint button + revealed pattern when used
- Call sites only; no new screens

### Tests (`src/lib/game.test.ts`)

- `formatSpellingHint("candy")` → `"c _ _ _ _"`
- Multi-word: `formatSpellingHint("ice cream")` → `"i _ _   _ _ _ _ _"` (only first letter of whole answer revealed)
- Single letter: `formatSpellingHint("a")` → `"a"`
- `pointsForAttempt(1, true) === 5`, `(2, true) === 5`, `(3, true) === 2`
- Existing no-hint scores unchanged

## Out of scope

- Hints that reveal more letters over time
- Changing import CSV / word list shape
- Leaderboard UI changes
- Persisting hint usage stats

## Acceptance

- Both modes show **Show hint** while answering
- Revealed pattern matches first letter + blanks
- Using hint caps points as specified
- Hint resets each new word
- Unit tests cover format + scoring

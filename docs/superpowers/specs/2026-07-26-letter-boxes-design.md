# OTP-Style Letter Boxes — Design

**Date:** 2026-07-26  
**Status:** Approved for planning  
**App:** Spell Quest (learn-vocab)  
**Scope:** Practice answering UI (letter input only)

## Goal

Replace the single free-text spelling field with OTP-style letter boxes so kids fill one letter at a time, with clear word length and auto-submit when complete.

## Decisions

| Topic | Choice |
|-------|--------|
| Box count | One box per letter of the target word |
| Spaces | Visual gaps between words; no box for space characters |
| Submit | Auto-submit when every letter box is filled |
| Hint | Prefill the first letter into the first box; kid continues typing |
| Input model | Visible boxes + single hidden/accessible input (approach 1) |
| Out of scope | Scramble display, scoring rules, Home, Settings |

## Behavior

- Typing is owned by one accessible input; boxes show letters and the active slot.
- Accept letters only (ignore digits/symbols); comparison stays case-insensitive with trim via existing `isCorrect`.
- Auto-advance on type; Backspace clears the current or previous letter.
- Paste fills as many letter slots as fit from the start.
- When all letter boxes are filled, automatically run the existing Check flow.
- Keep the **Check** button: disabled until all letter boxes are filled (fallback / explicit confirm if needed; auto-submit also fires when the last letter is entered).
- On wrong answer (retry), clear the letter boxes (same as today’s clear `answer`).
- **Show hint:** set first letter box to the word’s first letter; focus continues at the next empty letter box. Keep the existing “Spelling hint: c _ _ _ _” text and speak control as today.
- Multi-word answers: reconstructed `answer` string includes spaces in the correct positions so `isCorrect(answer, word)` still works.

## UI

- Label remains: “Type the spelling (try N of 3)”.
- Row of rounded letter boxes; active box uses a teal focus ring.
- Filled boxes show the typed letter in the app display font.
- Long words wrap to additional rows on narrow screens.
- Space between words: wider gap (or small non-editable spacer)—not a typed box.

## Structure

- New component (e.g. `LetterBoxes`) used in Practice answering phase.
- Props roughly: `word` (template for length/spaces), `value`, `onChange(value: string)`, `onComplete()` (or Practice watches length and calls `checkAnswer`).
- Practice keeps attempt/hint/scoring state; only the input chrome changes.

## Success criteria

- Kids can see how many letters to type.
- Phone keyboard works reliably (single input owner).
- Filling the last letter submits without requiring an extra tap.
- Hint prefills the first letter.
- Wrong answers still allow up to 3 tries with cleared boxes.
- Multi-word targets still score correctly.

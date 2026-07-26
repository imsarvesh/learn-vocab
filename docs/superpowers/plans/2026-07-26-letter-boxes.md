# OTP Letter Boxes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Practice’s free-text spelling field with OTP-style letter boxes (one per letter), auto-submit when complete, and prefill the first letter when the spelling hint is used.

**Architecture:** Pure helpers in `game.ts` map a target word ↔ letter-only string (spaces as gaps). A `LetterBoxes` component owns a single hidden input plus visible boxes. `Practice` keeps scoring/attempts; it swaps the text `<input>` for `LetterBoxes`, auto-checks on complete, and prefills the first letter when `hintUsed` becomes true.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, plain CSS

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-26-letter-boxes-design.md`
- One visible box per letter; spaces are visual gaps only
- Auto-submit when every letter box is filled
- Hint prefills first letter into first box
- Single hidden/accessible input owns typing (not N separate inputs)
- Keep existing `isCorrect` / attempt / points behavior
- Do not commit unless the user asks

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/game.ts` | Letter-slot helpers |
| `src/lib/game.test.ts` | Helper unit tests |
| `src/components/LetterBoxes.tsx` | OTP UI + hidden input |
| `src/components/LetterBoxes.test.tsx` | Component behavior tests |
| `src/screens/Practice.tsx` | Wire LetterBoxes, hint prefill, auto-check |
| `src/App.css` | Letter box styles |

---

### Task 1: Letter-slot helpers

**Files:**
- Modify: `src/lib/game.ts`
- Modify: `src/lib/game.test.ts`

**Interfaces:**
- Produces: `expectedLetterCount(word: string): number`
- Produces: `lettersOnly(value: string): string` — keep A–Z / a–z only (Unicode letters via `/[a-zA-Z]/` is fine for this English vocab app; strip everything else)
- Produces: `mergeLettersIntoWord(word: string, letters: string): string` — walk `word`; copy spaces; fill letter positions from `letters` (pad missing with empty → those positions omit char or use `""` so incomplete merge still has spaces; for incomplete answers, letter holes are omitted from the string only if empty—actually: build by placing typed letters into letter slots, leaving unfilled slots as empty string so `"c a"` for ice cream mid-type is wrong. Better: produce the answer string with spaces always, and only typed letters inserted; unfilled letter slots contribute `""` so `"c eam"` mid-way. For `isCorrect` we compare full normalized strings, so incomplete never matches. For display, boxes use `letters[i]`.
- Produces: `isLetterAnswerComplete(word: string, letters: string): boolean` — `lettersOnly(letters).length === expectedLetterCount(word)`
- Produces: `firstLetterOfWord(word: string): string` — first non-whitespace character, or `""`

- [ ] **Step 1: Write failing tests** in `src/lib/game.test.ts`:

```ts
import {
  expectedLetterCount,
  firstLetterOfWord,
  isLetterAnswerComplete,
  lettersOnly,
  mergeLettersIntoWord,
} from "./game";

describe("letter boxes helpers", () => {
  it("counts letters ignoring spaces", () => {
    expect(expectedLetterCount("candy")).toBe(5);
    expect(expectedLetterCount("ice cream")).toBe(8);
  });

  it("strips non-letters", () => {
    expect(lettersOnly("C-a!n 2dy")).toBe("Candy");
  });

  it("merges letters back into the word shape", () => {
    expect(mergeLettersIntoWord("ice cream", "icecream")).toBe("ice cream");
    expect(mergeLettersIntoWord("candy", "can")).toBe("can");
  });

  it("detects completion", () => {
    expect(isLetterAnswerComplete("candy", "candy")).toBe(true);
    expect(isLetterAnswerComplete("candy", "cand")).toBe(false);
    expect(isLetterAnswerComplete("ice cream", "icecream")).toBe(true);
  });

  it("returns first letter for hint prefill", () => {
    expect(firstLetterOfWord("candy")).toBe("c");
    expect(firstLetterOfWord(" ice")).toBe("i");
  });
});
```

Note: adjust `lettersOnly` expectation if implementation lowercases — prefer **preserving typed case** in the string and relying on `isCorrect`’s normalize. Then `lettersOnly("C-a!n 2dy")` → `"Can dy"` wait no spaces stripped: `"Candy"` if we keep case of C,a,n,d,y → `"Candy"`.

- [ ] **Step 2: Run tests — expect fail**

Run: `npm test -- src/lib/game.test.ts`

Expected: FAIL (exports missing)

- [ ] **Step 3: Implement helpers** in `src/lib/game.ts`:

```ts
export function expectedLetterCount(word: string): number {
  return [...word].filter((ch) => !/\s/.test(ch)).length;
}

export function lettersOnly(value: string): string {
  return [...value].filter((ch) => /[a-zA-Z]/.test(ch)).join("");
}

export function mergeLettersIntoWord(word: string, letters: string): string {
  const chars = lettersOnly(letters);
  let i = 0;
  let out = "";
  for (const ch of word) {
    if (/\s/.test(ch)) {
      if (i > 0 && i < chars.length) out += ch;
      else if (i >= chars.length) {
        /* no more letters — stop without trailing space */
      } else {
        /* leading spaces in template: keep if we haven't started? skip leading template spaces until letters exist */
      }
      // Simpler algorithm:
      // Always emit space only when it falls between filled/pending letter slots and we have already started emitting,
      // OR: build full shaped string with placeholders then trim end empties.
    } else {
      if (i < chars.length) {
        out += chars[i];
        i += 1;
      } else {
        break;
      }
    }
  }
  return out;
}
```

Use this clearer implementation instead of the sketch above:

```ts
export function mergeLettersIntoWord(word: string, letters: string): string {
  const chars = lettersOnly(letters);
  let i = 0;
  let out = "";
  for (const ch of word) {
    if (/\s/.test(ch)) {
      if (i > 0 && i < expectedLetterCount(word) && i <= chars.length) {
        // emit space only if at least one letter is placed and we are not past typed letters+1 awkwardly
        // Preferred: emit space whenever the previous emitted char was a letter and more letter slots remain in the template after this gap
        out += ch;
      }
    } else {
      if (i >= chars.length) break;
      // If out ends with spaces that were premature, still OK for complete merges
      out += chars[i];
      i += 1;
    }
  }
  // Fix spaces: rebuild properly
  return rebuild(word, chars);
}

function rebuild(word: string, chars: string): string {
  let i = 0;
  const parts: string[] = [];
  for (const ch of word) {
    if (/\s/.test(ch)) {
      parts.push(ch);
    } else if (i < chars.length) {
      parts.push(chars[i]);
      i += 1;
    } else {
      parts.push("");
    }
  }
  // Trim trailing empty letter slots and spaces that only trail empties
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  while (parts.length && /^\s+$/.test(parts[parts.length - 1]!)) parts.pop();
  return parts.join("");
}

export function isLetterAnswerComplete(word: string, letters: string): boolean {
  return lettersOnly(letters).length === expectedLetterCount(word);
}

export function firstLetterOfWord(word: string): string {
  for (const ch of word) {
    if (!/\s/.test(ch)) return ch;
  }
  return "";
}
```

Verify `mergeLettersIntoWord("ice cream", "icecream") === "ice cream"` and `mergeLettersIntoWord("candy", "can") === "can"`.

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test -- src/lib/game.test.ts`

Expected: PASS

- [ ] **Step 5: Commit** (only if the user asked)

```bash
git add src/lib/game.ts src/lib/game.test.ts
git commit -m "$(cat <<'EOF'
feat: add letter-box helpers for OTP spelling input

EOF
)"
```

---

### Task 2: `LetterBoxes` component

**Files:**
- Create: `src/components/LetterBoxes.tsx`
- Create: `src/components/LetterBoxes.test.tsx`

**Interfaces:**
- Consumes: `expectedLetterCount`, `lettersOnly`, `isLetterAnswerComplete`, `mergeLettersIntoWord` from `../lib/game`
- Produces:

```ts
type LetterBoxesProps = {
  word: string;
  value: string; // letter-only or shaped; component normalizes via lettersOnly
  onChange: (letters: string) => void; // letter-only string
  onComplete: () => void;
  disabled?: boolean;
  id?: string;
};
```

- [ ] **Step 1: Write failing component tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LetterBoxes } from "./LetterBoxes";

describe("LetterBoxes", () => {
  it("renders one box per letter and gaps for spaces", () => {
    const { container } = render(
      <LetterBoxes word="ice cream" value="" onChange={() => {}} onComplete={() => {}} />,
    );
    expect(container.querySelectorAll(".letter-box").length).toBe(8);
    expect(container.querySelectorAll(".letter-gap").length).toBe(1);
  });

  it("types letters into the hidden input and calls onChange", () => {
    const onChange = vi.fn();
    render(
      <LetterBoxes word="cat" value="" onChange={onChange} onComplete={() => {}} />,
    );
    const input = screen.getByLabelText(/spelling/i);
    fireEvent.change(input, { target: { value: "ca" } });
    expect(onChange).toHaveBeenCalledWith("ca");
  });

  it("calls onComplete when value becomes full", () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <LetterBoxes word="cat" value="ca" onChange={() => {}} onComplete={onComplete} />,
    );
    rerender(
      <LetterBoxes word="cat" value="cat" onChange={() => {}} onComplete={onComplete} />,
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests — expect fail**

Run: `npm test -- src/components/LetterBoxes.test.tsx`

Expected: FAIL (module missing)

- [ ] **Step 3: Implement `LetterBoxes.tsx`**

```tsx
import { useEffect, useRef } from "react";
import {
  expectedLetterCount,
  isLetterAnswerComplete,
  lettersOnly,
} from "../lib/game";

type LetterBoxesProps = {
  word: string;
  value: string;
  onChange: (letters: string) => void;
  onComplete: () => void;
  disabled?: boolean;
};

export function LetterBoxes({
  word,
  value,
  onChange,
  onComplete,
  disabled = false,
}: LetterBoxesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const letters = lettersOnly(value);
  const max = expectedLetterCount(word);
  const completedRef = useRef(false);

  useEffect(() => {
    if (isLetterAnswerComplete(word, letters)) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    } else {
      completedRef.current = false;
    }
  }, [word, letters, onComplete]);

  function focusInput() {
    inputRef.current?.focus();
  }

  let letterIndex = 0;
  const boxes = [...word].map((ch, i) => {
    if (/\s/.test(ch)) {
      return <span key={`g-${i}`} className="letter-gap" aria-hidden="true" />;
    }
    const idx = letterIndex;
    letterIndex += 1;
    const filled = letters[idx] ?? "";
    const active = idx === letters.length && letters.length < max;
    return (
      <span
        key={`l-${i}`}
        className={`letter-box${active ? " active" : ""}${filled ? " filled" : ""}`}
        onClick={focusInput}
      >
        {filled}
      </span>
    );
  });

  return (
    <div className="letter-boxes" onClick={focusInput}>
      <input
        ref={inputRef}
        className="letter-boxes-input"
        aria-label="Spelling answer"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="done"
        disabled={disabled}
        value={letters}
        maxLength={max}
        onChange={(event) => {
          onChange(lettersOnly(event.target.value).slice(0, max));
        }}
      />
      <div className="letter-boxes-row" aria-hidden="true">
        {boxes}
      </div>
    </div>
  );
}
```

Ensure the hidden input remains focusable/accessible (visually hidden via CSS, not `display: none`).

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test -- src/components/LetterBoxes.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit** (only if the user asked)

```bash
git add src/components/LetterBoxes.tsx src/components/LetterBoxes.test.tsx
git commit -m "$(cat <<'EOF'
feat: add LetterBoxes OTP spelling input

EOF
)"
```

---

### Task 3: Wire Practice + CSS

**Files:**
- Modify: `src/screens/Practice.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `LetterBoxes`, `mergeLettersIntoWord`, `isLetterAnswerComplete`, `firstLetterOfWord`, `lettersOnly`

- [ ] **Step 1: Replace text input in answering form**

1. Import `LetterBoxes` and helpers.
2. Keep `answer` state as **letter-only** string (or shaped—be consistent: store letter-only; when calling `isCorrect`, use `mergeLettersIntoWord(current.word, answer)`).
3. Replace the `<input>` with:

```tsx
<LetterBoxes
  word={current.word}
  value={answer}
  disabled={phase !== "answering"}
  onChange={setAnswer}
  onComplete={() => checkAnswer()}
/>
```

4. In `checkAnswer`, compare with:

```ts
const shaped = mergeLettersIntoWord(current.word, answer);
if (isCorrect(shaped, current.word)) { ... }
```

5. Check button: `disabled={!isLetterAnswerComplete(current.word, answer)}`

6. Hint prefill — when Show hint is clicked:

```ts
onClick={() => {
  setHintUsed(true);
  setAnswer((prev) => {
    const letters = lettersOnly(prev);
    const first = firstLetterOfWord(current.word);
    if (!first) return letters;
    if (letters.length === 0) return first;
    return first + letters.slice(1);
  });
}}
```

Or if hint was already partially typed, always set index 0 to first letter:

```ts
setAnswer((prev) => {
  const letters = lettersOnly(prev);
  const first = firstLetterOfWord(current.word);
  const rest = letters.slice(1);
  return lettersOnly(first + rest).slice(0, expectedLetterCount(current.word));
});
```

7. Guard `onComplete` / `checkAnswer` against double-fire (component already uses `completedRef`; `checkAnswer` no-ops if `phase !== "answering"`).

8. Remove old placeholder single-line input.

- [ ] **Step 2: Add CSS** for `.letter-boxes`, `.letter-boxes-input` (visually hidden but focusable), `.letter-boxes-row`, `.letter-box`, `.letter-box.active`, `.letter-box.filled`, `.letter-gap`:

```css
.letter-boxes {
  position: relative;
}

.letter-boxes-input {
  position: absolute;
  opacity: 0.01;
  width: 1px;
  height: 1px;
  border: 0;
  padding: 0;
  margin: 0;
}

.letter-boxes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.letter-box {
  width: 2.4rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(22, 50, 79, 0.14);
  border-radius: 12px;
  background: #fff;
  font-family: "Baloo 2", "Nunito", system-ui, sans-serif;
  font-size: 1.45rem;
  color: var(--ink);
}

.letter-box.active {
  border-color: var(--teal);
  outline: 3px solid rgba(15, 139, 141, 0.28);
}

.letter-gap {
  width: 0.85rem;
  height: 1px;
}

@media (max-width: 480px) {
  .letter-box {
    width: 2.1rem;
    height: 2.45rem;
    font-size: 1.25rem;
  }
}
```

- [ ] **Step 3: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass; build succeeds.

Manual (`npm run dev`):

- Scramble word → letter boxes match length
- Type last letter → auto-check
- Hint → first box filled
- Multi-word (if in list) → gap + correct scoring
- Wrong answer → boxes clear, retry works

- [ ] **Step 4: Commit** (only if the user asked)

```bash
git add src/screens/Practice.tsx src/App.css
git commit -m "$(cat <<'EOF'
feat: use OTP letter boxes for practice answers

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| One box per letter / gaps for spaces | Tasks 1–2 |
| Single hidden input | Task 2 |
| Auto-submit when full | Tasks 2–3 |
| Hint prefills first letter | Task 3 |
| Check disabled until complete | Task 3 |
| Clear on retry | Task 3 (existing `setAnswer("")`) |
| `isCorrect` with spaces | Task 1 `mergeLettersIntoWord` + Task 3 |
| Styles / wrap on mobile | Task 3 |

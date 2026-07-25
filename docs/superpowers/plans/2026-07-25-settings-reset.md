# Settings Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings screen where the current player can reset their own points or restore the built-in Oxford starter word list, each with an in-panel confirm step.

**Architecture:** Extend `ScoreStore` with `resetPoints(nickname)` and storage with `clearWordList()`. A new `Settings` screen owns confirm UI state; `App.tsx` performs the actual resets and refreshes React state. Home gains a Settings entry button.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, localStorage

## Global Constraints

- Reset points: **current nickname only** (lifetime + dailyPoints)
- Reset word list: restore **built-in Oxford starter** (`DEFAULT_WORD_LIST`); remove stored custom list
- Both actions require in-panel **Confirm** before running
- Match existing Spell Quest panel / button patterns; danger buttons use `--coral`
- TDD for store/storage changes; frequent commits
- Spec: `docs/superpowers/specs/2026-07-25-settings-reset-design.md`

## File Structure

| File | Responsibility |
| --- | --- |
| `src/types.ts` | Add `"settings"` view; `resetPoints` on `ScoreStore` |
| `src/lib/scoreStore.ts` | Implement `resetPoints` |
| `src/lib/scoreStore.test.ts` | Tests for `resetPoints` |
| `src/lib/storage.ts` | `clearWordList` |
| `src/lib/storage.test.ts` | Tests for `clearWordList` (create if missing) |
| `src/screens/Settings.tsx` | Settings UI + confirm flows |
| `src/screens/Home.tsx` | Settings button |
| `src/App.tsx` | Wire view + reset handlers |
| `src/App.css` | Danger button + settings section styles |

---

### Task 1: `resetPoints` on score store

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/scoreStore.ts`
- Modify: `src/lib/scoreStore.test.ts`

**Interfaces:**
- Consumes: existing `createLocalScoreStore`, `readEntries` / `writeEntries` pattern
- Produces: `ScoreStore.resetPoints(nickname: string): void` — removes matching entry (case-insensitive); no-op if missing/empty

- [ ] **Step 1: Extend types**

In `src/types.ts`, add `"settings"` to `AppView` and `resetPoints` to `ScoreStore`:

```ts
export type AppView =
  | "welcome"
  | "home"
  | "practice"
  | "import"
  | "leaderboard"
  | "daily-points"
  | "settings";

export type ScoreStore = {
  getLeaderboard: () => LeaderboardEntry[];
  addPoints: (nickname: string, points: number) => void;
  getPoints: (nickname: string) => number;
  getDailyPoints: (nickname: string) => Record<string, number>;
  getMonthTotal: (nickname: string, year: number, month: number) => number;
  resetPoints: (nickname: string) => void;
};
```

- [ ] **Step 2: Write failing tests**

Append to `src/lib/scoreStore.test.ts`:

```ts
it("resetPoints removes only the matching nickname", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 25, 12, 0, 0));

  const store = createLocalScoreStore(storage);
  store.addPoints("Sam", 10);
  store.addPoints("Alex", 20);
  store.resetPoints("sam");

  expect(store.getPoints("Sam")).toBe(0);
  expect(store.getDailyPoints("Sam")).toEqual({});
  expect(store.getLeaderboard()).toEqual([
    {
      nickname: "Alex",
      totalPoints: 20,
      dailyPoints: { "2026-07-25": 20 },
    },
  ]);

  vi.useRealTimers();
});

it("resetPoints is a no-op for unknown nickname", () => {
  const store = createLocalScoreStore(storage);
  store.addPoints("Alex", 5);
  store.resetPoints("Sam");
  expect(store.getPoints("Alex")).toBe(5);
});
```

- [ ] **Step 3: Run tests — expect fail**

Run: `npm test -- src/lib/scoreStore.test.ts`

Expected: FAIL — `resetPoints` is not a function

- [ ] **Step 4: Implement**

In `createLocalScoreStore` return object, add:

```ts
resetPoints(nickname: string) {
  const trimmed = nickname.trim();
  if (!trimmed) return;
  const key = trimmed.toLowerCase();
  const entries = readEntries(storage).filter(
    (e) => e.nickname.toLowerCase() !== key,
  );
  writeEntries(entries, storage);
},
```

- [ ] **Step 5: Run tests — expect pass**

Run: `npm test -- src/lib/scoreStore.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/scoreStore.ts src/lib/scoreStore.test.ts
git commit -m "$(cat <<'EOF'
Add resetPoints for the current nickname.

EOF
)"
```

---

### Task 2: `clearWordList` storage helper

**Files:**
- Modify: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`

**Interfaces:**
- Consumes: `KEYS.wordList`, `getStorage`, `getWordList`, `DEFAULT_WORD_LIST`
- Produces: `clearWordList(storage?: Storage): void` — removes word list key; afterward `getWordList` returns default

- [ ] **Step 1: Write failing tests**

Create `src/lib/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_WORD_LIST } from "../data/defaultWordList";
import {
  STORAGE_KEYS,
  clearWordList,
  getWordList,
  setWordList,
} from "./storage";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("clearWordList", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("removes custom list so getWordList returns default", () => {
    setWordList(
      {
        id: "custom",
        name: "My list",
        words: [{ word: "cat", clue: "pet" }],
      },
      storage,
    );
    expect(getWordList(storage).name).toBe("My list");

    clearWordList(storage);

    expect(storage.getItem(STORAGE_KEYS.wordList)).toBeNull();
    expect(getWordList(storage)).toEqual(DEFAULT_WORD_LIST);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

Run: `npm test -- src/lib/storage.test.ts`

Expected: FAIL — `clearWordList` not exported

- [ ] **Step 3: Implement**

In `src/lib/storage.ts`:

```ts
export function clearWordList(storage?: Storage): void {
  getStorage(storage).removeItem(KEYS.wordList);
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test -- src/lib/storage.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "$(cat <<'EOF'
Add clearWordList to restore the starter list.

EOF
)"
```

---

### Task 3: Settings screen + styles

**Files:**
- Create: `src/screens/Settings.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: none from store directly
- Produces:
  ```ts
  type SettingsProps = {
    nickname: string;
    onResetPoints: () => void;
    onResetWordList: () => void;
    onBack: () => void;
  };
  ```
  Confirm state: `idle | confirm-points | confirm-words`; success message string after confirm

- [ ] **Step 1: Create Settings screen**

Create `src/screens/Settings.tsx`:

```tsx
import { useState } from "react";

type ConfirmKind = "points" | "words" | null;

type SettingsProps = {
  nickname: string;
  onResetPoints: () => void;
  onResetWordList: () => void;
  onBack: () => void;
};

export function Settings({
  nickname,
  onResetPoints,
  onResetWordList,
  onBack,
}: SettingsProps) {
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [message, setMessage] = useState<string | null>(null);

  function askReset(kind: Exclude<ConfirmKind, null>) {
    setMessage(null);
    setConfirm(kind);
  }

  function cancel() {
    setConfirm(null);
  }

  function confirmAction() {
    if (confirm === "points") {
      onResetPoints();
      setMessage("Your points were reset.");
    } else if (confirm === "words") {
      onResetWordList();
      setMessage("Word list restored to starter words.");
    }
    setConfirm(null);
  }

  return (
    <section className="panel settings">
      <p className="brand">Spell Quest</p>
      <h1>Settings</h1>
      <p className="lede">Manage your progress on this device.</p>

      {message ? <p className="banner success">{message}</p> : null}

      <div className="settings-block">
        <h2>Your points</h2>
        <p className="meta">
          Clears lifetime and daily points for {nickname} only. Other players
          stay.
        </p>
        {confirm === "points" ? (
          <div className="confirm-row">
            <p className="confirm-copy">Reset your points? This cannot be undone.</p>
            <div className="row">
              <button type="button" className="btn secondary" onClick={cancel}>
                Cancel
              </button>
              <button type="button" className="btn danger" onClick={confirmAction}>
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn danger"
            onClick={() => askReset("points")}
          >
            Reset my points
          </button>
        )}
      </div>

      <div className="settings-block">
        <h2>Word list</h2>
        <p className="meta">
          Removes any imported list and restores the built-in starter words.
        </p>
        {confirm === "words" ? (
          <div className="confirm-row">
            <p className="confirm-copy">
              Restore the starter word list? Your import will be removed.
            </p>
            <div className="row">
              <button type="button" className="btn secondary" onClick={cancel}>
                Cancel
              </button>
              <button type="button" className="btn danger" onClick={confirmAction}>
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn danger"
            onClick={() => askReset("words")}
          >
            Reset word list
          </button>
        )}
      </div>

      <button type="button" className="btn secondary" onClick={onBack}>
        Back home
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Add CSS**

Append to `src/App.css` (reuse `.banner` if it exists; add `success` / danger / settings):

```css
.btn.danger {
  background: linear-gradient(160deg, var(--coral), #f28b8d);
  color: #fff;
  box-shadow: 0 10px 22px rgba(239, 93, 96, 0.28);
}

.settings-block {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(22, 50, 79, 0.08);
}

.settings-block h2 {
  margin: 0 0 0.35rem;
  font-size: 1.15rem;
}

.settings-block .meta {
  margin-bottom: 0.75rem;
}

.confirm-copy {
  margin: 0 0 0.65rem;
  color: var(--ink);
}

.banner.success {
  background: rgba(42, 157, 143, 0.14);
  color: var(--teal-deep);
  border: 1px solid rgba(15, 139, 141, 0.22);
  border-radius: 16px;
  padding: 0.75rem 1rem;
  margin: 0 0 1rem;
}

.settings .btn.secondary {
  width: 100%;
  margin-top: 0.25rem;
}

.settings-block .btn.danger,
.settings-block .row .btn {
  width: auto;
}
```

If `.banner` already has base styles, only add `.banner.success` extras that don’t conflict.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Settings.tsx src/App.css
git commit -m "$(cat <<'EOF'
Add Settings screen with confirmable resets.

EOF
)"
```

---

### Task 4: Wire Home + App

**Files:**
- Modify: `src/screens/Home.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `scoreStore.resetPoints`, `clearWordList`, `getWordList` / `DEFAULT_WORD_LIST`, `Settings`
- Produces: Home → Settings navigation; resets refresh points/word list state

- [ ] **Step 1: Home button**

Add `onSettings: () => void` to `HomeProps`, destructure it, and add after Points by day:

```tsx
<button type="button" className="btn secondary" onClick={onSettings}>
  Settings
</button>
```

- [ ] **Step 2: Wire App.tsx**

1. Import `Settings` and `clearWordList`.
2. Pass `onSettings={() => setView("settings")}` to Home.
3. Render:

```tsx
{view === "settings" && (
  <Settings
    nickname={nickname}
    onResetPoints={() => {
      scoreStore.resetPoints(nickname);
      setPointsVersion((v) => v + 1);
    }}
    onResetWordList={() => {
      clearWordList();
      setWordListState(getWordList());
    }}
    onBack={() => setView("home")}
  />
)}
```

- [ ] **Step 3: Verify**

Run: `npm test && npm run build`

Expected: all tests PASS; build succeeds.

Manual smoke (`npm run dev`):
1. Home → Settings → Back home
2. Earn points → Reset my points → Confirm → chip is 0; calendar empty
3. Import a tiny list → Reset word list → Confirm → Home shows starter list again
4. Cancel on confirm leaves data unchanged
5. Second nickname’s points remain after first resets

- [ ] **Step 4: Commit**

```bash
git add src/screens/Home.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Wire Settings into home navigation.

EOF
)"
```

---

## Spec coverage

| Spec requirement | Task |
| --- | --- |
| `resetPoints` current nickname only | Task 1 |
| `clearWordList` → default Oxford list | Task 2 |
| Settings screen + confirm + success | Task 3 |
| Home entry + App wiring | Task 4 |
| No full leaderboard wipe / no empty list | Honored (not built) |

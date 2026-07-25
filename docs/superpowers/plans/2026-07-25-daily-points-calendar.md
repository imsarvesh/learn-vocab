# Daily Points Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a month calendar screen that shows the current player's points earned per day, while keeping lifetime totals and the leaderboard unchanged for existing scores.

**Architecture:** Extend each `LeaderboardEntry` with an optional `dailyPoints` map (`YYYY-MM-DD` → points). `addPoints` still bumps `totalPoints` and also increments today's key. A pure calendar helper builds the month grid; a new `DailyPoints` screen renders it with prev/next month navigation. Home gains a "Points by day" entry point.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, localStorage (existing score store pattern)

## Global Constraints

- Calendar shows **current nickname only**
- Existing lifetime totals stay as-is; calendar starts empty until new points are earned
- Date keys are **local** calendar dates `YYYY-MM-DD`
- `getMonthTotal` / calendar month args use **1-based months** (January = 1)
- No day drill-down; no historical migration of old totals onto dates
- Match existing Spell Quest panel / button styles in `App.css`
- Follow TDD: failing test → implement → pass → commit per task

## File Structure

| File | Responsibility |
| --- | --- |
| `src/types.ts` | Extend `LeaderboardEntry`, `ScoreStore`, `AppView` |
| `src/lib/scoreStore.ts` | Persist daily map; `getDailyPoints`; `getMonthTotal` |
| `src/lib/scoreStore.test.ts` | Daily scoring + month total tests |
| `src/lib/calendar.ts` | Pure month grid + month sum helpers |
| `src/lib/calendar.test.ts` | Grid padding / today / points / sum tests |
| `src/screens/DailyPoints.tsx` | Calendar UI for one nickname |
| `src/screens/Home.tsx` | "Points by day" button |
| `src/App.tsx` | Wire view + pass daily props |
| `src/App.css` | Calendar layout styles |

---

### Task 1: Extend score store with daily points

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/scoreStore.ts`
- Modify: `src/lib/scoreStore.test.ts`

**Interfaces:**
- Consumes: existing `createLocalScoreStore(storage?)`, storage helpers
- Produces:
  - `LeaderboardEntry = { nickname: string; totalPoints: number; dailyPoints?: Record<string, number> }`
  - `ScoreStore.getDailyPoints(nickname: string): Record<string, number>`
  - `ScoreStore.getMonthTotal(nickname: string, year: number, month: number): number` (month 1–12)
  - `addPoints` also increments `dailyPoints[today]` where today is local `YYYY-MM-DD`

- [ ] **Step 1: Update types**

In `src/types.ts`, replace the leaderboard/score types with:

```ts
export type LeaderboardEntry = {
  nickname: string;
  totalPoints: number;
  dailyPoints?: Record<string, number>;
};

export type AppView =
  | "welcome"
  | "home"
  | "practice"
  | "import"
  | "leaderboard"
  | "daily-points";

export type ScoreStore = {
  getLeaderboard: () => LeaderboardEntry[];
  addPoints: (nickname: string, points: number) => void;
  getPoints: (nickname: string) => number;
  getDailyPoints: (nickname: string) => Record<string, number>;
  getMonthTotal: (nickname: string, year: number, month: number) => number;
};
```

(Keep other existing exports in the file unchanged.)

- [ ] **Step 2: Write the failing tests**

Append to `src/lib/scoreStore.test.ts` (keep `createMemoryStorage` and existing cases; update the first test’s `toEqual` to include `dailyPoints` once implementation lands — for this step, add the new cases first):

```ts
function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

it("tracks points on today's date key", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 25, 12, 0, 0)); // Jul 25, 2026 local

  const store = createLocalScoreStore(storage);
  store.addPoints("Sam", 10);
  store.addPoints("Sam", 5);

  expect(store.getPoints("Sam")).toBe(15);
  expect(store.getDailyPoints("Sam")).toEqual({ "2026-07-25": 15 });
  expect(store.getMonthTotal("Sam", 2026, 7)).toBe(15);
  expect(store.getMonthTotal("Sam", 2026, 6)).toBe(0);

  vi.useRealTimers();
});

it("leaves legacy entries without dailyPoints readable", () => {
  storage.setItem(
    "spellquest:leaderboard",
    JSON.stringify([{ nickname: "Sam", totalPoints: 40 }]),
  );
  const store = createLocalScoreStore(storage);
  expect(store.getPoints("Sam")).toBe(40);
  expect(store.getDailyPoints("Sam")).toEqual({});
  expect(store.getMonthTotal("Sam", 2026, 7)).toBe(0);
});
```

Add `vi` to the vitest import: `import { beforeEach, describe, expect, it, vi } from "vitest";`

Also update the existing `"adds points and ranks leaderboard"` expectation so it still passes after daily tracking (use fake timers fixed to a known day, or assert with `expect.objectContaining` / include `dailyPoints: { [todayKey()]: … }`). Preferred update:

```ts
it("adds points and ranks leaderboard", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 25, 12, 0, 0));

  const store = createLocalScoreStore(storage);
  store.addPoints("Sam", 10);
  store.addPoints("Alex", 15);
  store.addPoints("Sam", 5);

  expect(store.getPoints("Sam")).toBe(15);
  expect(store.getLeaderboard()).toEqual([
    {
      nickname: "Alex",
      totalPoints: 15,
      dailyPoints: { "2026-07-25": 15 },
    },
    {
      nickname: "Sam",
      totalPoints: 15,
      dailyPoints: { "2026-07-25": 15 },
    },
  ]);

  vi.useRealTimers();
});
```

- [ ] **Step 3: Run tests to verify new ones fail**

Run: `npm test -- src/lib/scoreStore.test.ts`

Expected: FAIL — `getDailyPoints` / `getMonthTotal` missing, or leaderboard shape mismatch.

- [ ] **Step 4: Implement score store changes**

In `src/lib/scoreStore.ts`, add helpers and update methods:

```ts
function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function findEntry(
  entries: LeaderboardEntry[],
  nickname: string,
): LeaderboardEntry | undefined {
  const key = nickname.trim().toLowerCase();
  return entries.find((e) => e.nickname.toLowerCase() === key);
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-`;
}
```

Update `addPoints` so new/updated entries set:

```ts
const day = localDateKey();
const prevDaily = entries[index]?.dailyPoints ?? {};
// when creating or updating:
dailyPoints: {
  ...prevDaily,
  [day]: (prevDaily[day] ?? 0) + points,
},
```

(For a brand-new entry, `prevDaily` is `{}`.)

Add:

```ts
getDailyPoints(nickname: string) {
  return { ...(findEntry(readEntries(storage), nickname)?.dailyPoints ?? {}) };
},

getMonthTotal(nickname: string, year: number, month: number) {
  const daily = findEntry(readEntries(storage), nickname)?.dailyPoints ?? {};
  const prefix = monthPrefix(year, month);
  let total = 0;
  for (const [key, value] of Object.entries(daily)) {
    if (key.startsWith(prefix)) total += value;
  }
  return total;
},
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/scoreStore.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/scoreStore.ts src/lib/scoreStore.test.ts
git commit -m "$(cat <<'EOF'
Track daily points alongside lifetime totals.

EOF
)"
```

---

### Task 2: Calendar month grid helper

**Files:**
- Create: `src/lib/calendar.ts`
- Create: `src/lib/calendar.test.ts`

**Interfaces:**
- Consumes: daily points map `Record<string, number>`
- Produces:
  - `formatDateKey(date: Date): string`
  - `CalendarCell = { dateKey: string | null; day: number | null; points: number; inMonth: boolean; isToday: boolean }`
  - `buildMonthGrid(year: number, month: number, dailyPoints: Record<string, number>, todayKey: string): CalendarCell[]`
  - `sumMonthPoints(year: number, month: number, dailyPoints: Record<string, number>): number`
  - Month is **1-based**; grid is Sunday-first; length is a multiple of 7

- [ ] **Step 1: Write the failing tests**

Create `src/lib/calendar.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildMonthGrid, formatDateKey, sumMonthPoints } from "./calendar";

describe("calendar", () => {
  it("formats local date keys", () => {
    expect(formatDateKey(new Date(2026, 6, 25))).toBe("2026-07-25");
  });

  it("builds a Sunday-first July 2026 grid with points", () => {
    // July 1, 2026 is Wednesday → 3 leading blanks
    const grid = buildMonthGrid(
      2026,
      7,
      { "2026-07-25": 12, "2026-07-01": 3 },
      "2026-07-25",
    );

    expect(grid.length % 7).toBe(0);
    expect(grid.slice(0, 3).every((c) => !c.inMonth)).toBe(true);

    const first = grid[3];
    expect(first).toMatchObject({
      dateKey: "2026-07-01",
      day: 1,
      points: 3,
      inMonth: true,
      isToday: false,
    });

    const today = grid.find((c) => c.dateKey === "2026-07-25");
    expect(today).toMatchObject({
      day: 25,
      points: 12,
      inMonth: true,
      isToday: true,
    });
  });

  it("sums month points", () => {
    expect(
      sumMonthPoints(2026, 7, {
        "2026-07-01": 3,
        "2026-07-25": 12,
        "2026-06-30": 99,
      }),
    ).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/calendar.test.ts`

Expected: FAIL — cannot find module `./calendar`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/calendar.ts`:

```ts
export type CalendarCell = {
  dateKey: string | null;
  day: number | null;
  points: number;
  inMonth: boolean;
  isToday: boolean;
};

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sumMonthPoints(
  year: number,
  month: number,
  dailyPoints: Record<string, number>,
): number {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  let total = 0;
  for (const [key, value] of Object.entries(dailyPoints)) {
    if (key.startsWith(prefix)) total += value;
  }
  return total;
}

export function buildMonthGrid(
  year: number,
  month: number,
  dailyPoints: Record<string, number>,
  todayKey: string,
): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = first.getDay(); // 0 = Sunday

  const cells: CalendarCell[] = [];

  for (let i = 0; i < leading; i++) {
    cells.push({
      dateKey: null,
      day: null,
      points: 0,
      inMonth: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      dateKey,
      day,
      points: dailyPoints[dateKey] ?? 0,
      inMonth: true,
      isToday: dateKey === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      dateKey: null,
      day: null,
      points: 0,
      inMonth: false,
      isToday: false,
    });
  }

  return cells;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/calendar.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/calendar.ts src/lib/calendar.test.ts
git commit -m "$(cat <<'EOF'
Add month calendar grid helpers for daily points.

EOF
)"
```

---

### Task 3: DailyPoints screen + styles

**Files:**
- Create: `src/screens/DailyPoints.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `buildMonthGrid`, `sumMonthPoints`, `formatDateKey` from `src/lib/calendar.ts`
- Produces: `DailyPoints` React component with props:
  ```ts
  type DailyPointsProps = {
    nickname: string;
    totalPoints: number;
    dailyPoints: Record<string, number>;
    onBack: () => void;
  };
  ```

- [ ] **Step 1: Create the screen**

Create `src/screens/DailyPoints.tsx`:

```tsx
import { useMemo, useState } from "react";
import {
  buildMonthGrid,
  formatDateKey,
  sumMonthPoints,
} from "../lib/calendar";

type DailyPointsProps = {
  nickname: string;
  totalPoints: number;
  dailyPoints: Record<string, number>;
  onBack: () => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DailyPoints({
  nickname,
  totalPoints,
  dailyPoints,
  onBack,
}: DailyPointsProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const todayKey = formatDateKey(now);

  const cells = useMemo(
    () => buildMonthGrid(year, month, dailyPoints, todayKey),
    [year, month, dailyPoints, todayKey],
  );
  const monthTotal = useMemo(
    () => sumMonthPoints(year, month, dailyPoints),
    [year, month, dailyPoints],
  );

  const label = new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function goPrev() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <section className="panel daily-points">
      <p className="brand">Spell Quest</p>
      <header className="home-header">
        <div>
          <p className="eyebrow">Points by day</p>
          <h1>{nickname}</h1>
        </div>
        <div className="points-chip" aria-label={`${totalPoints} points`}>
          <span>{totalPoints}</span>
          <small>lifetime</small>
        </div>
      </header>
      <p className="lede">Points you earn from today onward show up here.</p>

      <div className="month-nav">
        <button type="button" className="btn ghost" onClick={goPrev} aria-label="Previous month">
          ‹
        </button>
        <p className="month-label">{label}</p>
        <button type="button" className="btn ghost" onClick={goNext} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="cal-weekdays" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid" role="grid" aria-label={`Calendar for ${label}`}>
        {cells.map((cell, index) => (
          <div
            key={cell.dateKey ?? `pad-${index}`}
            role="gridcell"
            className={[
              "cal-cell",
              cell.inMonth ? undefined : "muted",
              cell.isToday ? "today" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {cell.inMonth ? (
              <>
                <span className="cal-day">{cell.day}</span>
                {cell.points > 0 ? (
                  <span className="cal-pts">{cell.points}</span>
                ) : null}
              </>
            ) : null}
          </div>
        ))}
      </div>

      <p className="month-total">This month: {monthTotal} points</p>

      <button type="button" className="btn secondary" onClick={onBack}>
        Back home
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Add CSS**

Append to `src/App.css`:

```css
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}

.month-label {
  margin: 0;
  font-family: "Baloo 2", sans-serif;
  font-size: 1.2rem;
  color: var(--ink);
}

.month-nav .btn.ghost {
  min-width: 2.75rem;
  padding: 0.55rem 0.75rem;
  font-size: 1.35rem;
  line-height: 1;
}

.cal-weekdays,
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.35rem;
}

.cal-weekdays {
  margin-bottom: 0.35rem;
}

.cal-weekdays span {
  text-align: center;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
}

.cal-cell {
  min-height: 3.4rem;
  border-radius: 14px;
  border: 1px solid rgba(22, 50, 79, 0.08);
  background: rgba(255, 255, 255, 0.55);
  padding: 0.35rem 0.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.cal-cell.muted {
  background: transparent;
  border-color: transparent;
}

.cal-cell.today {
  border-color: var(--teal);
  box-shadow: inset 0 0 0 1px rgba(15, 139, 141, 0.35);
}

.cal-day {
  font-size: 0.85rem;
  color: var(--ink);
}

.cal-pts {
  font-family: "Baloo 2", sans-serif;
  font-size: 0.95rem;
  color: var(--teal-deep);
}

.month-total {
  margin: 0.9rem 0 1rem;
  color: var(--ink-soft);
  font-size: 1rem;
}

.daily-points .btn.secondary {
  width: 100%;
}
```

- [ ] **Step 3: Typecheck the screen in isolation**

Run: `npx tsc -b --pretty false`

Expected: may still fail on `App.tsx` until Task 4 wires `daily-points`; if only missing wiring errors remain, proceed. If `DailyPoints.tsx` itself has type errors, fix them before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/screens/DailyPoints.tsx src/App.css
git commit -m "$(cat <<'EOF'
Add Points by day calendar screen.

EOF
)"
```

---

### Task 4: Wire Home + App navigation

**Files:**
- Modify: `src/screens/Home.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `scoreStore.getDailyPoints`, `DailyPoints` screen, `AppView` including `"daily-points"`
- Produces: navigable Home → DailyPoints → Home loop; daily map refreshes with `pointsVersion`

- [ ] **Step 1: Update Home**

Add prop `onDailyPoints: () => void` and a secondary button after Leaderboard:

```tsx
type HomeProps = {
  // ...existing props...
  onLeaderboard: () => void;
  onDailyPoints: () => void;
  onChangeName: () => void;
};

// in action-grid, after Leaderboard button:
<button type="button" className="btn secondary" onClick={onDailyPoints}>
  Points by day
</button>
```

- [ ] **Step 2: Wire App.tsx**

1. Import `DailyPoints`.
2. Add `dailyPoints` memo next to `points` / `leaderboard`:

```ts
const dailyPoints = useMemo(() => {
  void pointsVersion;
  return nickname ? scoreStore.getDailyPoints(nickname) : {};
}, [nickname, pointsVersion]);
```

3. Pass `onDailyPoints={() => setView("daily-points")}` into `Home`.
4. Render:

```tsx
{view === "daily-points" && (
  <DailyPoints
    nickname={nickname}
    totalPoints={points}
    dailyPoints={dailyPoints}
    onBack={() => setView("home")}
  />
)}
```

- [ ] **Step 3: Verify build and tests**

Run: `npm test && npm run build`

Expected: all tests PASS; production build succeeds.

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev`

Manually verify:
1. Home shows **Points by day**.
2. Calendar opens for current month; lifetime chip matches Home.
3. Finish a practice round → return → calendar today’s cell shows earned points; month total updates.
4. Prev/next month works; empty months show `This month: 0 points`.
5. Leaderboard still lists lifetime totals.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Home.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Wire Points by day into home navigation.

EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
| --- | --- |
| `dailyPoints` map on entries | Task 1 |
| `addPoints` updates total + today | Task 1 |
| Legacy entries without daily map | Task 1 |
| `getDailyPoints` / `getMonthTotal` (1-based) | Task 1 |
| Month calendar Sun–Sat, points on cells | Tasks 2–3 |
| Today highlight, muted out-of-month | Tasks 2–3 |
| Month nav + month total | Task 3 |
| Home entry + App wiring | Task 4 |
| No historical migration / no drill-down | Honored (not built) |

## Placeholder / consistency notes

- Date key formatting is duplicated lightly in `scoreStore` and `calendar.formatDateKey` — acceptable; do not couple the store to the UI helper.
- Leaderboard tests must expect `dailyPoints` on entries after Task 1.
- `AppView` gains `"daily-points"` in Task 1 so Task 4 typechecks cleanly.

# Home Quest Lobby Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Home screen into a kid-game “Quest Lobby” with a large Letter Scramble play card, three smaller secondary tiles, soft greeting + corner points chip, and medium entrance motion.

**Architecture:** Keep `Home` props and `App.tsx` wiring unchanged. Rewrite `Home.tsx` markup for the new hierarchy; add home-scoped CSS in `App.css` for play card, tiles, and motion (including `prefers-reduced-motion`). Cover structure and empty-state behavior with a Vitest + Testing Library suite.

**Tech Stack:** React 19, TypeScript, Vite, plain CSS, Vitest, Testing Library

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-26-home-quest-lobby-design.md`
- Home screen only — do not change Practice, Settings, Welcome, Import, or routing
- Keep existing warm paper + teal / coral / sun CSS variables
- Soft identity: `Hi, {nickname}`; compact points chip (not a large header hero)
- Play card disabled when `!hasWords`; empty copy points to Settings
- Secondary tiles: Leaderboard, Points by day, Settings — equal size
- Motion: Play rise/fade; tiles stagger; hover lift; disable under `prefers-reduced-motion: reduce`
- Do not commit unless the user asks

## File map

| File | Responsibility |
|------|----------------|
| `src/screens/Home.tsx` | Quest Lobby markup |
| `src/screens/Home.test.tsx` | Structure, empty state, callback wiring |
| `src/App.css` | Home play card, tiles, motion, compact chip |

---

### Task 1: Home tests + Quest Lobby markup

**Files:**
- Create: `src/screens/Home.test.tsx`
- Modify: `src/screens/Home.tsx`

**Interfaces:**
- Consumes (unchanged): `HomeProps` — `nickname`, `points`, `hasWords`, `wordCount`, `listName`, `onPractice`, `onLeaderboard`, `onDailyPoints`, `onSettings`, `onChangeName`
- Produces: Home DOM with classes `home-top`, `home-greeting`, `points-chip` (compact via `home-points`), `play-card`, `home-tiles`, `home-tile`

- [ ] **Step 1: Write failing tests**

Create `src/screens/Home.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Home } from "./Home";

const baseProps = {
  nickname: "Sam",
  points: 42,
  hasWords: true,
  wordCount: 1200,
  listName: "Starter words",
  onPractice: vi.fn(),
  onLeaderboard: vi.fn(),
  onDailyPoints: vi.fn(),
  onSettings: vi.fn(),
  onChangeName: vi.fn(),
};

describe("Home quest lobby", () => {
  it("shows soft greeting, brand, and points", () => {
    render(<Home {...baseProps} />);
    expect(screen.getByText("Spell Quest")).toBeTruthy();
    expect(screen.getByText(/Hi, Sam/i)).toBeTruthy();
    expect(screen.getByLabelText("42 points")).toBeTruthy();
  });

  it("shows play card with word count and starts practice", () => {
    render(<Home {...baseProps} />);
    const play = screen.getByRole("button", { name: /letter scramble/i });
    expect(play).not.toBeDisabled();
    expect(screen.getByText(/1,200 words ready/i)).toBeTruthy();
    expect(screen.getByText(/Starter words/i)).toBeTruthy();
    fireEvent.click(play);
    expect(baseProps.onPractice).toHaveBeenCalledTimes(1);
  });

  it("disables play and points to Settings when no words", () => {
    render(<Home {...baseProps} hasWords={false} wordCount={0} />);
    expect(screen.getByRole("button", { name: /letter scramble/i })).toBeDisabled();
    expect(screen.getByText(/settings/i)).toBeTruthy();
  });

  it("wires secondary tiles and change nickname", () => {
    render(<Home {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /leaderboard/i }));
    fireEvent.click(screen.getByRole("button", { name: /points by day/i }));
    fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));
    fireEvent.click(screen.getByRole("button", { name: /change nickname/i }));
    expect(baseProps.onLeaderboard).toHaveBeenCalled();
    expect(baseProps.onDailyPoints).toHaveBeenCalled();
    expect(baseProps.onSettings).toHaveBeenCalled();
    expect(baseProps.onChangeName).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — expect fail**

Run: `npm test -- src/screens/Home.test.tsx`

Expected: FAIL (missing greeting / play-card structure; nickname still shown as `h1` “Sam”, not “Hi, Sam”)

- [ ] **Step 3: Rewrite `Home.tsx` markup**

Replace the Home return with Quest Lobby structure (props types unchanged):

```tsx
return (
  <section className="panel home">
    <BrandMark />

    <header className="home-top">
      <p className="home-greeting">
        Hi, <span>{nickname}</span>
      </p>
      <div
        className="points-chip home-points"
        aria-label={`${points} points`}
      >
        <span>{points}</span>
        <small>points</small>
      </div>
    </header>

    <button
      type="button"
      className="play-card"
      disabled={!hasWords}
      onClick={onPractice}
      aria-label="Letter Scramble"
    >
      <span className="play-card-deco" aria-hidden="true">
        a · m · s · e
      </span>
      <span className="play-card-title">Letter Scramble</span>
      <span className="play-card-meta">
        {hasWords
          ? `${wordCount.toLocaleString()} words ready · ${listName}`
          : "Open Settings to import a word list"}
      </span>
      <span className="play-card-cta">{hasWords ? "Play" : "Need words"}</span>
    </button>

    <div className="home-tiles">
      <button type="button" className="home-tile" onClick={onLeaderboard}>
        Leaderboard
      </button>
      <button type="button" className="home-tile" onClick={onDailyPoints}>
        Points by day
      </button>
      <button type="button" className="home-tile" onClick={onSettings}>
        Settings
      </button>
    </div>

    <button type="button" className="linkish" onClick={onChangeName}>
      Change nickname
    </button>
  </section>
);
```

Remove the old `home-header` / `action-grid` / lede block.

- [ ] **Step 4: Run tests — expect pass**

Run: `npm test -- src/screens/Home.test.tsx`

Expected: PASS (all four tests)

- [ ] **Step 5: Commit** (only if the user asked)

```bash
git add src/screens/Home.tsx src/screens/Home.test.tsx
git commit -m "$(cat <<'EOF'
feat: rebuild Home as quest lobby markup

EOF
)"
```

---

### Task 2: Play card, tiles, and motion CSS

**Files:**
- Modify: `src/App.css`

**Interfaces:**
- Consumes: classes from Task 1 — `.home-top`, `.home-greeting`, `.home-points`, `.play-card`, `.play-card-deco`, `.play-card-title`, `.play-card-meta`, `.play-card-cta`, `.home-tiles`, `.home-tile`

- [ ] **Step 1: Replace / extend home header styles**

Near the existing `.home-header` / `.action-grid` / `.points-chip` rules in `src/App.css`:

1. Keep `.points-chip` base styles for reuse.
2. Add compact home chip + top bar:

```css
.home-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 0.35rem 0 1rem;
}

.home-greeting {
  margin: 0;
  color: var(--ink-soft);
  font-size: 1.05rem;
  font-weight: 700;
}

.home-greeting span {
  color: var(--ink);
}

.points-chip.home-points {
  min-width: 64px;
  padding: 0.4rem 0.55rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(244, 162, 89, 0.28);
}

.points-chip.home-points span {
  font-size: 1.25rem;
}

.points-chip.home-points small {
  font-size: 0.65rem;
}
```

3. Leave `.home-header` (still used by Practice) unchanged.

- [ ] **Step 2: Add play card + tiles + motion**

Append home-specific styles (do not remove shared `.btn` rules):

```css
.play-card {
  position: relative;
  display: grid;
  gap: 0.35rem;
  width: 100%;
  text-align: left;
  border: none;
  border-radius: 24px;
  padding: 1.35rem 1.25rem 1.2rem;
  margin-bottom: 1rem;
  color: #fff8f0;
  background: linear-gradient(145deg, var(--teal-deep), var(--teal) 48%, var(--mint));
  box-shadow: 0 16px 32px rgba(10, 106, 108, 0.28);
  cursor: pointer;
  overflow: hidden;
  animation: home-play-in 480ms ease-out both;
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}

.play-card:hover:not(:disabled),
.play-card:focus-visible:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 20px 36px rgba(10, 106, 108, 0.34);
}

.play-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.play-card-deco {
  font-family: "Baloo 2", "Nunito", system-ui, sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.75;
}

.play-card-title {
  font-family: "Baloo 2", "Nunito", system-ui, sans-serif;
  font-size: clamp(1.75rem, 5vw, 2.15rem);
  font-weight: 800;
  line-height: 1.05;
}

.play-card-meta {
  font-size: 0.95rem;
  opacity: 0.92;
  font-weight: 700;
}

.play-card-cta {
  margin-top: 0.55rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  background: rgba(255, 248, 240, 0.2);
  font-size: 1rem;
}

.home-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.home-tile {
  border: 2px solid rgba(22, 50, 79, 0.08);
  border-radius: 18px;
  padding: 0.95rem 0.65rem;
  background: rgba(255, 252, 247, 0.95);
  color: var(--teal-deep);
  font-size: 0.95rem;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(22, 50, 79, 0.06);
  animation: home-tile-in 420ms ease-out both;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.home-tile:nth-child(1) {
  animation-delay: 80ms;
}
.home-tile:nth-child(2) {
  animation-delay: 140ms;
}
.home-tile:nth-child(3) {
  animation-delay: 200ms;
}

.home-tile:hover,
.home-tile:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(22, 50, 79, 0.1);
}

@keyframes home-play-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes home-tile-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .home-tiles {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .play-card,
  .home-tile {
    animation: none;
  }

  .play-card:hover:not(:disabled),
  .play-card:focus-visible:not(:disabled),
  .home-tile:hover,
  .home-tile:focus-visible {
    transform: none;
  }
}
```

Remove unused `.action-grid` only if nothing else references it (grep first). Keep `.home-header` for Practice.

- [ ] **Step 3: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass; production build succeeds.

Manual check in the browser (`npm run dev`):

- Brand + `Hi, {name}` + compact points chip
- Large teal Play card; three equal tiles
- Empty list: Play disabled + Settings hint
- Motion present; with OS reduced-motion, no stagger/entrance

- [ ] **Step 4: Commit** (only if the user asked)

```bash
git add src/App.css
git commit -m "$(cat <<'EOF'
style: add quest lobby play card and tile motion

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| BrandMark hero-level | Task 1 |
| Soft greeting + corner points | Tasks 1–2 |
| Large Letter Scramble play card | Tasks 1–2 |
| Word count · list name / empty copy | Task 1 |
| Three equal secondary tiles | Tasks 1–2 |
| Change nickname link | Task 1 |
| Teal play card + lighter tiles | Task 2 |
| Medium motion + reduced-motion | Task 2 |
| Home-only scope | Global + both tasks |

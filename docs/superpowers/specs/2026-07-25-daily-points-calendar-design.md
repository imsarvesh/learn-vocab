# Daily Points Calendar — Design

Date: 2026-07-25  
App: Spell Quest (learn-vocab)

## Goal

Add a **Points by day** screen that shows the current player's earned points on a month calendar. Lifetime totals and the leaderboard stay as they are today.

## Decisions

| Topic | Choice |
| --- | --- |
| View style | Month calendar with points on each day |
| Whose points | Current nickname only |
| Existing totals | Keep lifetime total; calendar starts empty until new points are earned |
| Data approach | Daily totals map on each leaderboard entry |
| Day interaction | Display only — no drill-down |

## Data model

Extend `LeaderboardEntry`:

```ts
type LeaderboardEntry = {
  nickname: string;
  totalPoints: number;
  dailyPoints?: Record<string, number>; // "YYYY-MM-DD" → points that day
};
```

- Keys use local calendar dates (`YYYY-MM-DD`).
- Missing `dailyPoints` is treated as `{}` (backward compatible with existing localStorage).
- `addPoints(nickname, points)`:
  1. Increases `totalPoints` (unchanged behavior).
  2. Adds `points` to `dailyPoints[today]` for that nickname.
- Existing entries without daily history keep their lifetime total; the calendar shows blank until they earn points after this change.

### ScoreStore API additions

- `getDailyPoints(nickname: string): Record<string, number>`
- `getMonthTotal(nickname: string, year: number, month: number): number`  
  where `month` is **1-based** (January = 1).

## UI

### Entry

- New Home action button: **Points by day** (secondary style, alongside Leaderboard).
- New `AppView`: `"daily-points"`.

### Screen: `DailyPoints`

- Panel matching existing screens (brand, title, lede).
- Show current nickname and lifetime total.
- Month navigator: previous / current month label / next (default: current month).
- 7-column calendar (Sun–Sat):
  - Day number in each cell.
  - Points under the day when `> 0`; blank when `0`.
  - Today highlighted.
  - Days outside the viewed month muted / non-interactive.
- Footer line: **This month: N points**.
- **Back home** button (same pattern as Leaderboard).

### Styling

- Reuse `App.css` tokens and panel patterns; add calendar-specific classes only as needed.
- Stay consistent with Spell Quest’s existing warm/teal look — no new design system.

## App wiring

- `App.tsx` renders `DailyPoints` when `view === "daily-points"`.
- Daily data refreshes via the existing `pointsVersion` bump after `onEarnPoints`.
- Props: `nickname`, `totalPoints`, `dailyPoints` (full map for the nickname), `onBack`. The screen owns month navigation state and filters the map locally.

## Calendar helper

Small pure helper (e.g. `src/lib/calendar.ts`) to build month grid cells from year/month + daily map, so the screen stays thin and logic is unit-tested.

## Out of scope

- Per-day breakdown (rounds, words correct).
- Switching nickname on this screen.
- Shared / combined multi-player calendar.
- Migrating historical totals onto specific past dates.
- Server sync.

## Testing

- `scoreStore`: `addPoints` updates both total and today’s daily key; case-insensitive nickname match; legacy entries without `dailyPoints` still work.
- Calendar helper: correct grid length/padding; only in-month days carry points; month total sums correctly.
- No requirement for full React screen snapshot tests unless already common in the repo.

## Success criteria

1. After earning points in practice, today’s cell shows those points (and accumulates if you play again the same day).
2. Prev/next month navigation works; months with no data show an empty grid and “This month: 0 points”.
3. Home/Leaderboard lifetime totals remain correct for pre-existing scores.
4. Existing localStorage leaderboard data loads without migration errors.

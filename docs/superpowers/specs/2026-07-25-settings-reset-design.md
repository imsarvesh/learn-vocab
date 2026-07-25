# Settings — Reset Points & Word List — Design

Date: 2026-07-25  
App: Spell Quest (learn-vocab)

## Goal

Add a **Settings** screen where the current player can reset their own points or restore the built-in word list, with confirmation before each destructive action.

## Decisions

| Topic | Choice |
| --- | --- |
| Screen style | Dedicated Settings panel (same pattern as Leaderboard / Daily Points) |
| Reset points scope | Current nickname only (lifetime + daily calendar) |
| Reset word list | Restore built-in Oxford starter (`DEFAULT_WORD_LIST`); remove stored custom list |
| Safety | In-panel confirm before each reset; brief success banner after |

## Reset behavior

### Reset points

- Remove the leaderboard entry whose nickname matches the current player (case-insensitive).
- Clears that player’s `totalPoints` and `dailyPoints`.
- Other nicknames on the device are unchanged.
- After reset: Home points chip is `0`; Points by day calendar is empty for this player.

### Reset word list

- Remove the custom list from localStorage (`spellquest:wordList`).
- App state falls back to `DEFAULT_WORD_LIST` (Oxford starter).
- Does not affect scores or nickname.

### Confirmation

- Each action starts idle → user taps the danger button → section shows “Are you sure?” with **Cancel** and **Confirm**.
- Cancel returns to idle; Confirm runs the action, shows a short success message, then returns to idle.
- Only one confirm flow active at a time (optional but preferred).

## UI

### Entry

- Home action-grid button: **Settings** (secondary).
- New `AppView`: `"settings"`.

### Screen: `Settings`

- Brand, title “Settings”, short lede.
- Section **Your points**: explain that this clears lifetime and daily points for the current nickname only; button **Reset my points**.
- Section **Word list**: explain that this restores the starter list and removes any imported list; button **Reset word list**.
- Success banner area for post-action feedback.
- **Back home** button.

### Styling

- Reuse panel / button patterns in `App.css`.
- Danger actions: distinct from primary/secondary (e.g. coral/red outline or fill consistent with existing `--coral` / accent tokens if present).

## Data / API

### Score store

- Add `resetPoints(nickname: string): void` to `ScoreStore`.
- Implementation: filter out the matching entry and write remaining entries (or write `[]` if none left).
- No-op if nickname empty or not found.

### Word list storage

- Add `clearWordList(storage?: Storage): void` that removes `spellquest:wordList`.
- `App` after clear: `setWordListState(DEFAULT_WORD_LIST)` (or `getWordList()` which already falls back).

## App wiring

- `App.tsx` renders `Settings` when `view === "settings"`.
- Props: `nickname`, `onResetPoints`, `onResetWordList`, `onBack` (or callbacks that perform the store/storage work in App and pass simpler handlers).
- After points reset: bump `pointsVersion` so Home / Leaderboard / Daily Points refresh.
- After word list reset: update `wordList` state to the default list.

## Out of scope

- Resetting all players’ points
- Clearing the word list to empty
- Resetting nickname from Settings
- Export/backup before reset
- Undo after confirm

## Testing

- `scoreStore.resetPoints`: removes only matching nickname; leaves others; case-insensitive; safe when missing.
- `clearWordList`: removes storage key; `getWordList` returns default.
- No full React screen tests required unless already common in the repo.

## Success criteria

1. Settings is reachable from Home and returns via Back home.
2. Reset points zeros the current player only; calendar/daily map cleared for them.
3. Reset word list restores starter list name/count on Home.
4. Neither action runs without an explicit Confirm.

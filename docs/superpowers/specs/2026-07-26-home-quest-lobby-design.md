# Home Page Redesign — Quest Lobby

**Date:** 2026-07-26  
**Status:** Approved for planning  
**App:** Spell Quest (learn-vocab)  
**Scope:** Home screen only (`Home.tsx` + related CSS)

## Goal

Make Home feel like a kid-game lobby: playful hierarchy and medium motion, with **Letter Scramble** as the clear play action—not a flat settings-style button list.

## Decisions

| Topic | Choice |
|-------|--------|
| Direction | Quest Lobby (approach 1) |
| Tone | Kid-game / playful |
| Play hierarchy | Large Play card on top; three equal smaller tiles below |
| Identity | Soft “Hi, {nickname}”; small points chip in the corner |
| Motion | Medium: Play enters, tiles stagger, light hover bounce; honor `prefers-reduced-motion` |
| Palette | Keep existing warm paper + teal / coral / sun tokens |
| Out of scope | Other screens, new routes, new data, import button on Home |

## Layout (top → bottom)

1. **BrandMark** — Spell Quest stays hero-level (not demoted to nav-only).
2. **Top bar** — Left: soft greeting `Hi, {nickname}`. Right: compact points chip.
3. **Play card** — Large primary card:
   - Title: `Letter Scramble`
   - Supporting line when words exist: `{N} words ready · {listName}`; when empty: point player to Settings to import a list
   - Starts practice via existing `onPractice`
   - Disabled when `!hasWords`
4. **Secondary tile row** — Three equal tiles: Leaderboard, Points by day, Settings (same callbacks as today). Stack vertically on narrow viewports.
5. **Footer** — Quiet “Change nickname” link (`onChangeName`).

No new screens or props beyond what Home already needs for this layout (existing props are sufficient).

## Visual design

- Stay inside the current panel + app-shell glow background.
- **Play card:** Bold teal gradient, large type, generous tap target. Optional decorative jumbled letter glyphs (CSS/text only—no new image assets required).
- **Secondary tiles:** Lighter fills, smaller labels, equal size—lobby tiles, not a menu list.
- Points chip: Smaller than today’s header chip; corner accent, not a competing hero.

## Motion

| Element | Behavior |
|---------|----------|
| Play card | Short rise + fade on mount |
| Secondary tiles | Staggered fade-up (slight delay each) |
| Hover / press | Light lift on Play and tiles |
| `prefers-reduced-motion: reduce` | No stagger / entrance motion; static layout |

## Empty state

- Play card remains visible but **disabled**.
- Supporting text tells the player to open **Settings** to import a word list.
- Secondary tiles remain fully usable.

## Implementation notes

- Primary files: `src/screens/Home.tsx`, `src/App.css` (home-specific classes).
- Reuse existing button/tile patterns where possible; prefer semantic buttons for Play and tiles (accessibility: disabled state, labels).
- Do not change Practice, Settings, Welcome, or app routing beyond Home markup.

## Success criteria

- First glance reads as “play a spelling game,” not “pick from a settings menu.”
- Letter Scramble is unmistakably the main action.
- Nickname and points are present but soft.
- Motion feels lively on capable devices and calm when reduced-motion is on.
- Mobile and desktop: Play card full-width; tiles readable and tappable.

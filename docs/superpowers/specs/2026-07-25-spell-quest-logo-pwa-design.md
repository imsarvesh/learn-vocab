# Spell Quest Logo + PWA Design

**Date:** 2026-07-25  
**Status:** Approved for planning (pending user review of this doc)

## Goal

Give Spell Quest a distinctive app icon and make the Vite/React app a full offline-capable PWA that uses that icon for install, home screen, and browser chrome.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Logo type | Symbol only (no wordmark in the icon) |
| Motif | Magic letter: playful “S” + small spark |
| PWA scope | Full offline after first successful load/install |
| Implementation | `vite-plugin-pwa` + static icon assets |

## Logo

### Visual

- Rounded square tile suitable for iOS/Android home-screen masks.
- Fill: deep teal `#0a6a6c`, with a soft warm highlight so the tile isn’t flat.
- Center: bold white “S” (Baloo-like weight), slight tilt for energy.
- Accent: small 4-point spark in sun `#f4a259` / coral `#ef5d60` near top-right of the S.

### Deliverables

| Asset | Path (proposed) | Notes |
| --- | --- | --- |
| Source SVG | `public/logo.svg` | Editable source |
| PWA 192 | `public/pwa-192x192.png` | Any / maskable-friendly |
| PWA 512 | `public/pwa-512x512.png` | Any / maskable-friendly |
| Favicon | `public/favicon.svg` | Linked from `index.html` (SVG) |
| Apple touch | `public/apple-touch-icon.png` | 180×180 |

Maskable icons keep ~10–20% safe padding so OS masks don’t clip the S/spark.

### In-app use

Show the same mark (small) beside the “Spell Quest” brand text on Welcome/Home. No separate wordmark lockup required.

## PWA

### Plugin & registration

- Add `vite-plugin-pwa`.
- `registerType: "autoUpdate"` so new deploys replace cached assets without a stuck old SW.
- Register the service worker from the app entry (`main.tsx`) via the plugin’s virtual module.

### Manifest

- `name` / `short_name`: `Spell Quest`
- `display`: `standalone`
- `start_url`: `/`
- `theme_color`: `#0a6a6c` (deep teal, matches icon tile)
- `background_color`: `#fff8f0` (paper)
- Icons: 192 and 512 with both `any` and `maskable` purposes (same assets with safe padding, or dedicated maskable variants if needed)

### Offline behavior

- Precache all build outputs (HTML, hashed JS/CSS, and any static assets under `public/` that are referenced).
- Default Oxford word list is already bundled via Vite `?raw` into JS → available offline once the shell is cached.
- Scores / nickname / imported lists already use local storage → remain offline.
- Browser TTS is device-local when available; no server dependency assumed for speaking.

### HTML chrome

Update `index.html` with:

- Favicon / apple-touch-icon links
- `theme-color` meta
- Title remains `Spell Quest`

### Out of scope

- Push notifications
- Background sync
- Network-fetched user CSVs (file imports are local; no remote CSV caching)
- App Store / Play Store packaging

## Architecture sketch

```
public/logo.svg (+ PNG icons)
        │
        ▼
index.html (favicon, apple-touch, theme-color)
        │
vite.config.ts ── vite-plugin-pwa ──► dist/ + service worker + manifest
        │
main.tsx registers SW (autoUpdate)
        │
App UI shows logo mark next to brand
```

## Success criteria

1. Installable as a standalone app on mobile/desktop browsers that support PWAs.
2. After one online visit (or install), opening the app offline loads the shell and default word practice works.
3. Home-screen / install icon matches the magic-letter logo.
4. Favicon and in-app brand mark use the same artwork family.
5. Publishing a new build updates the cached app without requiring a manual SW unregister.

## Testing notes

- `npm run build` + `npm run preview` over HTTPS/localhost; verify Application → Manifest / Service Workers in DevTools.
- Offline checkbox: reload and confirm app shell + practice still work.
- Spot-check icon on a real device “Add to Home Screen” if available.

# Spell Quest Logo + PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a magic-letter “S” + spark logo and a full offline-capable PWA for Spell Quest that uses that icon.

**Architecture:** Static SVG/PNG icons live in `public/`. `vite-plugin-pwa` generates the web manifest and a service worker that precaches the production build (including the bundled Oxford word list). A small `BrandMark` React component shows the logo beside “Spell Quest” in the UI. Favicon / apple-touch / theme-color are wired in `index.html`.

**Tech Stack:** Vite 6, React 19, `vite-plugin-pwa`, static SVG + PNG assets, TypeScript.

## Global Constraints

- App name in UI/manifest: `Spell Quest`
- Icon motif: playful white “S” + spark on deep teal `#0a6a6c` tile
- Spark colors: sun `#f4a259` / coral `#ef5d60`
- Manifest `theme_color`: `#0a6a6c`; `background_color`: `#fff8f0`
- PWA: `registerType: "autoUpdate"`, `display: "standalone"`, full offline after first successful load
- Do not add push, background sync, or store packaging
- Prefer existing CSS variables / fonts; no new design system
- Commits only if the user explicitly asks (skip commit steps unless requested)

---

## File Structure

| File | Responsibility |
| --- | --- |
| `public/logo.svg` | Source logo (also usable as favicon) |
| `public/favicon.svg` | Same artwork (or copy/symlink of logo) for browser tab |
| `public/pwa-192x192.png` | Install / home-screen icon |
| `public/pwa-512x512.png` | Install / splash / maskable base |
| `public/apple-touch-icon.png` | 180×180 iOS home screen |
| `src/components/BrandMark.tsx` | Logo image + optional brand text |
| `src/components/BrandMark.test.tsx` | Renders mark + accessible label |
| `src/App.css` | `.brand-mark` layout styles |
| `index.html` | Favicon, apple-touch, theme-color |
| `vite.config.ts` | `VitePWA` plugin + manifest |
| `src/main.tsx` | Register service worker (`virtual:pwa-register`) |
| `src/vite-env.d.ts` | Types for `virtual:pwa-register` if needed |
| `package.json` | Add `vite-plugin-pwa` dependency |
| Screens (`Welcome`, `Home`, etc.) | Replace plain brand `<p>` with `<BrandMark />` |

---

### Task 1: Logo assets (SVG + PNGs)

**Files:**
- Create: `public/logo.svg`
- Create: `public/favicon.svg`
- Create: `public/pwa-192x192.png`
- Create: `public/pwa-512x512.png`
- Create: `public/apple-touch-icon.png`

**Interfaces:**
- Consumes: none
- Produces: static files at the paths above; logo is a rounded teal tile with white “S” + spark; maskable-safe padding (~15% inset)

- [ ] **Step 1: Create `public/logo.svg`**

Write an SVG ~512×512 viewBox with:
- Rounded rect fill `#0a6a6c` (rx ~22% of size for soft squircle)
- Soft warm highlight ellipse (low-opacity `#f4a259`) in upper-left
- White path/text “S” centered, slight rotate (~-8deg), bold weight
- 4-point spark near top-right of S using `#f4a259` and `#ef5d60`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Spell Quest">
  <!-- rounded tile, highlight, S, spark — keep ~15% safe margin from edges for maskable -->
</svg>
```

Fill in complete drawable paths (no placeholders). Prefer path geometry for the “S” so it does not depend on webfonts at render time.

- [ ] **Step 2: Copy logo to favicon**

```bash
cp public/logo.svg public/favicon.svg
```

- [ ] **Step 3: Rasterize PNGs on macOS with `sips` (or equivalent)**

If a high-res PNG master is needed first, render SVG → PNG via available tooling (e.g. open in browser + export, `qlmanage -t`, or a one-off Node/`sharp` script). Then:

```bash
# From a 512 master named public/icon-master.png (or directly from SVG render):
sips -z 512 512 public/icon-master.png --out public/pwa-512x512.png
sips -z 192 192 public/icon-master.png --out public/pwa-192x192.png
sips -z 180 180 public/icon-master.png --out public/apple-touch-icon.png
rm -f public/icon-master.png
```

Alternatively use the Cursor `GenerateImage` tool with a precise prompt matching the SVG colors/composition to produce `pwa-512x512.png`, then `sips` for 192 and 180. Keep SVG as the canonical source either way.

- [ ] **Step 4: Visually verify assets exist**

```bash
ls -la public/logo.svg public/favicon.svg public/pwa-192x192.png public/pwa-512x512.png public/apple-touch-icon.png
```

Expected: all five files present; PNGs non-zero size.

---

### Task 2: `BrandMark` component + screen wiring

**Files:**
- Create: `src/components/BrandMark.tsx`
- Create: `src/components/BrandMark.test.tsx`
- Modify: `src/App.css` (append brand-mark rules)
- Modify: `src/screens/Welcome.tsx`
- Modify: `src/screens/Home.tsx`
- Modify: `src/screens/Practice.tsx`
- Modify: `src/screens/Settings.tsx`
- Modify: `src/screens/DailyPoints.tsx`
- Modify: `src/screens/ImportWords.tsx`
- Modify: `src/screens/Leaderboard.tsx`

**Interfaces:**
- Consumes: `/logo.svg` from `public/`
- Produces: `BrandMark({ compact?: boolean })` → renders logo + “Spell Quest” text; `compact` maps to existing `.brand.compact` sizing

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("shows Spell Quest with the logo", () => {
    render(<BrandMark />);
    expect(screen.getByRole("img", { name: /spell quest/i })).toBeInTheDocument();
    expect(screen.getByText("Spell Quest")).toBeInTheDocument();
  });

  it("supports compact styling", () => {
    const { container } = render(<BrandMark compact />);
    expect(container.querySelector(".brand.compact")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- src/components/BrandMark.test.tsx
```

Expected: FAIL (module not found / BrandMark undefined).

- [ ] **Step 3: Implement `BrandMark`**

```tsx
type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <p className={compact ? "brand brand-mark compact" : "brand brand-mark"}>
      <img src="/logo.svg" alt="Spell Quest" width={28} height={28} />
      <span>Spell Quest</span>
    </p>
  );
}
```

- [ ] **Step 4: Add CSS**

Append to `src/App.css`:

```css
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.brand-mark img {
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 0.4rem;
  flex-shrink: 0;
}

.brand-mark.compact img {
  width: 1.25rem;
  height: 1.25rem;
}
```

- [ ] **Step 5: Replace brand paragraphs in all screens**

Replace `<p className="brand">Spell Quest</p>` with `<BrandMark />` and `<p className="brand compact">Spell Quest</p>` with `<BrandMark compact />`. Add:

```tsx
import { BrandMark } from "../components/BrandMark";
```

(Use `./components/BrandMark` only if a screen lived under `src/`; screens are under `src/screens/` so path is `../components/BrandMark`.)

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test -- src/components/BrandMark.test.tsx
npm test
```

Expected: BrandMark tests PASS; full suite PASS.

---

### Task 3: HTML chrome (favicon + theme)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `public/favicon.svg`, `public/apple-touch-icon.png`
- Produces: browser tab icon + iOS touch icon + theme-color meta

- [ ] **Step 1: Update `index.html` `<head>`**

Inside `<head>`, after viewport meta, add:

```html
    <meta name="theme-color" content="#0a6a6c" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

Keep existing title `Spell Quest` and Google Fonts links.

- [ ] **Step 2: Smoke-check in dev**

```bash
npm run dev
```

Open the app; confirm tab shows the favicon and brand mark appears on Welcome/Home.

---

### Task 4: Install and configure `vite-plugin-pwa`

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`
- Modify: `src/vite-env.d.ts` (reference types)

**Interfaces:**
- Consumes: PNG icons in `public/`
- Produces: generated `manifest.webmanifest` + service worker in `dist/`; `registerSW` from `virtual:pwa-register`

- [ ] **Step 1: Install dependency**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Update `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "logo.svg"],
      manifest: {
        name: "Spell Quest",
        short_name: "Spell Quest",
        description: "Practice spelling with meanings, scrambles, and daily points.",
        theme_color: "#0a6a6c",
        background_color: "#fff8f0",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,csv}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

Note: Google Fonts remain network-loaded; app UI still works offline with system fallback fonts. Do not block ship on offline fonts.

- [ ] **Step 3: Register SW in `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Ensure Vite client types include PWA virtual module**

In `src/vite-env.d.ts`, ensure:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

- [ ] **Step 5: Typecheck + unit tests**

```bash
npm run build
npm test
```

Expected: build succeeds; `dist/` contains SW + manifest; tests PASS.

---

### Task 5: Offline / PWA verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: production build from Task 4
- Produces: confirmation that success criteria from the design spec are met

- [ ] **Step 1: Preview production build**

```bash
npm run build && npm run preview
```

- [ ] **Step 2: DevTools checks**

In Chrome DevTools → Application:
- Manifest shows name Spell Quest, icons 192/512, theme `#0a6a6c`
- Service worker status: activated
- Cache storage lists precached assets

- [ ] **Step 3: Offline check**

Enable Network → Offline, reload. Expected: app shell loads; Welcome/Home reachable; default word practice still works (word list is in the JS bundle).

- [ ] **Step 4: Confirm success criteria**

1. Installable (manifest + SW present)
2. Offline shell + default practice works
3. Icons match magic-letter logo
4. Favicon + in-app BrandMark match
5. `autoUpdate` configured (no manual unregister required for future deploys)

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Magic letter S + spark logo SVG/PNGs | Task 1 |
| Favicon + apple-touch + theme-color | Task 3 |
| In-app brand mark | Task 2 |
| `vite-plugin-pwa` + autoUpdate | Task 4 |
| Manifest name/colors/icons/standalone | Task 4 |
| Full offline precache (bundled words) | Task 4–5 |
| Out of scope items not implemented | — |

## Placeholder / consistency self-review

- No TBD steps; SVG must be completed with real paths in Task 1 Step 1.
- Theme colors locked to `#0a6a6c` / `#fff8f0` everywhere.
- `BrandMark` API is `compact?: boolean` consistently.
- Commit steps omitted per user git rule unless user requests commits.

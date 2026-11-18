# Insure Universe — Architecture

## Stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Lucide icons. No backend.

## Layers (dependencies point downward only)

```
ui/        HUD screens and panels (React)            ── reads store, renders
world/     The miniature district (sprites + SVG ground) ── reads store, renders
store/     Zustand: game state + UI state (selection, toasts)
game/      Pure TypeScript domain: types, config, data, selectors, narrative
assets/    Sprite registry (sprites.json is generated)
```

- `game/` has **no React, no DOM**. The Phase 4 simulation engine goes here and must stay deterministic (seeded RNG, same input → same output) so it can be unit-tested.
- `game/narrative/` (AI Advisor text) only *reads* state. It never changes numbers. An LLM can replace it later without touching calculations.
- The 10 business modules (`game/data/modules.ts`) are not pages. Each one is attached to a place in the world (`game/data/locations.ts`).

## World rendering
- Sprites are 2.5D art with a fixed camera, so the world is a 2D axonometric scene rather than a free 3D camera.
- `world/projection.ts` maps ground grid (u, v) → screen px at the house camera (24° both axes). The art is checked against it with `tools/angle_check.py`.
- Buildings are anchored at the front corner of their plinth (measured into `sprites.json`), so their footprints line up with the road grid.
- `world/layout.ts` is pure data: where every building, tree, lamp, person and road sits. To move things, edit the numbers.
- Depth: each sprite's `z-index` = screen y of its base.
- Clicking uses pixel-accurate alpha hit-testing (`world/hitTest.ts`), so transparent corners never steal a click.
- Camera: CSS transform (pan / zoom / fly-to). Labels counter-scale through `--inv-scale` so they stay readable at any zoom.

## Screens
`App.tsx` routes `ui.screen`: **cover** (title art + loading bar while `assets/preload.ts` loads every sprite and the font → Start → mode modal; world not mounted) → **command** (Command Center) ↔ **decision** (Decision Room). The world renders once and the screens are HUD layers over it.

## HUD
A fixed 1600×900 stage (`ui/Stage.tsx`) scaled to fit the window. Layout stays consistent on any 16:9 desktop. The world fills the whole window behind it.

## Design tokens
- UI: `src/styles/index.css` (`@theme`: colours, radius, shadows, easing; utilities `glass`, `glass-dark`, `pill-navy`, `btn-gold`).
- World ground palette: `src/design/tokens.ts`.
- Font: Prompt (bundled through @fontsource, works offline).

## Adding the next screens
Quarterly Review (Phase 4) plugs into the `App.tsx` router like the Decision Room. It shares the store and the `ui/` primitives.

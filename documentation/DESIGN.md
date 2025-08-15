# DESIGN — Styling, Material 3 (Expressive), and mobile strategy

Last updated: 2025-08-15

This document captures the styling decisions, file layout, and concrete steps we applied to make the Time Forge mobile app behave like a one-page, left/right-swipable app with no vertical scroll.

Goals
- Make the mobile app fit the viewport without vertical scrolling (single-page flow where each view is a horizontally-arranged panel).
- Remove accidental horizontal overflow and "everything is huge" problems on Android WebView.
- Use Angular Material 3 (MDC) Expressive density to compact the UI and match mobile ergonomics.
- Keep a small entrypoint `styles.scss` and split the rest into modular partials for clarity.

Repository changes
- New styles partials (imported by `apps/time-tracker/src/styles.scss`):
  - `styles/_variables.scss` — CSS variables / design tokens (dvh, type scale, spacing, colors)
  - `styles/_base.scss` — resets, box-sizing, media constraints, small helpers
  - `styles/_mobile.scss` — Android / small-screen tweaks (temporary overflow guard, container queries)
  - `styles/_web.scss` — web/desktop specific overrides and larger layout rules
  - `styles/_material.scss` — Angular Material density helper (toggleable)
  - `styles/_legacy.scss` — snapshot of the pre-refactor file for reference

Why this structure
- Keeps the top-level `styles.scss` tiny and readable.
- Allows mobile-first rules to live in `_mobile.scss`, while the web has its own overrides — easier to reason about platform differences.
- Material density and theming ideally belong in your theme file; `_material.scss` provides a guarded example you can enable or move into your central theme.

Four major changes in MD3 Expressive (Material 3 -> how we map them)
1) Density controls (compactness)
   - MD3 Expressive exposes a density theme token. We set density to -2 for buttons, form-fields, lists, tables and chips.
   - How we apply: use the density snippet in `_material.scss` or in your global theme file. This reduces padding and overall footprint so the mobile UI appears tighter.

2) Typography system changes
   - Expressive MD3 emphasizes flexible typography and token-driven type scales.
   - How we apply: use clamp() variables in `_variables.scss` (`--step-0`, `--metrics`) and prefer rem-based spacing so typography and layout scale together.

3) Elevation & color harmonies
   - MD3 encourages expressive surfaces and subtle elevation.
   - How we apply: keep a small palette in `--primary`, `--surface`, and use Material theme palettes for production. Use subtle backdrop-filter / blur in indicators only on high-performance devices.

4) Component composition and container-based layout
   - Use container queries instead of only viewport media queries for cards and toolbars.
   - How we apply: `_mobile.scss` and `_base.scss` contain `container-type: inline-size;` and examples of `@container` rules for toolbars/buttons.

Practical steps applied for mobile
1) Viewport & safe areas
- Added `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` to `index.html`.
- Use `--page-min: 100dvh` and `.page { height: var(--page-min) }` to ensure panels fill the view including safe areas.

2) Kill horizontal overflow
- Global box-sizing reset and `img,video,canvas,svg { max-width:100% }`.
- Debug helper `html,body{overflow-x:hidden}` is present in `_mobile.scss` but should be removed after the real offender is fixed.
- Avoid `width:100vw` inside padded parents — prefer `width:100%`.

3) Tame font & component sizing
- Fluid type via clamp() in `_variables.scss`.
- Prefer rem/em for spacing and token-driven sizes.

4) Container queries
- Use `container-type` on `.section` and `@container` rules in `_mobile.scss` to adapt toolbars/buttons.

How to enable Angular Material density (copy into your theme)

@use '@angular/material' as mat;

$my-density: (
    mat.button-density: -2,
    mat.form-field-density: -2,
    mat.list-density: -2,
    mat.table-density: -2,
    mat.chips-density: -2,
);

$my-theme: mat.define-theme((
    color: mat.$indigo-palette,
    typography: mat.define-typography-config(),
    density: $my-density
));

@include mat.all-component-themes($my-theme);

Notes & testing
- For fast CSS iteration: run the Angular dev server and use adb reverse + Capacitor server.url to hot-reload directly on device. Inspect with chrome://inspect.
- Use container-query debugging + "scroll containers" in DevTools to hunt overflow.
- After verifying fixes, remove `overflow-x: hidden` and delete `_legacy.scss` when confident.

Next steps
- If you want I can enable the density snippet in your real theme file (paste it or point me to it), and I can tighten specific screens (e.g., `home.component.scss`) with before/after patches.
- I can also add unit-ish visual tests (snapshot-ish CSS checks) or a small Playwright test that loads the app in a mobile viewport and captures the layout for review.


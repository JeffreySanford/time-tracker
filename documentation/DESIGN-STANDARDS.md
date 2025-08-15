# Design Standards — Time Forge

Last updated: 2025-08-15

## Purpose

- Centralize visual tokens and responsive behavior for Time Forge UI.

Typography

- Use rem/em units for font sizing. Base font-size is set in `apps/time-tracker/src/styles/_variables.scss`.
- Expose named variables in `apps/time-tracker/src/styles/_home-helpers.scss`:
  - `--font-small`, `--font-medium`, `--font-large`, `--font-xlarge`, `--font-xxlarge`.
- Always use `var(--font-..., fallback)` in component SCSS to provide safe fallbacks during migration.
- Mobile overrides are provided with `@media (max-width: 48em)` to reduce sizes.

Icons

- Project icons and other UI icons use em-based sizing; default `3em` and halved to `1.5em` on mobile.

Layout

- Use the two-section 30% / 70% layout via CSS variables: `--split-a: 30%`, `--split-b: 70%`.
- Apply the layout via utility class `.split-30-70`.

Component structure

- Home uses a single responsive component approach with CSS media queries to adapt to different screen sizes.
- The main `HomeComponent` handles all logic and rendering for the home view.

Styling folder structure

- Keep shared vars and helpers in `apps/time-tracker/src/styles/` (e.g., `_home-helpers.scss`, `_variables.scss`, `_mobile.scss`).
- Create subfolders for feature-specific partials if a component grows large (e.g., `styles/home/typography.scss`).

HTML/TS simplification rules

- Prefer simple, declarative templates with clear structure.
- Keep heavy logic in component classes and services.
- Use `ngIf` for conditional rendering of UI elements based on state.

Accessibility

- Interactive elements must be focusable and include keyboard handlers. Use `button` or set `tabindex="0"` and `keydown.enter` listeners for non-button elements.

Migration notes

- Replace `font-size` literals with `var()` fallbacks incrementally.
- Preserve existing behavior; add new components and wire them in `AppModule` before removing legacy markup.

Example

- See `apps/time-tracker/src/app/home/home-container.component.ts` and `apps/time-tracker/src/app/home/variants/*` for the reference implementation.

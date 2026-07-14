# design-sync notes

- This repo is an Angular 21 application (not a React design system). No Storybook, no library `dist/`. The standard converter (`package-build.mjs` / storybook harness) does not apply.
- 2026-07-14: user chose a **styles & tokens only** sync — no component bundle (`_ds_bundle.js`), no `components/` tree, no `_vendor/`. The uploaded layout is `styles.css` (+ its `@import` closure: `tokens/`, `fonts/`), `README.md` with the conventions header.
- `_ds_sync.json` is deliberately omitted: the layout is hand-authored, not converter-built, so there is no honest hash recipe. A future sync has no anchor and rebuilds/re-verifies everything — expected.
- Global styles source of truth: `src/styles.scss` (tokens live in its `:root` block). Brand SCSS vars in `src/assets/styles/variables.scss`. Compile SCSS with `npx sass` — the repo has sass available transitively via `@angular/build`.
- The Angular Material prebuilt theme (`azure-blue.css`) and the `.mat-*`/`.mdc-*` override rules from `src/styles.scss` are excluded from the upload: the design runtime has no Angular Material DOM, so those selectors can never match; shipping them would only bloat the closure.
- Fonts are Google-hosted in the app (`src/index.html`); the sync self-hosts woff2 copies under `fonts/` with `@font-face` in `fonts/fonts.css` because rendered designs only receive `styles.css`'s import closure.
- If a future run should sync actual components, the viable route is wrapping standalone components as custom elements via `@angular/elements` (not currently a dependency).
- Deliberate deviations from `src/styles.scss` in the uploaded `styles.css`: `body` background is `var(--appBg)` (source uses `#6b6b6b` as the resume page frame, but every app screen re-sets the body to `--appBg` via `body:has(...)` rules that need app page classes); `.primary-button`/`.secondary-button` were distilled out of their Angular Material selector chains into standalone classes; `.delete-button` was hoisted out of its `.data-platform-funnels` scope. Declarations themselves are the repo's own.
- Google serves Roboto v51 as one variable woff2 for all weights (300–700) — stored as `fonts/Roboto-var.woff2`, referenced by four @font-face blocks. Latin subsets only (covers å/ä/ö via U+00C0-00FF range in the latin subset).
- The icomoon CDN stylesheet (`cdn.icomoon.io/.../TriggerbeeClient/style.css` in index.html) was NOT synced — app-specific icon font behind a third-party CDN.
- `ds-bundle/` is the local build output (gitignored).

# ADR-0002: Distribution as one self-contained HTML file in a committed folder

- **Status:** Accepted
- **Date:** 2026-10-24, updated 2026-11-01 (committed `Stammbaum/` folder instead of a release zip)
- **Requirements:** GEN-01, GEN-03, GEN-04, PRIV-01

## Context

Users double-click a file. Browsers opening a page from `file://` refuse to load separate JavaScript
modules (a security rule), so a normal multi-file web build would not work offline from a folder.

## Decision

- `vite-plugin-singlefile` inlines all JavaScript and CSS into **`dist/Stammbaum.html`**.
  Images used by the app's own UI are inlined as `data:` URLs or as SVG.
- `npm run release` copies the build into the committed **`Stammbaum/`** folder at the repo root: `Stammbaum.html`,
  the guides as `.txt`, `LICENSES.txt` (MIT licences of the app and the bundled libraries, GEN-08) and the example
  project `Beispiel.stammbaum`. It runs only when a version is released, so the folder always holds a released,
  tested version. Visitors of the repo download `Stammbaum.html` from there without cloning; whoever emails the app
  zips the folder.
- `dist/` stays the git-ignored build output. Every build and every test run writes it, so it can't be committed
  without making git show changes after each test run.
- `scripts/check-no-external-refs.mjs` fails the build if the HTML references any external resource.

## Consequences

- There is no code splitting. The whole app loads at once, which is fine for this size.
- The user's family data is **not** in this file. It lives in separate `*.stammbaum` project files (see the concept).
- A read-only website version (FUT-01) can reuse the same build.

## Alternatives considered

- **Generated release zip** (`release/Stammbaum-<version>.zip`, until 2026-11-01): not downloadable from the
  repo, and a binary per version doesn't belong in git. The folder is simpler and the user can still zip it.

- **Folder with index.html + assets**: breaks on `file://` (ES modules / CORS).
- **Tiny local web server shipped with the app**: needs an executable per OS and gets flagged by antivirus software and mail filters.

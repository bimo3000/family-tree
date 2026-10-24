# ADR-0002: Distribution as one self-contained HTML file in a zip

- **Status:** Accepted
- **Date:** 2026-10-24
- **Requirements:** GEN-01, GEN-03, GEN-04, PRIV-01

## Context

Users double-click a file. Browsers opening a page from `file://` refuse to load separate JavaScript
modules (a security rule), so a normal multi-file web build would not work offline from a folder.

## Decision

- `vite-plugin-singlefile` inlines all JavaScript and CSS into **`dist/Stammbaum.html`**.
  Images used by the app's own UI are inlined as `data:` URLs or as SVG.
- `npm run package` builds `release/Stammbaum-<version>.zip` with a `Stammbaum/` folder that contains
  `Stammbaum.html`, `Anleitung.txt` (German guide) and the example project.
  The zip writer is dependency-free (`scripts/lib/zip.mjs`, Node's zlib).
- `scripts/check-no-external-refs.mjs` fails the build if the HTML references any external resource.

## Consequences

- There is no code splitting. The whole app loads at once, which is fine for this size.
- The user's family data is **not** in this file. It lives in separate `*.stammbaum` project files (see the concept).
- A read-only website version (FUT-01) can reuse the same build.

## Alternatives considered

- **Folder with index.html + assets**: breaks on `file://` (ES modules / CORS).
- **Tiny local web server shipped with the app**: needs an executable per OS and gets flagged by antivirus software and mail filters.

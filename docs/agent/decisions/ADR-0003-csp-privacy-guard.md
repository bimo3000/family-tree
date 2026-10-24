# ADR-0003: Content-Security-Policy as a hard privacy guard

- **Status:** Accepted
- **Date:** 2026-10-24
- **Requirements:** PRIV-01, PRIV-02

## Context

Family data is confidential. "We don't send anything" should not depend on every line of code (and every
dependency) behaving well. It should be **enforced by the browser**.

## Decision

The production build injects a `Content-Security-Policy` meta tag (see `CSP` in `vite.config.ts`):
`default-src 'none'`, `connect-src 'none'` (no fetch/XHR/WebSocket), no external scripts, styles, fonts,
frames or form targets. Images only from `data:` and `blob:` (pictures loaded from the project file).

It is backed up by three layers:

1. ESLint forbids network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, …) in `src/`.
2. The build fails on unexpected external URLs (`scripts/check-no-external-refs.mjs`).
3. Every E2E test fails on any network request. One test proves that the CSP really blocks `fetch`.

## Consequences

- `script-src 'unsafe-inline'` is required because the app _is_ an inline script. This is acceptable because
  no external or user-provided HTML is ever executed. User text is always rendered as text, never as HTML,
  and the `{@html}` Svelte tag is forbidden for user data.
- The CSP only applies to the built file. The dev server (`npm run dev`) needs a websocket for live reload.
- Downloading a saved project (`<a download>` with a `blob:` URL) is not affected by the CSP.

## Alternatives considered

- **Hash-based `script-src`**: slightly stronger, but fragile with the single-file plugin. Revisit if the app ever renders foreign HTML.

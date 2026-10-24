# ADR-0004: Testing strategy – Vitest + Playwright (3 engines) + pre-push hook

- **Status:** Accepted
- **Date:** 2026-10-24
- **Requirements:** DEV-04, DEV-05, GEN-02, PRIV-02

## Context

Agents change code across many sessions without remembering earlier ones, so regressions must be caught
automatically and early. The app must work in Chrome/Edge, Firefox and Safari, opened from `file://`.

## Decision

- **Unit tests (Vitest, `tests/unit/`)** cover all pure logic in `src/core/` (model, dates, layout, migrations)
  and the build scripts. They are fast and run on every change.
- **E2E tests (Playwright, `tests/e2e/`)** run against the **built** `dist/Stammbaum.html` via `file://`, the way users
  start it, in **Chromium, Firefox and WebKit** (Safari's engine). The shared `app` fixture fails a test on any
  network request or console error.
- **`npm run verify`** runs typecheck → lint/format → unit → build (with external-reference scan) → E2E.
- **`.githooks/pre-push`** runs `npm run verify` and blocks the push on failure. `npm install` activates it via the
  `prepare` script (`core.hooksPath`). No husky dependency.
- No CI for now (user decision). Possible later as FUT-04.

## Consequences

- A push takes ~25 s longer. That is accepted in exchange for never pushing a broken state.
- WebKit on Linux approximates Safari but isn't identical. Occasional manual checks on a real Mac remain useful.
- Real-file dialogs (File System Access API pickers) cannot be fully automated. Storage logic sits behind
  adapters, so it can be tested with fakes, and pickers get a documented manual check.

## Alternatives considered

- **Jest**: slower and awkward with ESM/Vite. Vitest shares Vite's config.
- **Cypress**: no WebKit support.

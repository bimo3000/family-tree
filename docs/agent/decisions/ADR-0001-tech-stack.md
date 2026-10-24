# ADR-0001: Tech stack – Svelte 5 + TypeScript + Vite

- **Status:** Accepted
- **Date:** 2026-10-24
- **Requirements:** GEN-01, GEN-04, DEV-04

## Context

The app has to be one offline HTML file without end-user dependencies, yet it will grow into a
non-trivial interactive application (tree rendering, forms, file handling). Agents in reset sessions
maintain it, so mistakes must surface early and the code must be easy to read.

## Decision

- **TypeScript** (strict). The compiler catches whole classes of bugs before a test even runs.
- **Svelte 5** for the UI. It compiles to small plain JavaScript, has little boilerplate, and its
  components read almost like HTML, so both agents and the human developer can follow them.
- **Vite** as the build tool and dev server (fast live reload while developing).
- The dev tooling runs on Node.js (installed via nvm on the dev machine only, version in `.nvmrc`).
- All dependencies are **pinned to exact versions** (`.npmrc: save-exact`). New versions are adopted
  deliberately, preferring releases that are at least ~2 weeks old (supply-chain caution).
- TypeScript stays on 6.0.x until `svelte-check` and `typescript-eslint` support TS 7.

## Consequences

- Developers need Node.js; end users don't (see ADR-0002).
- The build step is mandatory. Raw source files are never shipped.

## Alternatives considered

- **No build step (plain JS)**: rejected by the user in favour of type checking and proper tests.
- **React / Preact**: equally viable, but more boilerplate and a larger output for this app size.
- **Electron / Tauri desktop app**: big, platform-specific downloads that don't fit "zip it and email it".

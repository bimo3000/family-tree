# Architecture Decision Records (ADRs)

An ADR records **one important decision**: the situation, what was decided, why, and what follows from it.
Future sessions read these instead of re-discussing settled questions. To revisit a decision, write a new ADR
that supersedes the old one. Don't silently edit history.

Template: copy [ADR-0000-template.md](ADR-0000-template.md). Number sequentially. Status is one of
`Proposed`, `Accepted`, `Superseded by ADR-NNNN`.

| ADR                                          | Title                                                             | Status   |
| -------------------------------------------- | ----------------------------------------------------------------- | -------- |
| [0001](ADR-0001-tech-stack.md)               | Tech stack: Svelte 5 + TypeScript + Vite                          | Accepted |
| [0002](ADR-0002-single-file-distribution.md) | Distribution as one self-contained HTML file in a zip             | Accepted |
| [0003](ADR-0003-csp-privacy-guard.md)        | Content-Security-Policy as a hard privacy guard                   | Accepted |
| [0004](ADR-0004-testing-strategy.md)         | Testing strategy: Vitest + Playwright (3 engines) + pre-push hook | Accepted |

# Architecture Decision Records (ADRs)

An ADR records **one important decision**: the situation, what was decided, why, and what follows from it.
Future sessions read these instead of re-discussing settled questions. To revisit a decision, write a new ADR
that supersedes the old one. Don't silently edit history.

Template: copy [ADR-0000-template.md](ADR-0000-template.md). Number sequentially. Status is one of
`Proposed`, `Accepted`, `Superseded by ADR-NNNN`.

| ADR                                                       | Title                                                             | Status   |
| --------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| [0001](ADR-0001-tech-stack.md)                            | Tech stack: Svelte 5 + TypeScript + Vite                          | Accepted |
| [0002](ADR-0002-single-file-distribution.md)              | Distribution as one self-contained HTML file in a zip             | Accepted |
| [0003](ADR-0003-csp-privacy-guard.md)                     | Content-Security-Policy as a hard privacy guard                   | Accepted |
| [0004](ADR-0004-testing-strategy.md)                      | Testing strategy: Vitest + Playwright (3 engines) + pre-push hook | Accepted |
| [0005](ADR-0005-storage-project-file-and-working-copy.md) | Storage: `.stammbaum` zip file + browser working copy             | Accepted |
| [0006](ADR-0006-custom-tree-layout.md)                    | Own tree-layout algorithm in core, rendered as SVG                | Proposed |
| [0007](ADR-0007-relations-as-links.md)                    | Relations stored as partnerships + parent-child links             | Proposed |

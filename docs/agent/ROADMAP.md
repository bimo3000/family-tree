# Roadmap – functional development in slices

> The plan for building the app. Agents work through it **autonomously**, one slice at a time, with the skill
> [`next-slice`](../../.claude/skills/next-slice/SKILL.md). The requirements stay the contract; this file only orders the work.
> **Keep it current:** update the status column, and adjust the slices when the direction changes (see the change log).

A **slice** is one complete, tested piece of the app that works on its own, like finishing one room before starting the next.
Each slice ends green (`npm run verify`), committed, pushed, with requirement statuses updated and the user told what to try next.

## Overview

| #   | Slice                         | Status | Main requirements                                       |
| --- | ----------------------------- | ------ | ------------------------------------------------------- |
| S1  | Core model, dates, operations | Done   | PERS-01/02/06/07, TREE-03, DATA-01/05/08                |
| S2  | Automatic tree layout         | Done   | TREE-01/03/04/05 (ADR-0006)                             |
| S3  | Tree view (read-only)         | Todo   | TREE-02, PERS-04/05, GEN-05/06, UI-04                   |
| S4  | Editing + working copy        | Todo   | PERS-01/03, UI-01, DATA-03 (working copy)               |
| S5  | Project files and pictures    | Todo   | DATA-02/03/04/07/09, PERS-03, UI-02                     |
| S6  | Finish and release            | Todo   | UI-03, DATA-06, GEN-01/03/04, user guide, manual checks |

Status values: `Todo` → `In progress` → `Done`. Only one slice is `In progress` at a time.

## Sources of truth for every slice

- What to build: `docs/requirements/REQUIREMENTS.md`. How it behaves: `docs/concept/ui-concept.md`, `data-model.md`, `architecture.md`.
- How it looks and feels: **`mockups/index.html`** (open it, click through it). Port its colours from `mockups/shared/style.css`.
- Reusable mock-up logic to port to TypeScript (with tests): `parseDate`/`fmtDate`/`dateHint`, the wording helpers
  (`parentWord`, `childWord`, `partnerWord`), sibling detection, `focusSet`, `component()` (cut-off check), the edge drawing rules.

## S1 – Core model, dates, operations (`src/core/`)

- Types per `data-model.md`: project, person, partnership, parent-child link, flexible date, event, placeholder person.
- Flexible dates: parse German input, a sort key, and the interpreted value (data-model §4). **Parsing** German input is core's job;
  **display strings** ("ca. 1850", "1890 bis 1895", "→ ungefähr 1850") belong to `src/ui/` (architecture §2: German texts only in ui).
- Pure operations that return a new project: add/update/delete person, add/update/remove partnership, add/update-kind/remove
  parent-child link, create an unknown-parent placeholder, drop placeholders without children.
- Validation: no loops, at most two biological parents, no self-partnership, no duplicate partnership or link.
- Queries: parents, children, partners (ordered by start date), siblings (full/half), ancestors + descendants (focus line),
  connected component (for the "cut off" warning, ui-concept §2.8).
- Serialization: JSON with `schemaVersion` 1 and a migration registry (DATA-05, DATA-08), roundtrip-tested.
- Port the fictional "Familie Brandt" from `mockups/shared/familie.js` into `tests/fixtures/` (without `x`/`row`).
- **Done when:** every operation and rule has unit tests, `npm run verify` is green. ✅ Done in session 3.

## S2 – Automatic tree layout (`src/core/layout/`, ADR-0006)

- Input: project + card sizes. Output: card positions and line geometry (couple lines, child connectors, dashed, divorce mark).
- Steps: generations → family units → ordering (birth order, fewer crossings) → coordinates. Recomputed fully on every change.
- Must handle: several partners, extra non-biological parents (own dashed line), divorced couples (wider gap for "//"),
  the small "?" node, disconnected parts side by side, cousin marriages (no crash, long line allowed).
- Fixture families + invariant tests: no overlaps, parents above children, partners adjacent, deterministic, 100 persons fast.
- Hardest slice. Start it in a **fresh session**. When it works, set ADR-0006 to Accepted.
- ✅ Done in session 4. `computeLayout(project)` in `src/core/layout/`; how it works and the decisions taken: ADR-0006.

## S3 – Tree view, read-only (`src/ui/`)

- App shell (top bar with project name, undo/redo, save status), SVG tree with pan/zoom/fit/double-click centre/Esc,
  person cards (big photo, neutral colours), hover tooltip, selection + highlighted line, detail panel with "Familie" groups.
- German display helpers (dates, Mutter/Vater/Elternteil, …) in `src/ui/`, unit-tested.
- E2E: built app via `file://`, show the example, select a person, check the panel. The agent looks at screenshots itself.
- **Ask the user first:** how "Beispiel ansehen" gets its data (see "Decisions to raise").
- Draw only what `computeLayout` returns: cards by centre, couple lines as polylines (the "//" goes at `middle` when
  `ended` is set), child lines as `stems` plus one `drop` per child (highlight the focused child's drop only).
- At the end, ask the user to try it: `npm run build`, then double-click `dist/Stammbaum.html`.

## S4 – Editing + working copy

- `src/ui/state/`: open project, selection, undo/redo (UI-01), dirty status. Every change goes through a core operation.
- Person dialog (ui-concept §2.5), add-relative flows (§2.6), delete (§2.7), relation edit/remove with the cut-off dialog (§2.8).
- `deletePerson` (core) does not touch `images` or `view.focusPersonId`: clear the focus in state when the focused person goes.
- Working copy in IndexedDB with autosave, reopened on start, so edits survive a reload (DATA-03, architecture §3).
- E2E for the main flows in all three engines.

## S5 – Project files and pictures (`src/storage/`, ADR-0005)

- Add fflate (pinned exact, note in ADR-0005). `.stammbaum` zip with `data.json` + `bilder/`: open (picker, drag & drop), save.
- Saving per DATA-09: Chromium writes into the file (File System Access), Firefox/Safari download with a one-time hint.
- Start screen (new, open, example), several projects (DATA-02), last project on start (DATA-03).
- Save status and backup reminder (UI-02). Remove an image from `images` when its person is deleted or the photo is replaced. Photos: one per person, downscaled to 2000 px JPEG (DATA-07, PERS-03).
- E2E: save/open roundtrip in every engine.

## S6 – Finish and release

- Print / save as image or PDF (UI-03). In-app help and first-use hints (ui-concept §7).
- `examples/Beispiel.stammbaum` (DATA-06), German user guide `docs/user-guide/Anleitung.md`, release zip (skill `release-package`).
- Delete `mockups/`. Walk through every requirement and set `Verified` where a test or check covers it.
- Give the user a short manual checklist for a real Mac (Safari) and Windows (GEN-02).

## Decisions to raise when the slice is reached

| When | Question                                                                                                                | Recommendation to give                                      |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| S3   | "Beispiel ansehen" without network: embed the fictional example in `Stammbaum.html`, or only ship it as a file to open? | Embed it (fictional, small, works offline with one click)   |
| S3   | P-005 search, now that a real tree with many persons is visible                                                         | Yes, simple name search in the top bar                      |
| S3   | Show the layout choices of ADR-0006 (several partners, married siblings, "?" parent) in the real tree and confirm them  | Keep them; adjust only what looks wrong to the user         |
| S4   | P-006 plausibility hints                                                                                                | Optional, small; user's call                                |
| S5   | P-008 smaller copy for email                                                                                            | Yes if photos make files too big                            |
| S6   | Print details (paper size, fit to one page or several)                                                                  | Fit to one page, A4 landscape default, browser print dialog |

Anything not covered by the concept or the mock-up that changes what the user sees is **the user's call**: show it, then ask.

## Change log

| Date       | Change                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-24 | Roadmap created after the mock-up phase (S1–S6).                                                                                    |
| 2026-10-24 | S1 done (session 3). Notes for S4/S5 added: deleting a person leaves its image and `view.focusPersonId` to the state/storage layer. |
| 2026-10-24 | S2 done (session 4). Siblings share a row (not only partners). New S3 decision: confirm the layout choices of ADR-0006.             |

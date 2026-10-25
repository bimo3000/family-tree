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
| S3  | Tree view (read-only)         | Done   | TREE-02, PERS-04/05, GEN-05/06, UI-04                   |
| S4  | Editing                       | Done   | PERS-01/02/06/07, TREE-03 (editing), UI-01              |
| S5  | Working copy, files, pictures | Done   | DATA-02/03/04/07/09, PERS-03, UI-02                     |
| S6  | Finish and release            | Done   | UI-03, DATA-06, GEN-01/03/04, user guide, manual checks |
| S7  | Languages (DE, EN, FR)        | Done   | GEN-05, DEV-07 (ADR-0008)                               |

Status values: `Todo` → `In progress` → `Done`. Only one slice is `In progress` at a time.

## Sources of truth for every slice

- What to build: `docs/requirements/REQUIREMENTS.md`. How it behaves: `docs/concept/ui-concept.md`, `data-model.md`, `architecture.md`.
- How it looks and feels: the running app and `src/ui/theme.css`. The clickable mock-up (`mockups/`) was deleted in S6; it is
  in git history before commit `1bfe483`.
- Mock-up logic that was ported to TypeScript (with tests): `parseDate`/`fmtDate`/`dateHint`, the wording helpers
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

- App shell (top bar with the project name; undo/redo come with S4, the save status with S5), SVG tree with pan/zoom/fit/double-click centre/Esc,
  person cards (big photo, neutral colours), hover tooltip, selection + highlighted line, detail panel with "Familie" groups.
- German display helpers (dates, Mutter/Vater/Elternteil, …) in `src/ui/`, unit-tested.
- E2E: built app via `file://`, show the example, select a person, check the panel. The agent looks at screenshots itself.
- Decided 2026-10-24: the example is embedded (`examples/familie-brandt.json`); the app opens straight into it until S5. No search (P-005 rejected).
- Draw only what `computeLayout` returns: cards by centre, couple lines as polylines (the "//" goes at `middle` when
  `ended` is set), child lines as `stems` plus one `drop` per child (highlight the focused child's drop only).
- At the end, ask the user to try it: `npm run build`, then double-click `dist/Stammbaum.html`.
- ✅ Done in session 5. Cards are HTML buttons and lines one SVG, in a layer moved by a CSS transform (like the mock-up).

## S4 – Editing

- `src/ui/state/`: open project, selection, undo/redo (UI-01), dirty status. Every change goes through a core operation.
- Person dialog (ui-concept §2.5), add-relative flows (§2.6), delete (§2.7), relation edit/remove with the cut-off dialog (§2.8).
- `deletePerson` (core) does not touch `images` or `view.focusPersonId`: clear the focus in state when the focused person goes.
- No working copy yet (moved to S5, decided 2026-10-24): a reload shows the example again. No photo row and no save status yet (S5).
- E2E for the main flows in all three engines.
- ✅ Done in session 6. Flows in `src/core/model/relatives.ts`, state in `src/ui/state/`, dialogs in `src/ui/dialogs/`.
  Decided on the user's behalf: a new relative left completely empty is removed again when its dialog closes.

## S5 – Working copy, project files and pictures (`src/storage/`, ADR-0005)

- Working copy in IndexedDB with autosave, reopened on start, so edits survive a reload (DATA-03, architecture §3). Moved here from S4.

- Add fflate (pinned exact, note in ADR-0005). `.stammbaum` zip with `data.json` + `bilder/`: open (picker, drag & drop), save.
- Saving per DATA-09: Chromium writes into the file (File System Access), Firefox/Safari download with a one-time hint.
- Start screen (new, open, example), several projects (DATA-02), last project on start (DATA-03).
- Save status and backup reminder (UI-02). Remove an image from `images` when its person is deleted or the photo is replaced. Photos: one per person, downscaled to 2000 px JPEG (DATA-07, PERS-03).
- E2E: save/open roundtrip in every engine.
- ✅ Done in session 7. Storage in `src/storage/`, state in `src/ui/state/workspace.svelte.ts`, start screen and project screen
  in `src/ui/`. Decided on the user's behalf: no "Zuletzt geöffnet" list (one working copy); Drucken and Hilfe menu entries
  come with S6; nothing in the status while there is nothing to save; the reminder shows on start only.

## S6 – Finish and release

- Print / save as image or PDF (UI-03). In-app help and first-use hints (ui-concept §7).
- `Beispiel.stammbaum` in the release zip, built from `examples/familie-brandt.json` by `npm run package` (DATA-06), German user guide `docs/user-guide/Anleitung.md`, release zip (skill `release-package`).
- Delete `mockups/`. Walk through every requirement and set `Verified` where a test or check covers it.
- Give the user a short manual checklist for a real Mac (Safari) and Windows (GEN-02).
- ✅ Done in session 8. Print styles in `TreeView`/`ProjectScreen` (`printView` in `geometry.ts`), `HelpDialog.svelte`,
  the hint bar, `Beispiel.stammbaum` built by `npm run package`, guide written, `mockups/` deleted, `docs/manual-checks.md`,
  release 0.9.0. Decided on the user's behalf: the printout has a white page (cards keep their colours) and no highlight.

## S7 – Languages (German, English, French; GEN-05, was P-010, ADR-0008)

- Every UI text moves into `src/ui/i18n/de.ts` first, with no visible change (the German E2E suite is the safety net).
  Then `en.ts` and `fr.ts`, typed against German so nothing can be forgotten.
- Language choice on the start screen and in the project menu, remembered per browser (IndexedDB). Default: browser
  language, else English.
- Dates: input in all three languages at once (core), display per language, short qualifiers on the card so the year
  line never gets longer than in German.
- Help dialog translated; the zip gets `Guide.txt` (EN) and `Mode-d-emploi.txt` (FR) next to `Anleitung.txt`.
- E2E: language from the browser, switching, reload keeps it, a person added in English and French, year line fits.
- ✅ Done in session 10. Dictionaries in `src/ui/i18n/`, `LanguageChoice.svelte`, parser in `src/core/dates.ts`. Found on
  the way: a date range read back as text after editing, and a long year line was cut off on the card (also in German).
  Both fixed with regression tests. Decided on the user's behalf: the app keeps its name "Stammbaum" in every language;
  a year line that is too long gets smaller (down to 65 %), like the name.

## Decisions to raise when the slice is reached

| When  | Question                                                                                                                | Recommendation to give                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| S3 ✅ | "Beispiel ansehen" without network: embed the fictional example in `Stammbaum.html`, or only ship it as a file to open? | Decided: embed it                                                        |
| S3 ✅ | P-005 search, now that a real tree with many persons is visible                                                         | Decided: rejected, no search                                             |
| S3 ✅ | Show the layout choices of ADR-0006 (several partners, married siblings, "?" parent) in the real tree and confirm them  | Decided: kept; the "?" node made larger                                  |
| S4 ✅ | P-006 plausibility hints                                                                                                | Decided: rejected                                                        |
| S5 ✅ | P-008 smaller copy for email                                                                                            | Decided: rejected                                                        |
| S6 ✅ | Print details (paper size, fit to one page or several)                                                                  | Decided: browser print dialog, one A4 landscape page, PDF via the dialog |

Anything not covered by the concept or the mock-up that changes what the user sees is **the user's call**: show it, then ask.

## Change log

| Date       | Change                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-24 | Roadmap created after the mock-up phase (S1–S6).                                                                                                                       |
| 2026-10-24 | S1 done (session 3). Notes for S4/S5 added: deleting a person leaves its image and `view.focusPersonId` to the state/storage layer.                                    |
| 2026-10-24 | S2 done (session 4). Siblings share a row (not only partners). New S3 decision: confirm the layout choices of ADR-0006.                                                |
| 2026-10-24 | S3 started (session 5). Example embedded, P-005 rejected. Undo/redo buttons move to S4, the save status to S5 (no dummy buttons).                                      |
| 2026-10-24 | S3 done (session 5). Layout choices confirmed by the user; "?" node enlarged. Next: S4. Rendering 100 persons in the browser is checked once files can be opened (S5). |
| 2026-10-24 | S4 started (session 6). The working copy moves from S4 to S5 (user's choice: until files exist it would only keep edits to the example). P-006 rejected.               |
| 2026-10-24 | S4 done (session 6). Next: S5 (working copy, project files, pictures).                                                                                                 |
| 2026-10-24 | S5 started (session 7). P-008 rejected. One working copy in the browser; before replacing an unsaved tree the app asks (user's choice).                                |
| 2026-10-24 | S5 done (session 7). Next: S6 (finish and release). Real file picker (Chrome/Edge) and Safari need a manual check.                                                     |
| 2026-10-24 | S6 started (session 8). Print: browser dialog, one A4 landscape page, PDF via the dialog, no PNG. Help: short dialog plus one hint. First zip: 0.9.0.                  |
| 2026-10-24 | S6 done (session 8). All slices done. Release 0.9.0. Next: manual Mac/Windows checks and the user's feedback, then 1.0.0.                                              |
| 2026-10-24 | Session 9: photo cropping (P-009 → PERS-08) built on the user's request before the manual checks. A feedback item, no new slice.                                       |
| 2026-10-25 | Crop preview dropped after the user's test. Release 0.9.1 (with cropping) for the manual checks. P-010 (multi-language UI) noted as an idea.                           |
| 2026-10-25 | S7 (languages) started on the user's request: P-010 approved as the new GEN-05 (ADR-0008).                                                                             |
| 2026-10-25 | S7 done (session 10). Release 0.10.0 with English and French.                                                                                                          |

# Requirements catalogue – Stammbaum

This is the **contract between the human developer (product owner) and the development agents (Claude Code)**.

- Agents implement what is listed here, and only that, also in auto mode.
- **Agents never add, change or deviate from a requirement without prior approval** by the human developer.
  They _do_ proactively propose changes in [Proposals](#proposals-awaiting-approval).
- Approved deviations from a requirement are recorded in [Aligned deviations](#aligned-deviations).
- Detailed technical design lives in [../concept/](../concept/). Agent working state lives in
  [../agent/HANDOVER.md](../agent/HANDOVER.md). This file stays short and in plain language.

**Status values:** `Agreed` (to be built) → `In progress` → `Implemented` → `Verified` (covered by an automated test or a documented manual check). `Future` = agreed direction, not scheduled yet.

**How to change this file:** see the agent skill [`requirement-change`](../../.claude/skills/requirement-change/SKILL.md).

---

## GEN – Platform & distribution

| ID     | Requirement                                                                                                                       | Status      | Verified by                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| GEN-01 | The app is a self-contained web app with **one entry point**: double-click `Stammbaum.html`.                                      | In progress | `tests/e2e/smoke.spec.ts`                                      |
| GEN-02 | Works in current desktop versions of **Chrome, Edge, Firefox and Safari** on **Windows, Linux and macOS**.                        | In progress | E2E in Chromium, Firefox, WebKit; manual Mac/Win check pending |
| GEN-03 | The app can be **zipped and emailed**; after unzipping it works out of the box.                                                   | In progress | `npm run package`, `tests/unit/zip.test.ts`                    |
| GEN-04 | No installation and no dependencies for end users (no server, no internet, no extra software).                                    | In progress | `scripts/check-no-external-refs.mjs` (build step)              |
| GEN-05 | The user interface is in **German**.                                                                                              | In progress | German texts only in `src/ui/`; `tests/e2e/tree.spec.ts`       |
| GEN-06 | Usable by people **without any computer-science background** ("grandma test"). Extensive accessibility features are not required. | Agreed      |                                                                |
| GEN-07 | Designed for **desktop** use (mouse, keyboard, larger screen). Phone/tablet is out of scope for now (see FUT-02).                 | Agreed      |                                                                |

## PRIV – Privacy & offline

| ID      | Requirement                                                                                          | Status      | Verified by                                                           |
| ------- | ---------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| PRIV-01 | The app works **fully offline**.                                                                     | In progress | E2E fixture blocks all network access in every test                   |
| PRIV-02 | **No data ever leaves the device.** No network access, no online fonts or libraries, no telemetry.   | In progress | E2E: CSP present and blocks `fetch`; zero network requests; lint rule |
| PRIV-03 | Real family data is **never committed** to the repository. Only fictional example data is committed. | In progress | `.gitignore` (`data/`, `*.stammbaum` except `examples/`)              |

## DATA – Projects & storage

| ID      | Requirement                                                                                                                                                                                                   | Status      | Verified by                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| DATA-01 | Family data is **strictly separated** from the app logic.                                                                                                                                                     | In progress | `src/core/` holds no family data; fictional data only in `tests/fixtures/` and `examples/`                |
| DATA-02 | The user can **create and open several family-tree projects**.                                                                                                                                                | Agreed      |                                                                                                           |
| DATA-03 | The app opens the **last used project** automatically.                                                                                                                                                        | Agreed      |                                                                                                           |
| DATA-04 | Each project is **one file** (`Name.stammbaum`) that contains the data (JSON) and the pictures, so it is easy to email and back up.                                                                           | Agreed      |                                                                                                           |
| DATA-05 | The data format is simple and readable (JSON inside the project file).                                                                                                                                        | Implemented | `tests/unit/serialization.test.ts` (JSON; the zip file follows in S5)                                     |
| DATA-06 | A **fictional example project** (and/or an empty start) is shipped with the app and committed to the repo.                                                                                                    | In progress | `examples/familie-brandt.json`, embedded and shown (`tests/e2e/tree.spec.ts`); `Beispiel.stammbaum` in S6 |
| DATA-07 | Pictures are **automatically downscaled** when added, to max. **2000 px** on the long side (JPEG). (was P-002)                                                                                                | Agreed      |                                                                                                           |
| DATA-08 | **Older project files always open in newer app versions** (automatic upgrade of the data format). (was P-004)                                                                                                 | Implemented | `tests/unit/serialization.test.ts` (migration registry, stored v1 sample)                                 |
| DATA-09 | **Saving:** in Chrome/Edge, once a project has been saved to a file, every change is written into that file automatically. In Firefox/Safari, "Speichern" downloads the file, and the app explains this once. | Agreed      |                                                                                                           |

## PERS – Persons

| ID      | Requirement                                                                                                                                           | Status   | Verified by                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| PERS-01 | Persons can be **added, edited and removed**.                                                                                                         | Verified | `tests/unit/operations.test.ts`, `relatives.test.ts`, `tests/e2e/editing.spec.ts`                                  |
| PERS-02 | **All data fields are optional.**                                                                                                                     | Verified | `tests/unit/operations.test.ts` (empty person is valid), `tests/e2e/editing.spec.ts` (only a first name)           |
| PERS-03 | Each person can have a **picture** (one portrait per person).                                                                                         | Agreed   |                                                                                                                    |
| PERS-04 | By default, a person shows only **minimal data**: name (with the last known surname), year of birth, year of death. Full dates appear on hover/click. | Verified | `tests/e2e/tree.spec.ts` (cards, hover), `tests/unit/ui/text.test.ts`                                              |
| PERS-05 | **More information** is shown on further interaction (hover or click), e.g. background text, birth name, place of birth, and other fields.            | Verified | `tests/e2e/tree.spec.ts` (tooltip, panel), `tests/unit/ui/family.test.ts`                                          |
| PERS-06 | Dates can be **vague**: full date, month and year, year only, "ca. 1850", "vor 1900", "nach 1900". They are displayed as precisely as they are known. | Verified | `tests/unit/dates.test.ts`, `tests/unit/ui/text.test.ts` (display, date hint), `tests/e2e/editing.spec.ts` (input) |
| PERS-07 | A person can have an **optional gender**. It is used for wording (Mutter/Vater, Sohn/Tochter). Without it, neutral words are used (Elternteil, Kind). | Verified | `tests/unit/ui/text.test.ts`, `family.test.ts` (wording), `tests/e2e/editing.spec.ts` (choosing the gender)        |

## TREE – Family tree display & relations

| ID      | Requirement                                                                                                                                                                                                                                               | Status      | Verified by                                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TREE-01 | Family relations are displayed **clearly and intuitively**.                                                                                                                                                                                               | Verified    | `tests/unit/layout/*`, `tests/e2e/tree.spec.ts`; user review of the real tree (2026-10-24)                                                              |
| TREE-02 | Main view: a **zoomable, pannable overview of the whole family**, plus **focus** on a selected person (highlighting their line, and centering on them). Ancestors at the top, descendants below.                                                          | Verified    | `tests/e2e/tree.spec.ts` (pan, zoom, fit, focus, centre)                                                                                                |
| TREE-03 | Supported relations: parents and children; partners, **including several partners** over a lifetime; **marriage details** (dates, places, divorced/separated); **adoptive/step/foster** parent-child links; **incomplete parents** (one or both unknown). | Verified    | `tests/unit/operations.test.ts`, `relatives.test.ts`, `layout/lines.test.ts`, `tests/e2e/tree.spec.ts` (display), `tests/e2e/editing.spec.ts` (editing) |
| TREE-04 | **Progressive disclosure:** special cases (multiple partners, adoption, divorce, …) add visual or UI complexity **only when they are actually used**. A simple family looks simple.                                                                       | Verified    | `tests/unit/layout/lines.test.ts`, `tests/e2e/tree.spec.ts` (marks only where they apply)                                                               |
| TREE-05 | Trees of **up to about 100 persons** display and react smoothly.                                                                                                                                                                                          | In progress | `tests/unit/layout/invariants.test.ts` (100 persons laid out in < 100 ms); rendering 100 persons in the browser once files can be opened (S5)           |

## UI – Interaction & usability

| ID    | Requirement                                                                                                            | Status   | Verified by                                                                           |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| UI-01 | **Undo/redo** ("Rückgängig") for every change. (was P-001)                                                             | Verified | `tests/unit/ui/history.test.ts`, `tests/e2e/editing.spec.ts` (buttons, Ctrl+Z/Ctrl+Y) |
| UI-02 | A visible **save status** ("Gespeichert" / "Nicht in Datei gespeichert") and a gentle **backup reminder**. (was P-003) | Agreed   |                                                                                       |
| UI-03 | The tree can be **printed or exported as an image/PDF**. (was P-007)                                                   | Agreed   |                                                                                       |
| UI-04 | The app addresses the user informally with **"Du"**.                                                                   | Agreed   |                                                                                       |

## DEV – Development process (how agents work in this repo)

| ID     | Requirement                                                                                                                                                                                                   | Status      | Verified by                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------- |
| DEV-01 | The repo is set up for development with **Claude Code** (other agents are out of scope).                                                                                                                      | Implemented | `CLAUDE.md`, `.claude/`                        |
| DEV-02 | This catalogue is binding. Changes or deviations only after alignment with the human developer; aligned deviations are documented here.                                                                       | Implemented | this file                                      |
| DEV-03 | Session-to-session **handover** is documented so a fresh agent session can continue without prior context.                                                                                                    | Implemented | `docs/agent/HANDOVER.md`                       |
| DEV-04 | **Automated tests** exist and are maintained proactively by the agents, so that introduced issues are found early. Tests run in all three browser engines.                                                    | Implemented | `npm run verify`                               |
| DEV-05 | A **test hook runs on every push** and blocks the push on failure.                                                                                                                                            | Verified    | `.githooks/pre-push` (checked 2026-10-24)      |
| DEV-06 | Agents **commit and push regularly** in small, well-scoped steps (directly to `main`; bigger experiments on a feature branch).                                                                                | Implemented | git history                                    |
| DEV-07 | The **documentation** is thorough, up to date, and understandable for the human developer. Dev docs in English; the end-user guide in German.                                                                 | Implemented | `docs/`                                        |
| DEV-08 | Agents maintain a sensible **`.gitignore`** and **delete stale development artifacts**.                                                                                                                       | Implemented | `CLAUDE.md` → Housekeeping                     |
| DEV-09 | Agents explain complex decisions and concepts in **plain language** (rough engineering background, no deep development know-how) and actively ask for the human developer's opinion, **especially on UI/UX**. | Implemented | `CLAUDE.md` → Working with the human developer |
| DEV-10 | Agents **improve the setup** over time: they propose changes to CLAUDE.md and tooling, and create **skills** for recurring work.                                                                              | Implemented | `.claude/skills/`                              |

## FUT – Future (agreed direction, not scheduled)

| ID     | Requirement                                                                                                   | Status |
| ------ | ------------------------------------------------------------------------------------------------------------- | ------ |
| FUT-01 | The tree can be **published on a website for viewing only** (no creating or editing).                         | Future |
| FUT-02 | Usage on **phone/tablet**.                                                                                    | Future |
| FUT-03 | **GEDCOM** import/export (exchange format of other genealogy software). The data model stays GEDCOM-friendly. | Future |
| FUT-04 | Tests also run on GitHub (CI) as a second safety net.                                                         | Future |

---

## Proposals (awaiting approval)

Ideas from agents. **Not binding until the human developer approves.** On approval, a proposal moves into the tables above.

| ID    | Proposal                                                                                        | Why                                                                                                   | Proposed   |
| ----- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- |
| P-008 | **"Kopie zum Verschicken"**: export a copy of the project with smaller pictures (e.g. 1000 px). | With 2000 px pictures (DATA-07), a tree with ~100 photos is ~50 MB, too big for many email providers. | 2026-10-24 |

## Aligned deviations

Deviations from an agreed requirement, approved by the human developer.

| ID  | Requirement | Deviation | Reason | Approved |
| --- | ----------- | --------- | ------ | -------- |
| –   | –           | none yet  | –      | –        |

## Clarifications log

Interpretations of the original brief that were confirmed by the human developer.

| Date       | Clarification                                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-24 | "ios" in the original brief means **macOS** (desktop). Phone/tablet is out of scope.                                                                                                                                                               |
| 2026-10-24 | Storage: one `.stammbaum` file per project (a zip with `data.json` + `bilder/`). The browser keeps a working copy. Chrome/Edge save in place; Firefox/Safari save via download.                                                                    |
| 2026-10-24 | Development tooling (Node.js) is allowed on the developer machine; end users never need it.                                                                                                                                                        |
| 2026-10-24 | Git workflow: direct pushes to `main`, gated by the pre-push hook. No CI for now.                                                                                                                                                                  |
| 2026-10-24 | GEDCOM: maybe later (FUT-03); no feature now.                                                                                                                                                                                                      |
| 2026-10-24 | Concept alignment: P-001, P-002 (2000 px instead of the proposed 1200 px), P-003, P-004 and P-007 approved. P-005 and P-006 stay open for later.                                                                                                   |
| 2026-10-24 | Person fields as in `docs/concept/data-model.md` §2. No extra dedicated fields; anything else goes into "Weitere Angaben".                                                                                                                         |
| 2026-10-24 | "+ Geschwister" with unknown parents automatically creates an "unknown parent" placeholder (shown as a small "?" node).                                                                                                                            |
| 2026-10-24 | Still open, to be decided with the mock-ups: card colours (neutral or by gender), editing in the side panel or in a dialog.                                                                                                                        |
| 2026-10-24 | Dates (PERS-06): only the interpreted value is stored, not the typed text (`um 1850` comes back as `ca. 1850`). Unreadable input is kept and shown as typed.                                                                                       |
| 2026-10-24 | General preference: **no over-engineering**. Prefer the simplest solution that meets the requirements (noted in CLAUDE.md §3).                                                                                                                     |
| 2026-10-24 | Mock-up round 1 decided: visual style "Familienalbum" (variant A, a bit more mustard and warmer), big photo on the card, **neutral card colours**, editing a person **in a dialog**. Resolves the open item above.                                 |
| 2026-10-24 | Relations (partner, parent, child) can be **edited and removed** from the detail panel (✎ / ×), not only via undo. Behaviour when a person loses their last connection: to be confirmed with mock-up round 2.                                      |
| 2026-10-24 | Additional adoptive/step/foster parents besides two biological parents stay in scope (TREE-03). At most two **biological** parents per person.                                                                                                     |
| 2026-10-24 | UI wording: no dashes or middle dots as separators (use commas or a spaced pipe). The Rufname is not highlighted in the name.                                                                                                                      |
| 2026-10-24 | Mock-up round 2 confirmed: a person who loses their last connection is not deleted automatically, the user chooses "Nur Verbindung entfernen" or "ganz löschen". Layout is automatic after every change, no manual dragging of cards.              |
| 2026-10-24 | S3 decisions: the fictional example (Familie Brandt) is **embedded in `Stammbaum.html`** (data in `examples/familie-brandt.json`), so "Beispiel ansehen" works with one click. Until the start screen exists (S5), the app opens straight into it. |
| 2026-10-24 | **P-005 (search) rejected.** No search box; people are found by pan, zoom, "Alles anzeigen" and the family links in the detail panel.                                                                                                              |
| 2026-10-24 | S3 review: the layout choices of ADR-0006 (several partners, married siblings, "?" parent) are **confirmed**. The "?" node of an unknown parent is drawn larger and more visible (56 px, stronger dashed outline).                                 |
| 2026-10-24 | Rejected P-006 (plausibility hints): the user does not want them.                                                                                                                                                                                  |
| 2026-10-24 | The browser working copy (DATA-03) is built with slice S5 (start screen, several projects, pictures), not S4. Until then a reload shows the example again.                                                                                         |

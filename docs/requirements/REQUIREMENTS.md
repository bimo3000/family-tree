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
| GEN-05 | The user interface is in **German**.                                                                                              | Agreed      |                                                                |
| GEN-06 | Usable by people **without any computer-science background** ("grandma test"). Extensive accessibility features are not required. | Agreed      |                                                                |
| GEN-07 | Designed for **desktop** use (mouse, keyboard, larger screen). Phone/tablet is out of scope for now (see FUT-02).                 | Agreed      |                                                                |

## PRIV – Privacy & offline

| ID      | Requirement                                                                                          | Status      | Verified by                                                           |
| ------- | ---------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| PRIV-01 | The app works **fully offline**.                                                                     | In progress | E2E fixture blocks all network access in every test                   |
| PRIV-02 | **No data ever leaves the device.** No network access, no online fonts or libraries, no telemetry.   | In progress | E2E: CSP present and blocks `fetch`; zero network requests; lint rule |
| PRIV-03 | Real family data is **never committed** to the repository. Only fictional example data is committed. | In progress | `.gitignore` (`data/`, `*.stammbaum` except `examples/`)              |

## DATA – Projects & storage

| ID      | Requirement                                                                                                                         | Status | Verified by |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| DATA-01 | Family data is **strictly separated** from the app logic.                                                                           | Agreed |             |
| DATA-02 | The user can **create and open several family-tree projects**.                                                                      | Agreed |             |
| DATA-03 | The app opens the **last used project** automatically.                                                                              | Agreed |             |
| DATA-04 | Each project is **one file** (`Name.stammbaum`) that contains the data (JSON) and the pictures, so it is easy to email and back up. | Agreed |             |
| DATA-05 | The data format is simple and readable (JSON inside the project file).                                                              | Agreed |             |
| DATA-06 | A **fictional example project** (and/or an empty start) is shipped with the app and committed to the repo.                          | Agreed |             |

## PERS – Persons

| ID      | Requirement                                                                                                                                           | Status | Verified by |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| PERS-01 | Persons can be **added, edited and removed**.                                                                                                         | Agreed |             |
| PERS-02 | **All data fields are optional.**                                                                                                                     | Agreed |             |
| PERS-03 | Each person can have a **picture**.                                                                                                                   | Agreed |             |
| PERS-04 | By default, a person shows only **minimal data**: name (with the last known surname), date of birth, date of death.                                   | Agreed |             |
| PERS-05 | **More information** is shown on further interaction (hover or click), e.g. background text, birth name, place of birth, and other fields.            | Agreed |             |
| PERS-06 | Dates can be **vague**: full date, month and year, year only, "ca. 1850", "vor 1900", "nach 1900". They are displayed as precisely as they are known. | Agreed |             |

## TREE – Family tree display & relations

| ID      | Requirement                                                                                                                                                                                                                                               | Status | Verified by |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| TREE-01 | Family relations are displayed **clearly and intuitively**.                                                                                                                                                                                               | Agreed |             |
| TREE-02 | Main view: a **zoomable, pannable overview of the whole family**, plus **focus** on a selected person (highlighting their line, and centering on them).                                                                                                   | Agreed |             |
| TREE-03 | Supported relations: parents and children; partners, **including several partners** over a lifetime; **marriage details** (dates, places, divorced/separated); **adoptive/step/foster** parent-child links; **incomplete parents** (one or both unknown). | Agreed |             |
| TREE-04 | **Progressive disclosure:** special cases (multiple partners, adoption, divorce, …) add visual or UI complexity **only when they are actually used**. A simple family looks simple.                                                                       | Agreed |             |
| TREE-05 | Trees of **up to about 100 persons** display and react smoothly.                                                                                                                                                                                          | Agreed |             |

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

| ID    | Proposal                                                                                                          | Why                                                                                  | Proposed   |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| P-001 | **Undo/redo** ("Rückgängig") for every change.                                                                    | Mistakes are cheap to fix. Grandma loses her fear of clicking.                       | 2026-10-24 |
| P-002 | **Pictures are automatically downscaled** on import (e.g. max. 1200 px, JPEG).                                    | A 6 MB phone photo would otherwise make project files too big to email.              | 2026-10-24 |
| P-003 | A visible **save status** ("Alle Änderungen gespeichert" / "Nicht gespeichert") and a gentle **backup reminder**. | In Firefox/Safari saving means downloading a new file, which users can forget to do. | 2026-10-24 |
| P-004 | **Older project files always open in newer app versions** (automatic upgrade of the data format).                 | Trees are kept for decades while the app evolves.                                    | 2026-10-24 |
| P-005 | **Search** a person by name.                                                                                      | Finding someone in 100 persons by panning around is tedious.                         | 2026-10-24 |
| P-006 | **Plausibility hints** that never block saving (e.g. "Tod vor Geburt?", "Mutter bei Geburt 8 Jahre alt?").        | Catches typos in dates.                                                              | 2026-10-24 |
| P-007 | **Print / export the tree as an image or PDF.**                                                                   | Grandma wants it on paper or on the wall.                                            | 2026-10-24 |

## Aligned deviations

Deviations from an agreed requirement, approved by the human developer.

| ID  | Requirement | Deviation | Reason | Approved |
| --- | ----------- | --------- | ------ | -------- |
| –   | –           | none yet  | –      | –        |

## Clarifications log

Interpretations of the original brief that were confirmed by the human developer.

| Date       | Clarification                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-24 | "ios" in the original brief means **macOS** (desktop). Phone/tablet is out of scope.                                                                                            |
| 2026-10-24 | Storage: one `.stammbaum` file per project (a zip with `data.json` + `bilder/`). The browser keeps a working copy. Chrome/Edge save in place; Firefox/Safari save via download. |
| 2026-10-24 | Development tooling (Node.js) is allowed on the developer machine; end users never need it.                                                                                     |
| 2026-10-24 | Git workflow: direct pushes to `main`, gated by the pre-push hook. No CI for now.                                                                                               |
| 2026-10-24 | GEDCOM: maybe later (FUT-03); no feature now.                                                                                                                                   |

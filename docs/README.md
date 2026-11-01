# Documentation index

Start here if you want to understand the project. Agents keep these documents up to date.

## Map

| Document                                                     | What it is                                                            | Main audience                |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------- |
| [requirements/REQUIREMENTS.md](requirements/REQUIREMENTS.md) | **The contract**: what the app must do, proposals, aligned deviations | Human developer + agents     |
| [concept/architecture.md](concept/architecture.md)           | How the app is structured and why                                     | Both                         |
| [concept/data-model.md](concept/data-model.md)               | What is stored in a project file and how                              | Both                         |
| [concept/ui-concept.md](concept/ui-concept.md)               | Screens, interactions and wording (text level)                        | Both, UI/UX input wanted     |
| [agent/HANDOVER.md](agent/HANDOVER.md)                       | Current status, next steps, open questions, pitfalls                  | Agents (readable for humans) |
| [agent/ROADMAP.md](agent/ROADMAP.md)                         | The slices of functional development, their order and status          | Both                         |
| [agent/decisions/](agent/decisions/)                         | Architecture Decision Records: why things are the way they are        | Both                         |
| [user-guide/Anleitung.md](user-guide/Anleitung.md)           | Guide for end users, shipped in `Stammbaum/` (German)                 | End users                    |
| [user-guide/Guide.md](user-guide/Guide.md)                   | The same guide in English                                             | End users                    |
| [user-guide/Mode-d-emploi.md](user-guide/Mode-d-emploi.md)   | The same guide in French                                              | End users                    |
| [manual-checks.md](manual-checks.md)                         | Checklist for a real Mac and Windows machine, once per release        | Human developer              |
| [../CLAUDE.md](../CLAUDE.md)                                 | Operating manual for Claude Code in this repo                         | Agents                       |

## Commands (developer machine)

Run these in the repo folder. Prerequisite: `nvm use` (selects the Node version from `.nvmrc`).

| Command             | What it does                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm install`       | Installs the dev tools and activates the pre-push hook. Run once after cloning.                         |
| `npm run dev`       | Starts a local dev server with live reload (browser at `http://localhost:5173`). For development only.  |
| `npm run build`     | Produces `dist/Stammbaum.html` (the whole app in one file) and checks it has no external references.    |
| `npm run typecheck` | TypeScript/Svelte type check.                                                                           |
| `npm run lint`      | Code style and rule checks (ESLint + Prettier).                                                         |
| `npm run format`    | Auto-fixes formatting.                                                                                  |
| `npm run test:unit` | Fast unit tests of the pure logic (Vitest).                                                             |
| `npm run test:e2e`  | Browser tests of the built app in Chromium, Firefox and WebKit (Playwright). Needs `build` first.       |
| `npm run verify`    | Everything above in order. This is exactly what the pre-push hook runs.                                 |
| `npm run release`   | Builds and rewrites the committed `Stammbaum/` folder. Only when releasing a version (skill `release`). |
| `npm run demo-gif`  | Records the README demo `docs/assets/demo.gif` (Chromium, English). Needs Python 3 with Pillow.         |

To view the latest browser-test report: `npx playwright show-report`.

## Repository layout

```
CLAUDE.md              agent operating manual
Stammbaum/             the released app for end users (committed; `npm run release`), also live on GitHub Pages
src/core/              pure logic (no browser APIs): data model, dates, layout …
src/storage/           reading/writing project files, browser working copy
src/ui/                Svelte components; all UI texts in src/ui/i18n/ (German, English, French)
tests/unit/            unit tests (Vitest)
tests/e2e/             browser tests of the built app (Playwright)
scripts/               build/release/check helper scripts
examples/              fictional example family (committed)
data/                  YOUR real family projects (git-ignored, never committed)
docs/                  this documentation
.githooks/pre-push     runs `npm run verify` before every push
.github/workflows/     pages.yml: publishes Stammbaum/ on GitHub Pages when a release changes it
.claude/               Claude Code settings and skills
```

## Glossary (plain language)

| Term                              | Meaning                                                                                                                                                                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR**                           | "Architecture Decision Record". A short note explaining one important technical decision and why it was made.                                                                                                                                                    |
| **Build**                         | Turning the source code into the final file users open (`Stammbaum.html`).                                                                                                                                                                                       |
| **CSP** (Content-Security-Policy) | A rule set inside the HTML that tells the browser what the page may load or contact. Ours says "nothing outside this file", so the browser itself guarantees that no data is sent.                                                                               |
| **E2E test**                      | "End-to-end" test. A robot opens the real app in a real browser and clicks through it like a user.                                                                                                                                                               |
| **Fixture**                       | Fixed test data, e.g. the fictional "Familie Brandt" (`examples/familie-brandt.json`, loaded by `tests/fixtures/`), so every test run starts from the same family.                                                                                               |
| **Pan / zoom**                    | Moving the tree around by dragging (pan) and making it bigger or smaller (zoom), like a map app.                                                                                                                                                                 |
| **Migration**                     | A small upgrade step that turns a project file of an older format version into the current one, so old files always open (DATA-08).                                                                                                                              |
| **Pure function**                 | A function that only computes a result from its inputs and changes nothing else, like a calculator. All our data changes work this way, which makes undo simple.                                                                                                 |
| **Slice**                         | One complete, tested piece of the app that works on its own (like finishing one room before starting the next). The roadmap lists them in order.                                                                                                                 |
| **Barycenter**                    | The average position of a person's relatives in the row above or below. Sorting by it moves families under their parents, so fewer lines cross.                                                                                                                  |
| **Block** (layout)                | Partners standing side by side in one row. The layout always moves them together.                                                                                                                                                                                |
| **Stand-in** (layout)             | An invisible placeholder for a long line in a row it passes (e.g. a child two rows below the parents). The layout treats it like a very narrow card, so the line gets a gap of its own and counts when crossings are reduced. Elsewhere called a "virtual node". |
| **Layout**                        | Working out where every card and line goes. Ours is automatic and recomputed after every change (ADR-0006).                                                                                                                                                      |
| **Unit test**                     | A small automatic test of one piece of logic (e.g. "is '03.1923' read as March 1923?").                                                                                                                                                                          |
| **Engine** (browser engine)       | The core of a browser. Chromium powers Chrome and Edge, Gecko powers Firefox, and WebKit powers Safari. Testing all three covers the main browsers.                                                                                                              |
| **Print stylesheet**              | Extra design rules the browser uses only when printing. Ours hides the buttons and panel and fits the whole tree on one page.                                                                                                                                    |
| **Tag** (git tag)                 | A name pinned to one commit, e.g. `v0.9.0`, so the exact code of a release can always be found again.                                                                                                                                                            |
| **Hook** (git hook)               | A script git runs automatically. Ours runs all tests before a push and stops the push if something is broken.                                                                                                                                                    |
| **IndexedDB**                     | A small database built into every browser. We use it for the automatic working copy of the open project.                                                                                                                                                         |
| **Working copy** (Arbeitskopie)   | The copy of the open tree that the browser keeps after every change, so nothing is lost on a reload. The `.stammbaum` file stays the real thing; the working copy is the safety net.                                                                             |
| **Blob URL**                      | A browser-made address (`blob:…`) for data that is already on the computer, e.g. a photo. It never goes to the internet, so the privacy rules allow it.                                                                                                          |
| **Dictionary** (i18n)             | One file per language with every text the app shows (`src/ui/i18n/de.ts`, `en.ts`, `fr.ts`). German is the master copy; the build fails if another language misses a text. "i18n" is short for "internationalization" (18 letters between i and n).              |
| **Locale**                        | The language (and region) a browser is set to, e.g. `de-AT` or `en-GB`. The app uses it to pick its language until the user chooses one.                                                                                                                         |
| **File System Access API**        | A browser feature (Chrome/Edge only) that lets a web page save directly into a file the user picked. In Firefox/Safari, saving works through a normal download instead.                                                                                          |
| **Lint**                          | An automatic check for code mistakes and style rules.                                                                                                                                                                                                            |
| **Node.js / npm**                 | The JavaScript runtime and package manager used **only for development tools**. End users don't need them.                                                                                                                                                       |
| **Progressive disclosure**        | Showing advanced options only when they are needed, so simple things stay simple.                                                                                                                                                                                |
| **Svelte**                        | The UI framework the app is written in. It turns components into small, plain JavaScript.                                                                                                                                                                        |
| **TypeScript**                    | JavaScript with type annotations. It catches many mistakes before the code ever runs.                                                                                                                                                                            |
| **`.stammbaum` file**             | One family-tree project: a zip file containing `data.json` (the data) and `bilder/` (the pictures).                                                                                                                                                              |
| **GitHub Pages**                  | GitHub's free website hosting. Our workflow `.github/workflows/pages.yml` puts only the `Stammbaum/` folder online at https://bimo3000.github.io/family-tree/, so the app runs there without a download. Data still stays in the visitor's browser.              |
| **MIT licence**                   | A short open-source licence: anyone may use, change and share the code, as long as the licence text travels with it. It also says "no warranty". The app and the libraries inside it use it (`LICENSE`, `Stammbaum/LICENSES.txt`).                               |
| **Undo step**                     | One entry in the undo history. Typing into one field counts as a single step, so ↶ takes back the whole word, not letter by letter.                                                                                                                              |
| **Modal dialog**                  | A window on top of the tree that has to be closed (Fertig, Abbrechen, Esc) before the tree can be used again.                                                                                                                                                    |

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
| [agent/decisions/](agent/decisions/)                         | Architecture Decision Records: why things are the way they are        | Both                         |
| [user-guide/Anleitung.md](user-guide/Anleitung.md)           | German guide for end users, shipped in the zip                        | End users                    |
| [../CLAUDE.md](../CLAUDE.md)                                 | Operating manual for Claude Code in this repo                         | Agents                       |

## Commands (developer machine)

Run these in the repo folder. Prerequisite: `nvm use` (selects the Node version from `.nvmrc`).

| Command             | What it does                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm install`       | Installs the dev tools and activates the pre-push hook. Run once after cloning.                        |
| `npm run dev`       | Starts a local dev server with live reload (browser at `http://localhost:5173`). For development only. |
| `npm run build`     | Produces `dist/Stammbaum.html` (the whole app in one file) and checks it has no external references.   |
| `npm run typecheck` | TypeScript/Svelte type check.                                                                          |
| `npm run lint`      | Code style and rule checks (ESLint + Prettier).                                                        |
| `npm run format`    | Auto-fixes formatting.                                                                                 |
| `npm run test:unit` | Fast unit tests of the pure logic (Vitest).                                                            |
| `npm run test:e2e`  | Browser tests of the built app in Chromium, Firefox and WebKit (Playwright). Needs `build` first.      |
| `npm run verify`    | Everything above in order. This is exactly what the pre-push hook runs.                                |
| `npm run package`   | Builds `release/Stammbaum-<version>.zip`, ready to email.                                              |

To view the latest browser-test report: `npx playwright show-report`.

## Repository layout

```
CLAUDE.md              agent operating manual
src/core/              pure logic (no browser APIs): data model, dates, layout …
src/storage/           reading/writing project files, browser working copy
src/ui/                Svelte components (German texts)
tests/unit/            unit tests (Vitest)
tests/e2e/             browser tests of the built app (Playwright)
scripts/               build/package/check helper scripts
examples/              fictional example family (committed)
data/                  YOUR real family projects (git-ignored, never committed)
docs/                  this documentation
.githooks/pre-push     runs `npm run verify` before every push
.claude/               Claude Code settings and skills
```

## Glossary (plain language)

| Term                              | Meaning                                                                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR**                           | "Architecture Decision Record". A short note explaining one important technical decision and why it was made.                                                                      |
| **Build**                         | Turning the source code into the final file users open (`Stammbaum.html`).                                                                                                         |
| **CSP** (Content-Security-Policy) | A rule set inside the HTML that tells the browser what the page may load or contact. Ours says "nothing outside this file", so the browser itself guarantees that no data is sent. |
| **E2E test**                      | "End-to-end" test. A robot opens the real app in a real browser and clicks through it like a user.                                                                                 |
| **Unit test**                     | A small automatic test of one piece of logic (e.g. "is '03.1923' read as March 1923?").                                                                                            |
| **Engine** (browser engine)       | The core of a browser. Chromium powers Chrome and Edge, Gecko powers Firefox, and WebKit powers Safari. Testing all three covers the main browsers.                                |
| **Hook** (git hook)               | A script git runs automatically. Ours runs all tests before a push and stops the push if something is broken.                                                                      |
| **IndexedDB**                     | A small database built into every browser. We use it for the automatic working copy of the open project.                                                                           |
| **File System Access API**        | A browser feature (Chrome/Edge only) that lets a web page save directly into a file the user picked. In Firefox/Safari, saving works through a normal download instead.            |
| **Lint**                          | An automatic check for code mistakes and style rules.                                                                                                                              |
| **Node.js / npm**                 | The JavaScript runtime and package manager used **only for development tools**. End users don't need them.                                                                         |
| **Progressive disclosure**        | Showing advanced options only when they are needed, so simple things stay simple.                                                                                                  |
| **Svelte**                        | The UI framework the app is written in. It turns components into small, plain JavaScript.                                                                                          |
| **TypeScript**                    | JavaScript with type annotations. It catches many mistakes before the code ever runs.                                                                                              |
| **`.stammbaum` file**             | One family-tree project: a zip file containing `data.json` (the data) and `bilder/` (the pictures).                                                                                |

# CLAUDE.md – operating manual for agents in this repo

**Stammbaum** is a private, offline, self-contained family-tree web app (German UI) for desktop browsers.
It ships as one `Stammbaum.html` in a zip that can be emailed. **No data ever leaves the device.**
The repo is the development workspace (app + tooling + docs). Sessions get reset regularly, so the
repo itself must carry all context. Keep it that way.

## 1. Start of every session

1. Read [docs/agent/HANDOVER.md](docs/agent/HANDOVER.md) (current state, next steps, pitfalls).
2. Read [docs/requirements/REQUIREMENTS.md](docs/requirements/REQUIREMENTS.md) (the contract).
3. Run `git status` and `git log --oneline -10`. Make sure `node_modules/` exists (otherwise `npm install`).
4. Only then start work. If the user's request conflicts with the requirements, say so before acting.

## 2. The requirements are the contract

- Requirements are **binding, also in auto mode**. Build what is agreed, not more and not less.
- **Never** add, change or deviate from a requirement without the user's prior OK.
- **Be proactive.** If a change, an addition or a smarter alternative would help, propose it
  (as a `P-NNN` entry plus a short explanation in chat). Then wait for approval.
- Approved deviations go into the "Aligned deviations" table (`D-NNN`). Approved clarifications go into the "Clarifications log".
- Keep the `Status` / `Verified by` columns current whenever you implement or test something.
- Procedure: skill [`requirement-change`](.claude/skills/requirement-change/SKILL.md).

## 3. Working with the human developer

- Treat them as the **product owner**, with a rough engineering/software background but without deep
  development know-how. Explain technical concepts and trade-offs **in plain language**, with an
  analogy where it helps. Avoid unexplained jargon; add new terms to the glossary in [docs/README.md](docs/README.md).
- For decisions: give 2–3 options, **a clear recommendation** and the consequence of each, in a few sentences.
  Use the AskUserQuestion tool for real decisions.
- **UI/UX is their call.** Show options early (mock-ups, screenshots), ask for their opinion and take
  their feedback seriously. Do not finalize UI/UX on your own.
- Work proactively on the agreed scope. Do not silently expand the scope.
- Mock-ups and functional development start **only when the user explicitly asks**.

## 4. Architecture invariants (details: [docs/concept/architecture.md](docs/concept/architecture.md))

- `src/core/`: pure TypeScript. **No browser APIs** (lint-enforced). Data model, validation, dates, layout, migrations. Fully unit-tested.
- `src/storage/`: everything that touches files, IndexedDB and the File System Access API.
- `src/ui/`: Svelte 5 components. German texts only here.
- **Data ≠ logic:** family data only ever lives in project files (`*.stammbaum`) and the browser's working copy, never in the source.
- **Privacy:** no network access of any kind. No CDNs, web fonts, analytics or update checks. This is enforced by the CSP in
  `vite.config.ts`, the ESLint rules, `scripts/check-no-external-refs.mjs` and the E2E fixture. Never weaken any of these.
- New runtime dependency? Only with a good reason, pinned exact, and noted in an ADR. It gets bundled into the HTML.
- Code, comments and dev docs are in English. The UI and the end-user guide (`docs/user-guide/`) are in German.
- Key decisions are recorded as ADRs in [docs/agent/decisions/](docs/agent/decisions/). Read them before re-opening a decision.

## 5. Testing duty

- `npm run verify` = typecheck + lint + unit tests + build + E2E in Chromium, Firefox and WebKit. It must be green before every push.
- Every feature or bug fix comes **with tests**. Pure logic goes to `tests/unit/` and user flows to `tests/e2e/`.
- Every bug found gets a **regression test** first, then the fix.
- E2E tests use the `app` fixture from `tests/e2e/fixtures.ts`. It fails on any network request or console error.
- Maintain the test setup proactively. When you notice a gap (untested module, flaky test, slow suite), fix it or propose a fix.
- **Never** delete, skip or weaken a test just to get green. If a test is wrong, explain why and fix it in its own commit.

## 6. Git

- Small, well-scoped commits with conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `build:`, `refactor:`).
- Commit and **push to `main` after each green, coherent step**. Don't let work pile up. Bigger experiments go on a feature branch.
- The pre-push hook runs `npm run verify` (~25 s). **Never** use `--no-verify`. If the hook fails, fix the cause.
- Never commit real family data, secrets, build output (`dist/`, `release/`) or test reports.

## 7. Housekeeping

- **`.gitignore` is yours to maintain.** When a tool creates new output or cache folders, add them right away.
- **Delete stale artifacts:** temp files, probes, dead code, obsolete docs, unused dependencies. Do it before ending a session.
- **Docs are part of "done".** Update the README, `docs/`, the requirement statuses and the handover in the same piece of work as the code change.
- Use the session scratchpad (not the repo) for throwaway files.

## 8. Environment notes

- Node is installed via nvm (version in `.nvmrc`). If `node` is not found in the Bash tool, run
  `source ~/.nvm/nvm.sh` first, or prefix commands with `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- Commands: `npm run dev` (dev server), `npm run build`, `npm run verify`, `npm run package` (zip into `release/`). All of them are listed in [docs/README.md](docs/README.md).
- Playwright browsers live in `~/.cache/ms-playwright`. After a Playwright upgrade, run `npx playwright install chromium firefox webkit`.
  WebKit needs the system packages `libevent-2.1-7t64 libavif16`. The user installs them with sudo.

## 9. Keep improving this setup

- This setup is expected to evolve. If something in this file, the skills, the hooks or the tooling slows
  you down or caused a mistake, **propose an improvement** to the user.
- If you notice that you are re-deriving the same procedure, **write a skill** in `.claude/skills/<name>/SKILL.md`
  and list it below.
- Keep this file concise. Details belong in `docs/`, and this file links to them.

### Skills in this repo

| Skill                                                              | Use it when                                                                                               |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [`session-handover`](.claude/skills/session-handover/SKILL.md)     | Ending a session or reaching a milestone: update the handover, docs and statuses, clean up, verify, push. |
| [`requirement-change`](.claude/skills/requirement-change/SKILL.md) | Proposing, approving or recording a requirement change or deviation.                                      |
| [`release-package`](.claude/skills/release-package/SKILL.md)       | Building and checking the distributable zip for end users.                                                |

## 10. End of every session

Run the `session-handover` skill. A fresh session must be able to continue from `HANDOVER.md` alone.

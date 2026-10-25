# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-25 (session 11)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0008)
3. ~~Mock-ups~~ ✅ (session 2; `mockups/` deleted in S6, still in git history before `1bfe483`)
4. ~~Functional development~~ ✅ S1…S7 all done (sessions 3–10). Releases 0.9.0, 0.9.1, **0.10.0** (languages).
5. **Feedback and manual checks** ← current. Then 1.0.0.

## Done in session 11 (pre-1.0 review and fixes, not released yet)

- **Review** with three helper agents (data safety, core logic, offline/tests), every finding re-checked. No data-loss
  bug found: save/open round trip, dates in 3 languages, wrong files, autosave order all solid.
- **Card dates (D-001, user):** full dates on the card when they fit, else years, then smaller. Vague years with symbols,
  the same in every language: `~1850`, `<1900`, `>1900`, `1890/1895`; a wider space (`\u2002`) before `†`. Panel,
  tooltip and hints keep words. `<1900`/`>1900` can be typed; "v. 1900" is no longer read as "about".
  Root cause of the tiny year line: `fit()` read `line-height: normal` as NaN, so every year line shrank to 65 %.
- **Fixes (each with a regression test):** the app opens and saves files when the browser refuses IndexedDB;
  Chrome/Edge "Speichern" asks for a file again when the saved one was moved; an empty new relative is rewound
  (`History.rewind`), so ↶ can't bring back a "?"; step/foster siblings are no half siblings (user); an existing
  person linked as sibling gets the chosen kind only on the biological links.
- Left as is (reported to the user): layout gets slow above ~200 persons (TREE-05 says ~100); French "divers" wording.

## Next steps

- The user tries the fixes (build a new zip with `release-package`, e.g. 0.10.1, when they want one).
- The user runs `docs/manual-checks.md` on a real Mac (Safari) and Windows (now with check 9a, moved file). Record the
  results in that file's table, then set GEN-02, GEN-06 and DATA-09 to `Verified` (or fix what failed, regression test first).
- Feedback rounds: each piece of feedback that changes behaviour goes through `requirement-change` first.
- After the checks and fixes: 1.0.0 (skill `release-package`).

## Open items for the user

- Push the tags `v0.10.0` / `v0.9.0`? (Local only; optional.)
- A new zip with the session 11 fixes? (Not built yet.)
- Run the manual checklist on a Mac and on Windows. A French reader for `fr.ts` ("divers" for the gender option).

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npx prettier --write <files>` after editing code or Markdown.
  Prettier re-wraps German text: use `&nbsp;` where a break must not happen ("„+&nbsp;Kind“").
- Don't edit files while a `git push` runs: the pre-push hook verifies the working tree, not the commit.
- `svelte-check --fail-on-warnings`: a11y warnings fail the build. A prop read once at the top of a component
  (`state_referenced_locally`) → wrap it in `untrack(() => …)`.
- Svelte scopes CSS, so `.world.animate` outranks `.world` even inside `@media print`: repeat the stronger selector
  (this let the printout catch the tree mid-animation once).
- Print tests use `page.emulateMedia({ media: 'print' })` and stub `window.print` via `addInitScript`. A real PDF for a
  look: Chromium `page.pdf({ preferCSSPageSize: true })` in a scratchpad script.
- `.svelte.ts` files: lint wants `SvelteMap`/`SvelteDate`; `workspace.svelte.ts` disables that rule file-wide.
- `{@const x = dialog.y}` inside `{#if dialog?.type === …}` crashes when `dialog` becomes null, and a handler that clears
  `dialog` and then uses `x` gets `undefined` (it is lazy). Read the value inside the handler first (`takePhoto` in `PersonDialog`).
- E2E runs against `dist/`: run `npm run build` before `npx playwright test` on its own, or you test the old app.
- **WebKit refuses Blobs in IndexedDB** in private windows and in Playwright → pictures are stored as `ArrayBuffer`.
- Chromium has `showSaveFilePicker`: E2E for the download path removes the pickers with `addInitScript`.
- E2E reads IndexedDB directly to wait for stored state before a reload (`storedProject` in `files.spec.ts`,
  `waitUntilRemembered` in `help.spec.ts`).
- Playwright's WebKit renames download files and needs ~1.2 s to repaint a 100-person selection (see `large.spec.ts`).
- Screenshots: throwaway script in the scratchpad importing `<repo>/node_modules/@playwright/test/index.mjs`.
- Never import from a `*.test.ts` file. Shared test helpers live in `tests/unit/helpers.ts`.
- `exactOptionalPropertyTypes`: leave keys out instead of `undefined` (use `...(x ? { x } : {})`).
- The singlefile build inlines Svelte's error-doc URLs; allow-listed in `scripts/check-no-external-refs.mjs`.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- New UI text: add it to `de.ts`, then `en.ts` and `fr.ts` (the typecheck lists what's missing). Never write text into a
  `.svelte` file's markup (the i18n unit test fails). E2E tests stay German (`locale: 'de-DE'`); `i18n.spec.ts` imports
  the dictionaries for English and French texts.
- `eslint` rejects literal no-break spaces in template literals: write `\u00a0` (French « » and before ? ! : ;).
- A `|` inside a Markdown table cell must be written `\|`, or prettier splits the row into extra columns.
- `npm run package` overwrites `release/Stammbaum-<version>.zip`: bump the version first. An old zip is rebuilt from its
  tag in a `git worktree` with a `node_modules` symlink.
- Never keep a version of the project in a `$state` object (e.g. the dialog): Svelte wraps it in a proxy, and identity
  checks against the history fail. `ProjectScreen` keeps `beforeAdd` in a plain variable for that reason.
- `fit()` in `PersonCard.svelte`: `line-height: normal` is not a number; the half-line tolerance falls back to the font size.
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine; a new machine needs them (sudo, by the user).

## Known gaps

- No real Safari/macOS or Windows check yet; the real Chrome/Edge file picker and the restart permission are untested by E2E.
- Printing on another paper size than A4 landscape: the tree stays sized for A4 landscape (smaller or cut off).
- No two-tab protection (architecture §7): two tabs with the same working copy overwrite each other. Not planned.
- The working copy in IndexedDB has no schema version yet; version it at the first schema bump (architecture §5).
- Opening by drag & drop gives no file handle: in Chrome/Edge, "Speichern" then asks for a file ("Speichern unter").
- Changes that are undone back to the saved state still count as unsaved.
- "+ Geschwister" for a person without parents, then leaving the new sibling empty: the new "?" parent stays.
- Lines don't glide with the cards; they jump to the new layout. Line crossings can still happen in some shapes.

# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-11-01 (session 16)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0008)
3. ~~Mock-ups~~ ✅ (session 2; `mockups/` deleted in S6, still in git history, see `git log --diff-filter=D -- mockups`)
4. ~~Functional development~~ ✅ S1…S7 all done (sessions 3–10). Releases 0.9.0, 0.9.1, 0.10.0 (languages), 0.11.0 (layout work, years only on the card), 0.12.0 (Enter in dialogs, double-click edits), **0.13.0** (tab icon, pinch zoom, phone note).
5. **Feedback and manual checks** ← current. Then 1.0.0.

## Done in session 16 (tab icon, pinch, phones; release 0.13.0)

- **GEN-10 tab icon**: the round tree (user's pick from ten drafts; olive `#86a33a` crown, trunk `#8f6b0c`), an inline
  SVG `data:` URI in `index.html`, so nothing is loaded. `smoke.spec.ts` checks it is drawn under the CSP.
- **TREE-06 pinch to zoom** on touch screens: `pinchView` in `geometry.ts`, pointer tracking in `TreeView.svelte`
  (one finger left after a pinch pans on). E2E sends synthetic touch `PointerEvent`s (Playwright has no multi-touch).
  The user confirmed it works on their phone (0.13.0, live site).
- **Phones: view only and untested** (user, 2026-11-01): said in GEN-07, README and the three guides, no code.
  On the user's phone, saving gave an XML file instead of a `.stammbaum`: noted under FUT-02, not investigated.
- **Release 0.13.0** (tag pushed), live on GitHub Pages.

## Done in session 15 (distribution as a committed folder)

- No release zip any more (ADR-0002): the committed **`Stammbaum/`** folder, refreshed only by `npm run release`.
- Repo is public. **GEN-09: the app runs live on GitHub Pages**, https://bimo3000.github.io/family-tree/
  (`.github/workflows/pages.yml` publishes `Stammbaum/` when a release changes it; `tests/e2e/hosted.spec.ts`).

## Next steps

- The user tries 0.13.0 (`Stammbaum/` folder or the live site).
- The user runs `docs/manual-checks.md` on a real Mac (Safari) and Windows (now with check 9a, moved file). Record the
  results in that file's table, then set GEN-02, GEN-06 and DATA-09 to `Verified` (or fix what failed, regression test first).
- Feedback rounds: each piece of feedback that changes behaviour goes through `requirement-change` first.
- After the checks and fixes: 1.0.0 (skill `release`).

## Open items for the user

- Delete `~/family-tree-backup-before-rewrite.bundle` once happy (old history).
- Run the manual checklist on a Mac and on Windows. A French reader for `fr.ts` ("divers" for the gender option).
- Look at the new crossing breaks and the highlight through the couple line in your tree; do they look right?

## Pitfalls / environment notes

- `npm run verify` now takes ~3 min (not ~25 s; the E2E suite grew). In session 16 the pre-push hook failed once without a
  visible cause and passed on the next run: if it happens again, keep the full log (`git push > log 2>&1`) and find the test.

- **README demo GIF** (`docs/assets/demo.gif`): recorded by `npm run demo-gif` (storyline `scripts/demo-gif/demo.spec.ts`,
  frames → GIF with Python/Pillow in `make-gif.py`). Re-run it after visible UI changes and look at the result before committing.

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
- **Never publish another GitHub Pages site under `bimo3000`**: it would share the browser storage of
  `bimo3000.github.io` with the live app and could read visitors' working copies (ADR-0002).
- `npm run release` rewrites the committed `Stammbaum/` folder: only on a release, after the version bump (the unit
  test fails if the folder's version differs from `package.json`). `.gitattributes` keeps the guides' CRLF there.
- Never keep a version of the project in a `$state` object (e.g. the dialog): Svelte wraps it in a proxy, and identity
  checks against the history fail. `ProjectScreen` keeps `beforeAdd` in a plain variable for that reason.
- `fit()` in `PersonCard.svelte`: `line-height: normal` is not a number; the half-line tolerance falls back to the font size.
- Quick layout experiments without vitest: `node --import <loader>` with a resolve hook that appends `.ts` / `/index.ts`
  (Node 24 strips types itself), e.g. to count crossings of a project file. Keep such scripts in the scratchpad.
- **History was rewritten on 2026-10-31.** Any clone made before that must be deleted and cloned again; pushing from
  it would bring the old author data back.
- `vite.config.ts`: the single-file plugin keeps the inlined chunks (`deleteInlinedFiles: false`) so Vite's
  `build.license` can see them; our plugin deletes them in `writeBundle`. `dist/` = `Stammbaum.html` + `licenses.md`.
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine; a new machine needs them (sudo, by the user).

## Known gaps

- No real Safari/macOS or Windows check yet; the real Chrome/Edge file picker and the restart permission are untested by E2E.
- Printing on another paper size than A4 landscape: the tree stays sized for A4 landscape (smaller or cut off).
- No two-tab protection (architecture §7): two tabs with the same working copy overwrite each other. Not planned.
- The working copy in IndexedDB has no schema version yet; version it at the first schema bump (architecture §5).
- Opening by drag & drop gives no file handle: in Chrome/Edge, "Speichern" then asks for a file ("Speichern unter").
- Changes that are undone back to the saved state still count as unsaved.
- "+ Geschwister" for a person without parents, then leaving the new sibling empty: the new "?" parent stays.
- Lines don't glide with the cards; they jump to the new layout. Some crossings remain where no simple order avoids
  them (user's tree: 4, around a family with children between two siblings); they are drawn with a break.
- Layout time: 100 persons ~20 ms, 200 persons ~90 ms.

# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-25 (session 10)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0008)
3. ~~Mock-ups~~ ✅ (session 2; `mockups/` deleted in S6, still in git history before `1bfe483`)
4. ~~Functional development~~ ✅ S1…S6 all done (sessions 3–8). **Release 0.9.0** (test version).
   Session 9: photo cropping (PERS-08). **Release 0.9.1**. Session 10: **S7 languages** (GEN-05). **Release 0.10.0**.
5. **Feedback and manual checks** ← current. Then 1.0.0.

## Done in session 10 (slice S7, English and French, GEN-05, was P-010)

- User decisions (2026-10-25, clarifications log): language choice on the start screen and at the bottom of the project
  menu, remembered per browser (IndexedDB key `language`), not in the project file; no choice → browser language, else
  English; three guides in the zip; dates DE `12.03.1923`, EN `12 Mar 1923`, FR `12/03/1923`; years must fit on the card.
- **How texts work now (ADR-0008):** every UI text is in `src/ui/i18n/de.ts` (master copy). `en.ts` and `fr.ts` are typed
  `Texts`, so a missing text fails the typecheck. Components read `t.section.text` from `i18n/index.svelte.ts` (a Proxy
  over the current dictionary, reactive: switching re-renders without a reload). Grammar (relation words, articles,
  dates) is written per language as small functions. `tests/unit/ui/i18n.test.ts` fails on text written in a `.svelte`
  file's markup or a German string literal outside `i18n/`.
- **Dates:** `parseDate` (core) reads German, English and French at once, always day first; `jui` stays text. Display per
  language; the card uses short qualifiers (`dates.card`). Each language round-trips `parseDate(fmtDate(d))` (unit test).
- **Bugs found and fixed (regression tests first):** a range shown as "1890 bis 1895" was read back as a text date when
  any field of the person changed; a long year line ("* vor 1890 † nach 1925") was cut off on the card, also in German.
  The year line now shrinks like the name (`fit()` in `PersonCard.svelte`, down to 65 %).
- French texts and `Mode-d-emploi.md` were written by a helper agent and reviewed. "Annuler" is both undo and cancel
  (usual in French apps); a step-child is "Bel-enfant"; the app keeps its name "Stammbaum" in every language.
- **Release 0.10.0** (`release/Stammbaum-0.10.0.zip`): Anleitung.txt, Guide.txt, Mode-d-emploi.txt. Tag `v0.10.0` is
  **local only** until the user OKs pushing it.

## Done after 0.9.1 (feedback)

- **Long names on a card:** all given names if they fit, else only the first; then the name shrinks (down to 70 %), so
  the surname is never cut off. Fitting is measured in `PersonCard.svelte` (`fit`). Letters below the line ("g")
  are no longer cut off (line height 1.3). Firefox reports a few px more height for a clamped box: the fit check allows
  half a line. The chosen name depends on the font, so engines may differ ("Heinrich Brandt" in WebKit).
  Since session 10 the same `fit()` also shrinks the year line.

## Done in session 8 (slice S6, finish and release)

- Print (one A4 landscape page, browser dialog), help dialog and hint bar, `Beispiel.stammbaum` in the zip, German user
  guide, `docs/manual-checks.md`. Release `release/Stammbaum-0.9.0.zip`; tag `v0.9.0` is **local only** until the user OKs pushing it.

## Next steps

- The user tries 0.10.0 (all three languages) and, ideally, a French-speaking relative reads the French texts once.
  Wording changes are small edits in `src/ui/i18n/fr.ts` (and `Mode-d-emploi.md`).
- The user runs `docs/manual-checks.md` on a real Mac (Safari) and Windows (now with check 14, languages). Record the
  results in that file's table, then set GEN-02, GEN-06 and DATA-09 to `Verified` (or fix what failed, regression test first).
- Feedback rounds: each piece of feedback that changes behaviour goes through `requirement-change` first.
- After the checks and fixes: 1.0.0 (skill `release-package`).

## Open items for the user

- Push the tag `v0.10.0`? (Local only. `v0.9.0` is also still local only; pushing it is optional.)
- Try 0.10.0: unzip `release/Stammbaum-0.10.0.zip`, double-click `Stammbaum.html`, switch the language at the bottom of
  the start screen. Feedback wanted on the English and French wording and the language row's look.
- Run the manual checklist on a Mac and on Windows.

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
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine; a new machine needs them (sudo, by the user).

## Known gaps

- No real Safari/macOS or Windows check yet; the real Chrome/Edge file picker and the restart permission are untested by E2E.
- Printing on another paper size than A4 landscape: the tree stays sized for A4 landscape (smaller or cut off).
- No two-tab protection (architecture §7): two tabs with the same working copy overwrite each other. Not planned.
- Opening by drag & drop gives no file handle: in Chrome/Edge, "Speichern" then asks for a file ("Speichern unter").
- Changes that are undone back to the saved state still count as unsaved.
- "+ Geschwister" for a person without parents, then leaving the new sibling empty: the new "?" parent stays.
- Lines don't glide with the cards; they jump to the new layout. Line crossings can still happen in some shapes.

# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-25 (session 9)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0007)
3. ~~Mock-ups~~ ✅ (session 2; `mockups/` deleted in S6, still in git history before `1bfe483`)
4. ~~Functional development~~ ✅ S1…S6 all done (sessions 3–8). **Release 0.9.0** (test version).
   Session 9: photo cropping (PERS-08) added on request. **Release 0.9.1** (test version for the manual checks).
5. **Feedback and manual checks** ← current. Then 1.0.0.

## Done in session 9 (photo cropping, PERS-08, was P-009)

- User decisions: the part is **cut out permanently** when the photo is added (best quality: cut from the original,
  then max. 2000 px); the crop view opens **right after "Foto wählen …"**. No "Ausschnitt ändern": choose the photo again.
- `src/core/photoCrop.ts` (7:5 part, zoom 1–5×, move, placement), `src/ui/dialogs/PhotoCropper.svelte` (drag, arrow
  keys, "Größe" slider; 560×400 frame, no extra preview), shown inside `PersonDialog` in place of the form. `preparePicture(file, crop)`.
- Tests: 342 unit, 53 E2E per engine (`photos.spec.ts`: 7:5 size, zoom, mouse/keys, cancel/Esc).
- **Release 0.9.1** (`release/Stammbaum-0.9.1.zip`, 61 kB): zip checked, unzipped app opened in all three engines,
  `Beispiel.stammbaum` opened, a photo cropped. Tag `v0.9.1` pushed (user's OK).
- **P-010 multi-language UI** (German, English, French) noted as an idea only: app texts only; project data, `Stammbaum.html`
  and `.stammbaum` stay as they are. No concept yet; build only after the user decides.
- User tried it ("works nice"): the preview was dropped as redundant. "Speichern unter" with an own file name in
  Firefox/Safari was discussed and dropped (clarifications log, 2026-10-25).

## Done after 0.9.1 (feedback)

- **Long names on a card:** all given names if they fit, else only the first; then the name shrinks (down to 70 %), so
  the surname is never cut off. Fitting is measured in `PersonCard.svelte` (`fitName`). Letters below the line ("g")
  are no longer cut off (line height 1.3). Firefox reports a few px more height for a clamped box: the fit check allows
  half a line. The chosen name depends on the font, so engines may differ ("Heinrich Brandt" in WebKit).

## Done in session 8 (slice S6, finish and release)

- Print (one A4 landscape page, browser dialog), help dialog and hint bar, `Beispiel.stammbaum` in the zip, German user
  guide, `docs/manual-checks.md`. Release `release/Stammbaum-0.9.0.zip`; tag `v0.9.0` is **local only** until the user OKs pushing it.

## Next steps

- The user tries 0.9.1 and runs `docs/manual-checks.md` on a real Mac (Safari) and Windows. Record the results in that
  file's table, then set GEN-02, GEN-06 and DATA-09 to `Verified` (or fix what failed, with a regression test first).
- Feedback rounds: each piece of feedback that changes behaviour goes through `requirement-change` first.
- After the checks and fixes: 1.0.0 (skill `release-package`).

## Open items for the user

- The tag `v0.9.0` is still local only (0.9.1 replaces it for testing; pushing it is optional).
- Try 0.9.1: unzip `release/Stammbaum-0.9.1.zip`, double-click `Stammbaum.html`. Feedback wanted on the printout,
  the help text, the hint bar, and everything from S5 (start screen, menu, save status, reminder).
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
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine; a new machine needs them (sudo, by the user).

## Known gaps

- No real Safari/macOS or Windows check yet; the real Chrome/Edge file picker and the restart permission are untested by E2E.
- Printing on another paper size than A4 landscape: the tree stays sized for A4 landscape (smaller or cut off).
- No two-tab protection (architecture §7): two tabs with the same working copy overwrite each other. Not planned.
- Opening by drag & drop gives no file handle: in Chrome/Edge, "Speichern" then asks for a file ("Speichern unter").
- Changes that are undone back to the saved state still count as unsaved.
- "+ Geschwister" for a person without parents, then leaving the new sibling empty: the new "?" parent stays.
- Lines don't glide with the cards; they jump to the new layout. Line crossings can still happen in some shapes.

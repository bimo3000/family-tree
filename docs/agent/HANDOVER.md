# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 7)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0007)
3. ~~Mock-ups~~ ✅ (session 2, all UI questions decided)
4. **Functional development** ← current. S1 ✅ (s3), S2 ✅ (s4), S3 ✅ (s5), S4 ✅ (s6), S5 ✅ (s7). Next: **S6 finish and release**.

## Done in session 7 (slice S5, working copy, files, pictures)

- User decisions: **P-008 rejected**; before another project replaces one with unsaved changes the app **asks**
  ([Jetzt speichern] [Ohne Speichern weiter] [Abbrechen]). So the browser keeps **one** working copy.
- `src/storage/`: `projectFile.ts` (zip via fflate 0.8.3), `workingCopy.ts` (IndexedDB: project + file info, pictures, file
  handle, "seen" hints), `files.ts` (pickers, write into a file, download, file names), `pictures.ts` (decode, ≤ 2000 px, JPEG),
  `latest.ts` (one write at a time, newest next).
- State: `src/ui/state/workspace.svelte.ts` (open/replace, autosave, save status, Chrome/Edge writes 2 s after a change,
  photos and their `blob:` URLs), `reminder.ts`. `Editor` got an `onchange` callback.
- UI: `App.svelte` (start screen or project, open/save, unsaved question, download hint, drag & drop, "Seite verlassen?"),
  `StartScreen.svelte`, `ProjectScreen.svelte` (former App: top bar with project menu, status, Speichern, reminder),
  `NameDialog`, `UnsavedDialog`, photo row in `PersonDialog`, photos on cards and panel (`photos.ts` context), `toast.svelte.ts`.
- Core: `setPhoto`, `removePhoto`, `renameProject`; `deletePerson` drops the person's image.
- Tests: 328 unit, 43 E2E per engine (one Chromium only) (new: `files.spec.ts`, `photos.spec.ts`, `large.spec.ts`). Fixture has `openExample()`
  and `reload()` (accepts "Seite verlassen?" and tells whether it was asked).

## Next steps

- **S6 (finish and release), status Todo.** Start in a **fresh session** via `next-slice`. Ask the print question first
  (roadmap "Decisions to raise").
- Before S6 is done: the manual checklist must include the real file picker in Chrome/Edge (DATA-09 is `Implemented`, not
  `Verified`: E2E uses a stand-in picker) and the permission question after a browser restart.

## Open items for the user

- Try S5: `npm run build`, double-click `dist/Stammbaum.html`. Start screen → new tree or example → edit → reload (kept) →
  Speichern (Chrome/Edge: choose a file, then changes go in by themselves; Firefox: download + hint) → add a photo.
- Feedback wanted on: start screen, project menu, save status, the unsaved question, the download hint, the reminder note.
- Try a few **real photos** (also an iPhone HEIC in Chrome: should give the "als JPG speichern" message).
- A manual check on a real Mac (Safari) and on Windows.

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npx prettier --write <files>` after editing code or Markdown.
- Don't edit files while a `git push` runs: the pre-push hook verifies the working tree, not the commit.
- `svelte-check --fail-on-warnings`: a11y warnings fail the build. An unneeded `svelte-ignore` fails lint too. A prop read once
  at the top of a component (`state_referenced_locally`) → wrap it in `untrack(() => …)`.
- `.svelte.ts` files: lint wants `SvelteMap`/`SvelteDate` for every `new Map`/`new Date`; `workspace.svelte.ts` disables that
  rule file-wide (its maps and dates are not shown directly).
- `{@const x = dialog.y}` inside `{#if dialog?.type === …}` crashes when `dialog` becomes null (the const re-evaluates). Read
  the value inside the handler instead (see `next()` in `App.svelte`).
- **WebKit refuses Blobs in IndexedDB** in private windows and in Playwright → pictures are stored as `ArrayBuffer`.
- Chromium has `showSaveFilePicker`: an E2E click on "Speichern" would open a real picker and hang. Tests for the download
  path remove the pickers with `addInitScript` (`withoutFilePickers` in `files.spec.ts`); the in-place test uses a stand-in handle.
- E2E reads the working copy directly from IndexedDB (`storedProject` in `files.spec.ts`) to wait until a change is stored before reloading.
- Playwright's WebKit renames download files (`Familie_Brandt.stammbaum`).
- Playwright's WebKit on Linux needs ~1.2 s to repaint after selecting in a 100-person tree (card shadows, software rendering).
  `large.spec.ts` lets the selection settle before measuring. Check on a real Mac; if slow there, the card shadow is the lever (ask the user, it's look and feel).
- Screenshots: throwaway script in the scratchpad importing `<repo>/node_modules/@playwright/test/index.mjs`. With `npx tsx`,
  pass `page.evaluate` a string (tsx adds `__name` helpers that don't exist in the page).
- Dialog forms fill their fields once (`untrack`); after undo/redo they are rebuilt via `{#key editor.revision}`. A photo
  changes on its own, so `PersonDialog` takes `photoId` from the live `person`, not from its start copy.
- Never import from a `*.test.ts` file. Shared test helpers live in `tests/unit/helpers.ts`.
- `exactOptionalPropertyTypes`: leave keys out instead of `undefined` (use `...(x ? { x } : {})`).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`); allow-listed in `scripts/check-no-external-refs.mjs`.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine; a new machine needs them (sudo, by the user).

## Known gaps

- No real Safari/macOS or Windows check yet; the real Chrome/Edge file picker and the restart permission are untested by E2E.
- No two-tab protection (architecture §7): two tabs with the same working copy overwrite each other. Not planned; propose if wanted.
- Opening by drag & drop gives no file handle: in Chrome/Edge, "Speichern" then asks for a file ("Speichern unter").
- Changes that are undone back to the saved state still count as unsaved.
- "+ Geschwister" for a person without parents, then leaving the new sibling empty: the sibling is removed, the new "?" parent stays.
- Lines don't glide with the cards; they jump to the new layout. Line crossings can still happen in some shapes.

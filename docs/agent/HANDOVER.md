# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 6)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0007)
3. ~~Mock-ups~~ ✅ (session 2, all UI questions decided)
4. **Functional development** ← current. S1 ✅ (s3), S2 ✅ (s4), S3 ✅ (s5), S4 ✅ (s6). Next: **S5 working copy, files, pictures**.

## Done in session 6 (slice S4, editing)

- User decisions: **P-006 rejected**; the **working copy moves from S4 to S5** (until files exist it would only keep edits to the example).
- Core: `src/core/model/relatives.ts` (addChild/Partner/Parent/Sibling with new or existing person, `childKindNeeded`,
  `cutOffBy`, `removeRelation`, `ends`), tests in `tests/unit/relatives.test.ts`.
- State: `src/ui/state/history.ts` (undo/redo, max 100, same-key changes merge into one step, `seal()`),
  `editor.svelte.ts` (project, selection, `apply`/`add`, `revision` counter bumped by undo/redo).
- UI: `src/ui/dialogs/` (Modal on native `<dialog>`, PersonDialog, AddRelativeDialog, DeleteDialog, RelationDialog,
  RemoveRelationDialog, DateField, `fields.ts`); panel actions and ✎/× per relation; ↶ ↷ in the top bar, Ctrl+Z/Y;
  toast; cards glide (`left`/`top` transition). Shared button/form/dialog CSS now in `theme.css`.
- Decided on the user's behalf: no photo row and no save status yet (S5, no dummy buttons); a new relative left
  completely empty is removed again when its dialog closes ("nothing entered, nothing added").
- Tests: 309 unit, 28 E2E per engine (`tests/e2e/editing.spec.ts` new).
- User feedback after trying S4, all done: "Mehr Angaben" no longer closes while typing (`bind:open`);
  **the Rufname field is removed** (clarifications log); layout fix: every other upward sweep breaks ties the other
  way round, so two families tied for one place can pass each other (ADR-0006). A geometric `lineCrossings` check is
  in `tests/unit/layout/invariants.test.ts`.

## Next steps

- **S5 (working copy, project files, pictures), status Todo.** Big slice: start it in a **fresh session** via `next-slice`.
  Raise P-008 when photos make files big (roadmap "Decisions to raise").
- The editor (`src/ui/state/editor.svelte.ts`) is where the working-copy autosave and the dirty flag hook in.
- `deletePerson` still leaves `images` alone (remove the picture when its person goes, S5).

## Open items for the user

- Try the editing: `npm run build`, double-click `dist/Stammbaum.html`. A reload resets to the example until S5.
- Feedback wanted on the card glide (cards move, lines jump to their new place).
- Tell us about any other layout with crossing lines (a description of the family is enough).
- A manual check on a real Mac (Safari) and on Windows.

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npx prettier --write <files>` after editing code or Markdown.
- Don't edit files while a `git push` runs: the pre-push hook verifies the working tree, not the commit.
- `svelte-check --fail-on-warnings`: a11y warnings fail the build. An unneeded `svelte-ignore` fails lint too.
- Wheel zoom needs a non-passive listener (in an `$effect` in `TreeView.svelte`), not `onwheel`.
- A click on a card can move it (panel opens, cards glide). The second click of a double-click is ignored on the background (`e.detail > 1`).
- E2E: measure positions inside `expect.poll`. Playwright waits for gliding cards to stand still before clicking.
- The native modal `<dialog>` makes the rest of the page inert: ↶ ↷ can't be clicked while a dialog is open. Ctrl+Z
  works outside text fields; inside a text field it is the browser's own undo (which fires `input`, so it still applies).
- Dialog forms fill their fields once (`untrack`); after undo/redo App.svelte rebuilds them via `{#key editor.revision}`.
- Radios: use `checked={…}` + `onchange`, not `bind:group` plus `onchange` (order of updates is unclear).
- An empty person counts as a placeholder ("?" node, `isPlaceholder`): a new relative shows as "?" until a field is filled,
  and `dropEmptyPlaceholders` removes empty childless ones after relation removals.
- Screenshots: throwaway script in the scratchpad importing `<repo>/node_modules/@playwright/test/index.mjs`, `chromium.launch()`, `file://…/dist/Stammbaum.html`.
- Never import from a `*.test.ts` file. Shared test helpers live in `tests/unit/helpers.ts`.
- `exactOptionalPropertyTypes`: leave keys out instead of `undefined` (use `...(x ? { x } : {})`).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`); allow-listed in `scripts/check-no-external-refs.mjs`.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine; a new machine needs them (sudo, by the user).

## Known gaps

- No real Safari/macOS or Windows check yet.
- Rendering 100 persons in the browser is unchecked (possible once files open, S5).
- No photos yet (initials placeholder); photos come with S5.
- "+ Geschwister" for a person without parents, then leaving the new sibling empty: the sibling is removed, the new "?" parent stays.
- Lines don't glide with the cards; they jump to the new layout.
- Line crossings can still happen in other shapes (the generated 100-person fixture has some). The user asked for
  better layouts "or somehow user-editable". Manual arrangement was ruled out before (clarification 2026-10-24,
  positions go stale); if crossings keep bothering the user, propose a small option as a `P-NNN` first.

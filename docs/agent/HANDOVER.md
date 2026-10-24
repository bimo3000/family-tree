# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 5)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0007)
3. ~~Mock-ups~~ ✅ (session 2, all UI questions decided)
4. **Functional development** ← current. S1 ✅ (session 3), S2 ✅ (session 4), S3 ✅ (session 5). Next: **S4 editing + working copy**.

## Done in session 5 (slice S3, `src/ui/`)

- The app opens the embedded example (`examples/familie-brandt.json`, loaded by `src/ui/example.ts`) and shows it as a
  read-only tree: pan (drag), zoom (wheel, `+`/`−`), "Alles anzeigen", double-click centres, hover tooltip, click selects
  (line highlighted, others faded), detail panel with facts and "Familie" groups, Esc / × / background click deselect.
- Structure: `App.svelte` (shell, selection), `tree/TreeView.svelte` (view, lines, tooltip), `tree/PersonCard.svelte`,
  `tree/geometry.ts` (paths, view math, highlight rule), `panel/DetailPanel.svelte`, `panel/family.ts`, `text.ts`
  (all German display texts), `theme.css` (colours from the mock-up).
- The unit-test fixture `tests/fixtures/familie-brandt.ts` now reads the same JSON file (one source for app and tests).
- Tests: 271 unit, 14 E2E per engine (`tests/e2e/tree.spec.ts`, smoke test adapted).
- User decisions: example embedded; **P-005 search rejected**; ADR-0006 layout choices **confirmed**; the "?" node is
  larger and more visible (56 px). Undo/redo buttons come with S4, the save status with S5 (no dummy buttons).

## Next steps

- **S4 (editing + working copy), status Todo.** Big slice: start it in a **fresh session** via the skill `next-slice`.
  Raise P-006 (plausibility hints) first (roadmap "Decisions to raise"). Look at the mock-up's person dialog, add-relative
  flows and relation dialogs (`mockups/shared/prototype.js` from line ~700) before building.
- `src/ui/App.svelte` holds `project` as a plain constant today. S4 moves it into `src/ui/state/` with undo/redo.
- Cards should glide to new places after a change (ui-concept §3): add a transition on `left`/`top` in `PersonCard.svelte`.
- Proposals still waiting: P-006 (plausibility hints), P-008 (smaller copy for email). The roadmap says when to ask.

## Open items for the user

- A manual check on a real Mac (Safari) and on Windows (`npm run build`, double-click `dist/Stammbaum.html`).

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npx prettier --write <files>` after editing code or Markdown.
- Don't edit files while a `git push` runs: the pre-push hook verifies the working tree, not the commit.
- `svelte-check` runs with `--fail-on-warnings`: Svelte a11y warnings fail the build. Interactive things are `<button>`s;
  the pannable background has a commented `svelte-ignore` (mouse-only extra).
- Wheel zoom needs a non-passive listener (added in an `$effect` in `TreeView.svelte`), not `onwheel`.
- Read the viewport size from the element when needed (`size()` in `TreeView.svelte`); the panel changes it.
- E2E: measure positions after the UI settled (inside `expect.poll`), e.g. the panel opening shrinks the viewport.
- Screenshots for a look: a throwaway Node script in the scratchpad importing
  `<repo>/node_modules/@playwright/test/index.mjs`, `chromium.launch()`, `page.goto('file://…/dist/Stammbaum.html')`.
- Prettier keeps objects multi-line if the source has a line break after `{`. Generated fixtures: write one entry per line.
- Never import from a `*.test.ts` file: Vitest then runs that file's tests twice. Shared test helpers live in `tests/unit/helpers.ts`.
- `tsconfig` has `exactOptionalPropertyTypes`: you can't pass `field: undefined`; leave the key out (or pass `''`, operations drop it).
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine. A new machine needs them again (sudo, by the user).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`). They are allow-listed in
  `scripts/check-no-external-refs.mjs`, because they are only strings and are never fetched.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- Use the session scratchpad for throwaway files. If it is unavailable, use `tmp/` (git-ignored) and delete it afterwards.

## Known gaps

- No real Safari/macOS or Windows check yet.
- Rendering 100 persons in the browser is unchecked (only the layout's speed is tested); possible once files open (S5).
- No photos yet (initials placeholder); photos come with S5.
- `deletePerson` leaves `images` and `view.focusPersonId` alone (noted in the roadmap for S4/S5).
- Layout: a person with three or more partners is the busiest shape; the 100-person fixture keeps 5 line crossings.

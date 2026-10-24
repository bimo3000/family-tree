# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 4)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0007)
3. ~~Mock-ups~~ ✅ (session 2, all UI questions decided)
4. **Functional development** ← current. S1 ✅ (session 3), S2 ✅ (session 4). Next: **S3 tree view (read-only)**.

## Done in session 4 (slice S2, `src/core/layout/`)

- `computeLayout(project, sizes?)` → cards (centre, size, placeholder flag), couple lines, child lines, width/height.
  Steps: `generations.ts` (rows) → `order.ts` (blocks, sweeps, swaps) → `coordinates.ts` (x) → `lines.ts`. `graph.ts`
  holds the lookup tables and the `get`/`mean` helpers. Details and the decisions taken: ADR-0006 (now Accepted).
- Fixture families in `tests/fixtures/layout-families.ts` (builder `family()`, 11 shapes incl. a generated 100-person
  family). Tests in `tests/unit/layout/` (step tests, line geometry, invariants on every family). 246 unit tests in total.
- Familie Brandt comes out in exactly the mock-up's order. 100 persons take about 25 ms.

## Next steps

- **S3 (tree view, read-only), status Todo.** Start it in a **fresh session** (switch from core logic to UI).
  First raise the S3 entries under "Decisions to raise" in `docs/agent/ROADMAP.md` (example data, search, and
  confirming the layout choices of ADR-0006 by showing them). Port colours from `mockups/shared/style.css`.
- A fresh session without a specific task runs the skill `next-slice` and works on its own (CLAUDE.md §1).
- Proposals still waiting: P-005 (search), P-006 (plausibility hints), P-008 (smaller copy for email). The roadmap says when to ask.

## Open items for the user

- A manual check on a real Mac (Safari) and on Windows, once there is something to see (after S3).
- In S3: look at the automatic layout and confirm or adjust the choices listed in ADR-0006.

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npx prettier --write <files>` after editing code or Markdown.
- Don't edit files while a `git push` runs: the pre-push hook verifies the working tree, not the commit.
- Looking at a layout without the UI: a throwaway vitest file outside `tests/unit/` (own `--config` with `root` set to
  the repo) can call `computeLayout`, write an SVG and screenshot it with `chromium` from `@playwright/test`.
- Prettier keeps objects multi-line if the source has a line break after `{`. Generated fixtures: write one entry per line.
- Never import from a `*.test.ts` file: Vitest then runs that file's tests twice. Shared test helpers live in `tests/unit/helpers.ts`.
- `tsconfig` has `exactOptionalPropertyTypes`: you can't pass `field: undefined`; leave the key out (or pass `''`, operations drop it).
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine. A new machine needs them again (sudo, by the user).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`). They are allow-listed in
  `scripts/check-no-external-refs.mjs`, because they are only strings and are never fetched.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- Rendering lessons from the mock-up: selection is a tight ring (box-shadow). `✎` renders badly: use SVG icons. ⚭ is missing on Linux fonts.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- Use the session scratchpad for throwaway files. If it is unavailable, use `tmp/` (git-ignored) and delete it afterwards.

## Known gaps

- No real Safari/macOS or Windows check yet.
- `src/storage/` and `src/ui/` contain only the setup stubs. Nothing is visible in the app yet.
- `deletePerson` leaves `images` and `view.focusPersonId` alone (noted in the roadmap for S4/S5).
- Layout: a person with three or more partners is the busiest shape (arching couple line, crossing child lines);
  the 100-person fixture keeps 5 line crossings. Both are readable; revisit only if the user finds them confusing.

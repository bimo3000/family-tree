# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 3)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0007)
3. ~~Mock-ups~~ ✅ (session 2, all UI questions decided)
4. **Functional development** ← current. Slice S1 ✅ (session 3). Next: **S2 automatic tree layout**.

## Done in session 3 (slice S1, `src/core/`)

- `model/types.ts`: the data model per `data-model.md`. `model/project.ts`: `newId`, `createProject`.
- `dates.ts`: `parseDate` (German input, real calendar check, unreadable input kept as `{ text }`), `dateSortKey`.
- `model/queries.ts`: parents/children, partnerships ordered by start date, full/half siblings, ancestors, descendants,
  `focusSet`, `connectedComponent` (cut-off check), `isPlaceholder`.
- `model/validation.ts` + `model/operations.ts`: pure operations that throw a coded `ModelError`. Unknown-parent placeholders
  are created by `addUnknownParent` and removed with their last child link.
- `serialization.ts` + `migrations/`: `data.json` in and out, `schemaVersion` 1, migration registry, stored v1 sample.
- Fixtures: `tests/fixtures/familie-brandt.ts` (ported from the mock-up), `tests/fixtures/schema-v1.json`. 124 unit tests.
- Decisions taken on the user's behalf are listed in `data-model.md` §3 ("How the code applies these rules").

## Next steps

- **S2 (automatic tree layout), status Todo.** Start it in a **fresh session** (hardest slice). Details: `docs/agent/ROADMAP.md`.
  Build on `queries.ts` (parents, partnerships in order, siblings by birth). Set ADR-0006 to Accepted when it works.
- A fresh session without a specific task runs the skill `next-slice` and works on its own (CLAUDE.md §1).
- Proposals still waiting: P-005 (search), P-006 (plausibility hints), P-008 (smaller copy for email). The roadmap says when to ask.

## Open items for the user

- A manual check on a real Mac (Safari) and on Windows, once there is something to see (after S3).

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npx prettier --write <files>` after editing code or Markdown.
- Prettier keeps objects multi-line if the source has a line break after `{`. Generated fixtures: write one entry per line.
- Never import from a `*.test.ts` file: Vitest then runs that file's tests twice. Shared test helpers live in `tests/unit/helpers.ts`.
- `tsconfig` has `exactOptionalPropertyTypes`: you can't pass `field: undefined`; leave the key out (or pass `''`, operations drop it).
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine. A new machine needs them again (sudo, by the user).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`). They are allow-listed in
  `scripts/check-no-external-refs.mjs`, because they are only strings and are never fetched.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- Rendering lessons from the mock-up: divorced partners need a wider gap (the "//" plus the selection ring), and the
  children's line starts below the "//". Selection is a tight ring (box-shadow). `✎` renders badly: use SVG icons. ⚭ is missing on Linux fonts.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- Use the session scratchpad for throwaway files. If it is unavailable, use `tmp/` (git-ignored) and delete it afterwards.

## Known gaps

- No real Safari/macOS or Windows check yet.
- `src/storage/` and `src/ui/` contain only the setup stubs. Nothing is visible in the app yet.
- `deletePerson` leaves `images` and `view.focusPersonId` alone (noted in the roadmap for S4/S5).

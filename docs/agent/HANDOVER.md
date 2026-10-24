# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 2)

## Phase

1. ~~Development setup~~ ✅ (session 1)
2. ~~Concept work~~ ✅ (session 1, `docs/concept/*`, ADR-0001…0007)
3. ~~Mock-ups~~ ✅ (session 2, two rounds, all UI questions decided)
4. **Functional development** ← next. The user wants the coding done now.

## Done in session 2

- Mock-up round 1: three variants. The user chose **A "Familienalbum"**: big photo on the card, neutral card colours,
  editing a person **in a dialog**, warm cream with a mustard accent.
- Mock-up round 2: relations can be edited (pencil) and removed (×) in the detail panel, with a "cut off" warning and a
  keep-or-delete choice for a person who loses their last connection. Extra adoptive/step/foster parents get their own dashed
  line, max. two biological parents. No dashes/middle dots in UI text. Layout is automatic, no dragging.
- All decisions: `docs/concept/ui-concept.md` (Decisions 1–11, §2.8, §3, §5, §6) and the clarifications log in REQUIREMENTS.md.

## Next steps (functional development, in vertical slices)

Start with a short plan of the slices and confirm it with the user. Each slice: tests first or alongside, `npm run verify` green,
requirement statuses updated (Agreed → Implemented → Verified), commit and push.

1. **Core model + dates** (`src/core/`): types per `data-model.md`, flexible dates (parse/format/hint/sort, data-model §4),
   operations (add/edit/delete person, add/remove/edit partnership and parent-child link, placeholder "?" handling),
   validation (no loops, max. two biological parents, no duplicate partnerships), connectivity check for "cut off".
   The mock-up's `parseDate`, wording helpers (`parentWord` etc.) and `component()` are a good starting point to port to TS.
2. **Tree layout** (`src/core/layout/`, ADR-0006, still "Proposed"): generations → family units → ordering → coordinates,
   with fixture families and invariant tests (no overlaps, parents above children, partners adjacent, deterministic, 100 persons fast).
   Handle: several partners, extra non-biological parents, divorced couples (wider gap), disconnected parts placed side by side.
   This is the hardest slice. Confirm ADR-0006 once it works.
3. **Tree view** (`src/ui/`): SVG rendering in the mock-up's look (port `mockups/shared/style.css` variables), pan/zoom/fit,
   hover tooltip, select + highlight line, detail panel. Use the example family from `mockups/shared/familie.js` (minus x/row).
4. **Editing UI:** person dialog, add-relative flows (ui-concept §2.6), relation edit/remove (§2.8), delete, undo/redo (UI-01).
5. **Storage** (`src/storage/`, ADR-0005): IndexedDB working copy, `.stammbaum` zip with fflate (pinned, ADR note), open/save,
   FSA in Chromium vs. download elsewhere (DATA-09), last project on start (DATA-03), start screen, save status + reminder (UI-02),
   photo downscaling to 2000 px (DATA-07), schema version + migration hook (DATA-08).
6. **Finish:** print/export (UI-03), in-app help, `examples/Beispiel.stammbaum` (DATA-06), German user guide, release zip
   (skill `release-package`). Then delete `mockups/`.

Proposals still waiting for a decision: P-005 (search), P-006 (plausibility hints), P-008 (smaller copy for email).
Ask about P-005 when the tree view exists (finding a person among 100 gets tedious).

## Open items for the user

- A manual check on a real Mac (Safari) and on Windows, once there is something to see.

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npx prettier --write <files>` after editing Markdown or the mock-up.
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine. A new machine needs them again (sudo, by the user).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`). They are allow-listed in
  `scripts/check-no-external-refs.mjs`, because they are only strings and are never fetched.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- The mock-up is plain JS loaded with `<script src>` under a CSP `script-src 'self'`; that works under `file://` in all
  3 engines. It is linted/formatted by `npm run lint` like the rest of the repo.
- Rendering lessons from the mock-up: divorced partners need a wider gap (the "//" plus the selection ring), and the
  children's line starts below the "//". Selection is a tight ring (box-shadow), not an outline with offset.
  `✎` renders badly in many fonts: use drawn SVG icons. The ⚭ glyph is missing on Linux fonts.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- Use the session scratchpad for throwaway files. If it is unavailable, use `tmp/` (git-ignored) and delete it afterwards.

## Known gaps

- No real Safari/macOS or Windows check yet.
- `src/core/`, `src/storage/` and `src/ui/` contain only the setup stubs. All PERS/TREE/DATA/UI requirements are `Agreed`, nothing built yet.

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

## Next steps

- **Current slice: S1 (core model, dates, operations), status Todo.** Details, order and the later slices: `docs/agent/ROADMAP.md`.
- A fresh session without a specific task runs the skill `next-slice` and works on its own (CLAUDE.md §1).
  It tells the user which step it takes and recommends a fresh session at the right moments (rules in the skill).
- Proposals still waiting: P-005 (search), P-006 (plausibility hints), P-008 (smaller copy for email). The roadmap says when to ask.

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
- Session 2 also set up autonomous development: `docs/agent/ROADMAP.md` (slices S1–S6) and the skill `next-slice`.
- Rendering lessons from the mock-up: divorced partners need a wider gap (the "//" plus the selection ring), and the
  children's line starts below the "//". Selection is a tight ring (box-shadow), not an outline with offset.
  `✎` renders badly in many fonts: use drawn SVG icons. The ⚭ glyph is missing on Linux fonts.
- User preferences: no over-engineering; no dashes or middle dots in UI text; UI/UX decisions are the user's (show, then ask).
- Use the session scratchpad for throwaway files. If it is unavailable, use `tmp/` (git-ignored) and delete it afterwards.

## Known gaps

- No real Safari/macOS or Windows check yet.
- `src/core/`, `src/storage/` and `src/ui/` contain only the setup stubs. All PERS/TREE/DATA/UI requirements are `Agreed`, nothing built yet.

# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 1)

## Phase

1. ~~Development setup~~ ✅
2. ~~Concept work~~ ✅ aligned with the user (`docs/concept/*`, ADR-0001…0007)
3. **Mock-ups** ← next, but **start only when the user explicitly asks** (preferably in a fresh session)
4. Functional development

## Done in session 1

- Toolchain: Node 24 via nvm, Vite 8 + Svelte 5 + TS 6 (pinned exact). Single-file build to `dist/Stammbaum.html` with a CSP privacy guard.
- Tests: Vitest unit tests and Playwright E2E (Chromium/Firefox/WebKit) against `file://`. The `app` fixture fails on network requests and console errors.
- `.githooks/pre-push` runs `npm run verify` (~25 s). Verified that it blocks a failing push.
- `npm run package` builds `release/Stammbaum-<version>.zip` (dependency-free zip writer, unit-tested).
- Docs: CLAUDE.md, the requirements catalogue (incl. aligned decisions), ADRs, docs index + glossary, German user-guide stub (Du-form).
- Skills: `session-handover`, `requirement-change`, `release-package`.
- Spike: IndexedDB with blobs works under `file://` in all 3 engines and survives a restart and moving the file. FSA exists only in Chromium (architecture §3.2).

## Next steps

1. **Wait for the user's go for mock-ups.** Then propose how to do them first (e.g. clickable static Svelte screens with the
   fictional example family, 2–3 visual variants) and ask before building.
   Inputs for the mock-ups: `docs/concept/ui-concept.md` (screens, flows, wording) plus the decisions there.
   Still open, to be decided with the mock-ups: card colours (neutral or by gender), editing in the panel or a dialog, the visual style.
2. After the mock-ups: plan functional development in vertical slices, e.g. core model + dates → tree layout → storage → editing UI.
   Every slice comes with tests and requirement status updates.
3. Proposals still awaiting a decision: P-005 (search), P-006 (plausibility hints), P-008 (smaller copy for email).
   Bring them up again when relevant, without pushing.

## Open items for the user

- **`.claude/settings.json` is not committed.** The auto-mode safety check blocks agents from committing their own
  permission list, even after the user approved it (2026-10-24). The user commits it themselves:
  `git add .claude/settings.json && git commit -m "chore: claude code project permissions"`. If it is already in
  `git log`, delete this item.
- A manual check on a real Mac (Safari) and on Windows, once there is something to see.

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npm run format` (or `npx prettier --write <files>`) after editing Markdown.
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on this machine. A new machine needs them again (sudo, by the user).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`). They are allow-listed in
  `scripts/check-no-external-refs.mjs`, because they are only strings and are never fetched.
- Editing CLAUDE.md via a shell script got blocked by the auto-mode classifier. Use the Edit tool for CLAUDE.md.
- Use the session scratchpad for throwaway files. If it is unavailable, use `tmp/` (git-ignored) and delete it afterwards.

## Known gaps

- No real Safari/macOS or Windows check yet.
- `src/storage/` is still empty. fflate gets added (pinned) when storage is implemented (ADR-0005).

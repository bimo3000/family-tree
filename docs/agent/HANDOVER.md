# Handover – current state

> Rewritten at the end of every session (skill `session-handover`). A fresh session must be able to
> continue from this file alone. Keep it short and current. History lives in git, decisions in ADRs.

**Last updated:** 2026-10-24 (session 1)

## Phase

1. ~~Development setup~~ ✅ done
2. **Concept work** ← in progress: draft `docs/concept/*`, then align each open question with the user
3. Mock-ups. Start **only when the user explicitly asks**, preferably in a fresh session.
4. Functional development

## Done so far

- Toolchain: Node 24 via nvm, Vite 8 + Svelte 5 + TS 6. Single-file build to `dist/Stammbaum.html` with CSP.
- Tests: Vitest (unit) and Playwright E2E in Chromium/Firefox/WebKit against `file://`. A no-network fixture.
- `.githooks/pre-push` runs `npm run verify` (~25 s). Verified that it blocks a failing push.
- `npm run package` builds `release/Stammbaum-<version>.zip`.
- Docs: CLAUDE.md, requirements catalogue v1, ADR-0001…0004, docs index with glossary, German user-guide stub.
- Claude Code: `.claude/settings.json` permission allow-list and the skills `session-handover`, `requirement-change`, `release-package`.

## Next steps

1. Finish the concept drafts (architecture, data model, UI concept, ADR-0005…).
2. Walk the user through the open questions in plain language. Record the answers in the requirements (clarifications) and the ADRs.
3. Ask the user to decide on proposals P-001…P-007.
4. Stop. Wait for the user's explicit go for mock-ups.

## Open questions for the user

See the "Open questions" sections at the end of each `docs/concept/*.md` file.

## Pitfalls / environment notes

- `node` may not be on PATH in the Bash tool → `export PATH=$HOME/.nvm/versions/node/$(cat .nvmrc)/bin:$PATH`.
- `prettier --check` is part of `npm run lint`. Run `npm run format` after editing Markdown tables.
- WebKit system deps (`libevent-2.1-7t64 libavif16`) are installed on the dev machine. A new machine needs them again (sudo).
- The singlefile build inlines Svelte's error-doc URLs (`https://svelte.dev/e/...`). They are allow-listed in
  `scripts/check-no-external-refs.mjs`, because they are only strings in error messages and are never fetched.

## Known gaps

- No real Safari/macOS or Windows check yet (manual, by the user, once there is something to see).

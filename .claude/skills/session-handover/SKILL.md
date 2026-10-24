---
name: session-handover
description: End-of-session / milestone routine for the Stammbaum repo. Updates HANDOVER.md, requirement statuses and docs, removes stale artifacts, runs the full verification, then commits and pushes. Use when ending a session, before a context reset, after finishing a work package, or when the user says "wrap up" / "hand over".
---

# Session handover

Goal: a **fresh agent session with zero memory** can continue from `docs/agent/HANDOVER.md` alone,
and the repo is clean, green and pushed.

## Steps

1. **Take stock.** Run `git status` and `git log --oneline -15`. List what this session changed and what is still open.

2. **Requirements** (`docs/requirements/REQUIREMENTS.md`):
   - Update the `Status` and `Verified by` columns for everything touched (Agreed → In progress → Implemented → Verified).
   - Every decision the user made this session is recorded: a proposal moved into a table, a `D-NNN` deviation or a clarification.
   - Proposals that came up but were not decided yet are listed as `P-NNN`.
   - Never record anything as agreed that the user did not actually agree to.

3. **Docs.** README, `docs/README.md` (commands, layout, glossary), `docs/concept/*`, the ADRs and
   `docs/user-guide/Anleitung.md` (German, end-user level) must reflect the current state. Add new terms to the glossary.

4. **Housekeeping:**
   - Remove stale artifacts: probe files, commented-out code, unused exports/deps (`npm ls`), obsolete docs, files outside the agreed layout.
   - Check `.gitignore`: does `git status` show generated files? Then add the rule.
   - Check `git check-ignore -v data/x.stammbaum` (it must be ignored).

5. **Rewrite `docs/agent/HANDOVER.md`.** Rewrite it rather than appending, and keep it under ~80 lines:
   - `Last updated` date and session number
   - Phase overview (what's done, what's current, what's next)
   - Done in this session (short bullets)
   - **Next steps** (concrete and ordered, so the next session can start immediately)
   - Open questions for the user
   - Pitfalls and environment notes learned the hard way
   - Known gaps (missing tests, unverified browsers, …)

6. **Self-improvement check.** Did anything this session cost unnecessary time (a missing skill, an unclear CLAUDE.md rule, a slow test)?
   Then propose a concrete improvement to the user, or create the skill and register it in the CLAUDE.md skill table.

7. **Verify and push.** Run `npm run verify`. If it is green, commit (`docs: session handover …` or as part of the last commit) and `git push`.
   Never use `--no-verify`.

8. **Report to the user** in plain language: what was done, what's next, and which decisions are waiting for them.

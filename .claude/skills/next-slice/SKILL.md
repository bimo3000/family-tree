---
name: next-slice
description: Work through the next slice of docs/agent/ROADMAP.md autonomously (plan, tests, code, verify, push, report), tell the user the next step, and say when a fresh session makes sense. Use at the start of a development session, when the user says "weiter"/"go"/"continue" or gives no specific task, and whenever a slice is finished.
---

# Next slice

The user wants sessions to run on their own. Do the work; stop only for real decisions.

## 1. Pick the slice

1. Read `docs/agent/ROADMAP.md`. Take the slice that is `In progress`, else the first `Todo`.
2. **Does the plan still fit?** Check it against the latest requirements, clarifications, the handover and what the user said
   this session. If the direction changed (new requirement, user feedback, a slice turned out wrong or too big):
   re-order, split, add or drop slices, add a line to the roadmap change log, and tell the user in two or three sentences.
   Requirement changes themselves still go through the `requirement-change` skill.
3. Tell the user in one or two sentences which slice you start and what it delivers. Then start, without waiting.

## 2. Build it

1. Set the slice to `In progress`. For a non-trivial slice, write a short plan first (files, order, tests).
2. If the slice has an entry under "Decisions to raise", ask it now (AskUserQuestion, with your recommendation first).
3. Work in small green steps: tests with the code (pure logic → `tests/unit/`, user flows → `tests/e2e/`),
   commit and push after each coherent step (pre-push runs `npm run verify`). Follow CLAUDE.md for everything else.
4. **Stop and ask only for:** a UI/UX choice the concept and the mock-up don't answer, a conflict with a requirement,
   a new runtime dependency not already named in an ADR, anything destructive or hard to undo. Otherwise decide and note why.
5. Update requirement statuses (`In progress` → `Implemented` → `Verified` with the test name) as you go.

## 3. Finish the slice

1. `npm run verify` green, everything pushed. Roadmap status `Done`. Docs updated (concept, README, glossary if new terms).
2. Tell the user in plain language: what works now, **how to try it** (exact steps, e.g. `npm run build`, then double-click
   `dist/Stammbaum.html`), what you decided on their behalf, and **the next step** you recommend.

## 4. Fresh session or continue?

Recommend a **fresh session** (after running `session-handover`) when any of these is true, and say why in one sentence:

- a slice was just finished and the next one is big (S2, S4, S5), or this session already finished one slice;
- the conversation was compacted or summarized, or you notice you are re-reading files you already read;
- the next step needs different context than this one (e.g. switching from core logic to UI).

Mid-slice, never stop at a red state: first reach a green, pushed commit, update `HANDOVER.md` ("In progress, next step: …"), then recommend the fresh session.
Otherwise continue with the next slice in the same session.

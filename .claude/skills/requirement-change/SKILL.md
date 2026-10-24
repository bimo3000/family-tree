---
name: requirement-change
description: Procedure for proposing, approving and recording changes to the Stammbaum requirements catalogue (new requirement, change, deviation, clarification). Use whenever an idea would add/alter/deviate from docs/requirements/REQUIREMENTS.md, or the user approves/rejects a proposal.
---

# Requirement change

`docs/requirements/REQUIREMENTS.md` is the contract. **Nothing becomes binding without the user's explicit OK.**

## A. You have an idea, or you see a problem with a requirement

1. Add a row to **Proposals (awaiting approval)** with the next free `P-NNN`, a one-line proposal, the _why_ in user terms, and today's date.
2. Explain it to the user in chat in plain language: what changes for them, its cost/effort, and your recommendation.
   Use AskUserQuestion when there are clear options.
3. Continue working on agreed scope. **Do not implement the proposal yet.**

## B. The user approves a proposal

1. Move it into the matching area table (GEN/PRIV/DATA/PERS/TREE/DEV/FUT) with the next free ID in that area, status `Agreed`.
2. Delete the `P-NNN` row. IDs are never reused, so note `(was P-NNN)` at the end of the new requirement text.
3. If it changes the architecture, write or update an ADR.

## C. The user rejects a proposal

Delete the row and add one line to the **Clarifications log**: `Rejected P-NNN (<short title>): <reason>`.
This prevents the next session from proposing it again.

## D. Implementation has to deviate from an agreed requirement

1. **Stop and ask first.** Explain the conflict and the options.
2. After approval, add a `D-NNN` row to **Aligned deviations**: requirement ID, what deviates, why, approval date.
3. Add `(see D-NNN)` to the affected requirement's text.

## E. The user clarifies how something is meant

Add a row to the **Clarifications log** with the date. If the wording of a requirement was ambiguous, rephrase it, but only with the user's OK.

## Rules

- IDs are stable: never renumber, never reuse.
- Keep requirement text short and plain. Technical detail belongs in `docs/concept/`.
- Commit requirement changes separately (`docs(req): …`) so the history of the contract is easy to read.

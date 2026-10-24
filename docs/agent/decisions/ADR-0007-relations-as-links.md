# ADR-0007: Relations stored as partnerships + parent-child links

- **Status:** Accepted (data-model concept aligned with the user on 2026-10-24)
- **Date:** 2026-10-24
- **Requirements:** TREE-03, TREE-04, PERS-02, FUT-03

## Context

Relations have to cover incomplete parents, several partners, and adoptive/step/foster links, without making simple families complex.

## Decision

Store **persons**, **partnerships** (two persons, optional details) and **parent-child links** (optional `kind`,
biological by default). "Families" (couple + children) are derived for display and for a GEDCOM export.

## Consequences

- One unknown parent needs no placeholder in the data, because the child simply has one link.
- An adoption by one parent is just one link with `kind: adoptive`.
- Validation (no loops, at most 2 biological parents) lives in `core/` and is unit-tested.

## Alternatives considered

- **GEDCOM-style family records**: natural for couples, but clumsy for one-sided adoption and unknown parents.

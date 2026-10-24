# ADR-0006: Own tree-layout algorithm in core, rendered as SVG

- **Status:** Proposed (to be confirmed when the tree view is built)
- **Date:** 2026-10-24
- **Requirements:** TREE-01, TREE-02, TREE-03, TREE-04, TREE-05

## Context

Family trees aren't plain trees: couples, several partners, unknown parents, adoption and occasional loops (cousin marriages).
Existing libraries either assume a focus person with ancestors/descendants only, are large (general graph layout),
or give little control over the "simple unless needed" rendering the user wants.

## Decision

- Write our own layout in `src/core/layout/` as pure functions: input project, output positions of cards and lines.
  Steps: generations → family units (couple + children) → ordering (birth order, fewer crossings) → coordinates.
- Render with SVG and our own pan/zoom (no dependency).
- Build a set of **fixture families** (simple couple, 4 generations, remarriage, adoption, unknown parent, cousin marriage, 100 persons)
  with unit tests on layout invariants: no overlaps, parents above children, partners adjacent, deterministic output.

## Consequences

- More initial work than a library, but full control and full testability. It is small enough for ~100 persons.
- The layout is deterministic, so the same data always looks the same and screenshot tests become possible.

## Alternatives considered

- **family-chart (d3-based)**: focus-person oriented, d3 dependency, less control over special-case rendering.
- **ELK.js / dagre (generic graph layout)**: large bundle, and it doesn't know about couples.

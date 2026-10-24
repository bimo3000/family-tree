# ADR-0006: Own tree-layout algorithm in core, rendered as SVG

- **Status:** Accepted (implemented in slice S2, session 4)
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

## How it works (S2)

`computeLayout(project)` in `src/core/layout/index.ts`, one file per step, each with unit tests in `tests/unit/layout/`:

1. **Rows** (`generations.ts`): partners and siblings share a row; children sit below every parent (all link kinds);
   groups are pulled down towards their children when that shortens more lines than it stretches, so married-in
   grandparents sit right above their child. A pair that would form a loop (partner is an ancestor) is not merged.
2. **Order** (`order.ts`): partners in a row form a rigid **block**. A depth-first walk gives the first order,
   barycenter sweeps and neighbour swaps reduce crossings, the order with the fewest crossings wins.
3. **x positions** (`coordinates.ts`): every block is pulled towards its parents and towards the middle of its children;
   per row a pool-adjacent-violators solver keeps order and minimum gaps. 30 down-and-up iterations.
4. **Lines** (`lines.ts`): the mock-up's drawing rules, plus separate levels for overlapping bars, side-by-side
   entries for several lines into one child, straight drops for an only child, detours around cards.
5. Unrelated parts of the tree are laid out one by one and placed side by side.

Decisions taken on the user's behalf (visible, so to be confirmed when the tree view is shown in S3):

- **Several partners:** the person stands between the first and the second partner, later partners further right.
  A couple that can't be neighbours gets a line arching over the cards in between; their children hang from both.
- **Siblings by birth,** except that a married sibling may move towards the side of their partner's family when that
  avoids crossing lines (the mock-up does the same with Karl and Frieda).
- **A "?" parent** stands next to the known parent at partner distance, but without a couple line (no partnership exists).
- **Uncle marries niece and similar:** the couple shares a row, the line to the uncle's parents is long and goes
  around the cards in between. A partner who is also an ancestor: different rows, diagonal couple line.
- Gaps: partners and siblings 42 px, divorced couples 70 px, other neighbours 84 px, unrelated parts 168 px.

Measured: 100 persons in about 25 ms. The 100-person fixture keeps 5 crossings (all other fixtures 0).

## Consequences

- More initial work than a library, but full control and full testability. It is small enough for ~100 persons.
- The layout is deterministic, so the same data always looks the same and screenshot tests become possible.

## Alternatives considered

- **family-chart (d3-based)**: focus-person oriented, d3 dependency, less control over special-case rendering.
- **ELK.js / dagre (generic graph layout)**: large bundle, and it doesn't know about couples.

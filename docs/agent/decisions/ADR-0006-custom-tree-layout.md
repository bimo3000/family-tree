# ADR-0006: Own tree-layout algorithm in core, rendered as SVG

- **Status:** Accepted (implemented in slice S2, session 4; layout choices confirmed by the user in S3, session 5)
- **Date:** 2026-10-24
- **Requirements:** TREE-01, TREE-02, TREE-03, TREE-04, TREE-05

## Context

Family trees aren't plain trees: couples, several partners, unknown parents, adoption and occasional loops (cousin marriages).
Existing libraries either assume a focus person with ancestors/descendants only, are large (general graph layout),
or give little control over the "simple unless needed" rendering the user wants.

## Decision

- Write our own layout in `src/core/layout/` as pure functions: input project, output positions of cards and lines.
  Steps: generations → family units (couple + children) → ordering (birth order, fewer crossings) → coordinates.
- Render with our own pan/zoom (no dependency): lines as SVG, cards as HTML buttons on top (text wrapping and keyboard focus for free).
- Build a set of **fixture families** (simple couple, 4 generations, remarriage, adoption, unknown parent, cousin marriage, 100 persons)
  with unit tests on layout invariants: no overlaps, parents above children, partners adjacent, deterministic output.

## How it works (S2)

`computeLayout(project)` in `src/core/layout/index.ts`, one file per step, each with unit tests in `tests/unit/layout/`:

1. **Rows** (`generations.ts`): partners and siblings share a row; children sit below every parent (all link kinds);
   groups are pulled down towards their children when that shortens more lines than it stretches, so married-in
   grandparents sit right above their child. A pair that would form a loop (partner is an ancestor) is not merged.
   **Passages** (`passages.ts`, session 12): a child more than one row below their parents gets a **stand-in**
   (virtual node) in every row their line passes. Stand-ins take part in ordering and spacing like cards of width 0
   with 24 px to their neighbours. Before, such a long line was invisible to the crossing count and squeezed through the
   nearest free spot, once right between two partners next to their own child line (user report after S11).
2. **Order** (`order.ts`): partners in a row form a rigid **block**. A depth-first walk gives the first order,
   barycenter sweeps and neighbour swaps reduce crossings, the order with the fewest crossings wins. Every other
   upward sweep breaks ties the other way round, so two families competing for the same place can pass each other
   (user report after S4: a new couple's child line crossed the "?" line above Michael Seidel). When crossings remain,
   the walk also starts from the bottom row and/or visits in-laws right to left (4 starts); another start wins only with
   strictly fewer crossings, so a crossing-free tree keeps its order. Crossings are counted per pair of rows by sorting
   (inversion count), and a neighbour swap re-counts only the two row pairs it touches.
3. **x positions** (`coordinates.ts`): every block is pulled towards its parents and towards the middle of its children;
   per row a pool-adjacent-violators solver keeps order and minimum gaps. 30 down-and-up iterations.
4. **Lines** (`lines.ts`): the mock-up's drawing rules, plus separate levels for overlapping bars (including the
   horizontal pieces of long lines in lower gaps), side-by-side entries for several lines into one child, straight
   drops for an only child, long lines through their stand-ins. Where a vertical piece of one line crosses a horizontal
   piece of another, the horizontal line gets a **break** (`breaks`, drawn as a 10 px gap; the user chose it over a hop).
5. Unrelated parts of the tree are laid out one by one and placed side by side.

Decisions taken on the user's behalf, **confirmed by the user in S3** (2026-10-24). Only change: the "?" node is 56 px instead of 40 px, so it is easier to see.

- **Several partners:** the person stands between the first and the second partner, later partners further right.
  A couple that can't be neighbours gets a line arching over the cards in between; their children hang from both.
- **Siblings by birth,** except that a married sibling may move towards the side of their partner's family when that
  avoids crossing lines (the mock-up does the same with Karl and Frieda).
- **A "?" parent** stands next to the known parent at partner distance, but without a couple line (no partnership exists).
- **Uncle marries niece and similar:** the couple shares a row, the line to the uncle's parents is long and goes
  around the cards in between. A partner who is also an ancestor: different rows, diagonal couple line.
- Gaps: partners and siblings 42 px, divorced couples 70 px, other neighbours 84 px, unrelated parts 168 px.

Measured: 100 persons in about 25 ms (about 45 ms on the development machine in session 6). The 100-person fixture
keeps 5 crossings by the ordering's count (all other fixtures 0). `tests/unit/layout/invariants.test.ts` counts real
line crossings in the drawing for Familie Brandt and the reported case (both 0).
Session 12: 100 persons about 20 ms, 200 persons about 90 ms, even with the extra starts (they run when crossings remain),
after making the swap pass, the row step and the placement cheaper.
The fixture `mismatched-generations` went from 2 to 1 crossing, the user's tree from 10 to 4. Only trees with lines
that skip a row get a different layout.

## Consequences

- More initial work than a library, but full control and full testability. It is small enough for ~100 persons.
- The layout is deterministic, so the same data always looks the same and screenshot tests become possible.

## Alternatives considered

- **family-chart (d3-based)**: focus-person oriented, d3 dependency, less control over special-case rendering.
- **ELK.js / dagre (generic graph layout)**: large bundle, and it doesn't know about couples.

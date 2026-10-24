# Mock-up (phase 3, round 2)

A clickable prototype of the Stammbaum UI with a fictional family. **Throwaway code**: plain HTML/CSS/JS, no build
step, fictional data only. Delete this folder once the real UI exists.

## How to open

Double-click `mockups/index.html`. Works offline in any browser. Changes live in memory only: reloading resets everything.

## Round 1 (done)

Three variants (A Familienalbum, B Klar & modern, C Ahnentafel). The user chose **A** with editing in a dialog.
The decisions are recorded in `docs/concept/ui-concept.md` (Decisions 5 to 9). B and C are in git history (commit `9266cd7`).

## Round 2: what changed, and what to try

- Warmer, more mustard colours. Clearer group titles in "Familie". No dashes or dots as separators. No Rufname underline.
- Editing a person opens a dialog.
- **Relations:** each parent, partner and child in the panel has ✎ (edit the relation) and × (remove it).
  Try removing Jonas Seidel's two adoptive parents one after the other: the second time, you're asked whether to keep or delete Jonas.
  Removing Peter from both his parents warns that a whole branch gets cut off.
- **Extra parents:** select Lena, "+ Elternteil" (she already has two biological parents, so the dialog asks what kind of parent),
  and see the extra dashed line. "+ Kind" with an existing person who already has parents asks what kind of child they are.
- **Divorce:** select Peter and zoom in on the "//" between Peter and Sabine. Peter's ✎ next to Sabine lets you change it.

Not in the mock-up: search (P-005 still open), real photos, saving, printing, help, an automatic layout.
New persons are placed in the nearest free spot. The real app will compute the layout.

## Structure

- `shared/familie.js`: the fictional family (data-model structure plus hand-placed positions).
- `shared/prototype.js`: rendering and interactions.
- `shared/style.css`: the look (colours as CSS variables at the top).
- Privacy: the page has a Content-Security-Policy that blocks any network access.

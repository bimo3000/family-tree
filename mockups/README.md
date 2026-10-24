# Mock-ups (phase 3)

Three clickable prototypes to decide the look and the open UX questions of `docs/concept/ui-concept.md`
(card colours, editing in the panel or in a dialog, visual style). **Throwaway code**: plain HTML/CSS/JS, no build
step, fictional data only. Delete this folder once the real UI exists and the decisions are recorded.

## How to open

Double-click `mockups/index.html` (or open one of the variant files directly). Works offline in any browser.
Changes you make live in memory only. Reloading the page resets everything.

| File                   | Look                                      | Card                       | Card colours | Editing    |
| ---------------------- | ----------------------------------------- | -------------------------- | ------------ | ---------- |
| `a-familienalbum.html` | warm, paper tones, serif                  | big photo on top           | neutral      | side panel |
| `b-klar-modern.html`   | white, calm, sans-serif                   | round photo left           | gender edge  | dialog     |
| `c-ahnentafel.html`    | classic chart, fine lines, ⚭ for marriage | text only (photo in panel) | gender tint  | side panel |

## Feedback checklist (for the product owner)

1. **Overall look:** which variant feels right? Anything you'd take from another one?
2. **Person card:** big photo, small round photo, or text only? Are name and years readable enough?
3. **Card colours:** neutral, coloured edge or tint by gender?
4. **Editing:** in the side panel or in a dialog?
5. **Lines:** are couples, children, the divorce `//`, the dashed adoption line and the `?` node understandable?
6. **Panel:** is the information in the right order? Too much or too little?
7. **Wording:** any German text that sounds odd or too technical?
8. Anything that confused you or that you missed?

## Structure

- `shared/familie.js`: the fictional family (data-model structure plus hand-placed positions).
- `shared/prototype.js`: shared rendering and interactions. Variants differ only in CSS and two `<body>` attributes
  (`class` for card style/colours, `data-edit-mode`).
- `shared/base.css`: shared layout. Each variant sets its colours, fonts and card sizes as CSS variables.
- Privacy: each page has a Content-Security-Policy that blocks any network access.

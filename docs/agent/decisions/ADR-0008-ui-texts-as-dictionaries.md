# ADR-0008: UI texts as TypeScript dictionaries, no i18n library

- **Status:** Accepted
- **Date:** 2026-10-25
- **Requirements:** GEN-05 (German, English, French), UI-04, PERS-06, PERS-07

## Context

The app was German only, with texts written straight into the Svelte components and the grammar helpers in
`src/ui/text.ts`. GEN-05 now asks for German, English and French, chosen per browser. Adding a further language later
should be easy. Each language has its own grammar for relation words ("Adoptivvater", "père adoptif", "adoptive
father") and its own date style. The user prefers no over-engineering and every dependency is bundled into the HTML.

## Decision

- One **dictionary file per language** in `src/ui/i18n/` (`de.ts`, `en.ts`, `fr.ts`): an object with every UI text,
  grouped by screen. Plain strings, plus small functions where a text has values or grammar (relation words, dates,
  counts). German is the master copy: `type Texts = typeof de`, and the other languages are declared as `Texts`, so the
  **typecheck fails** if a text is missing or has the wrong parameters.
- `src/ui/i18n/index.svelte.ts` holds the current language as Svelte state. Components read `t.section.text`; switching
  the language re-renders without a reload. The choice is stored in the browser working copy (IndexedDB, like the
  hints already seen), not in the project file. Without a choice, `pickLanguage(navigator.languages)` picks de/en/fr,
  else English.
- **Date input** (`src/core/dates.ts`) understands all three languages at once, whatever the UI language, always day
  before month. **Date display** is per language (DE `12.03.1923`, EN `12 Mar 1923`, FR `12/03/1923`). The card uses
  short qualifiers (`ca.`, `c.`, `v.`) so its year line is never longer than in German.
- English and French follow UI-04 in spirit: French uses the informal "tu"; English has no such difference.
- A unit test scans the `.svelte` files for text outside `{…}`, so no hard-coded text slips back in.

## Consequences

- A new language = copy `en.ts`, translate, add one line to `LANGUAGES`. The typecheck lists anything forgotten.
- Texts are no longer next to the markup: a component reads `t.panel.edit` instead of "Bearbeiten". Search `de.ts` to
  find where a German text comes from.
- All three dictionaries are bundled (a few kB each); no lazy loading.
- Existing E2E tests keep finding everything by its German text (`locale: 'de-DE'` in `playwright.config.ts`).

## Alternatives considered

- **An i18n library** (svelte-i18n, i18next, …): message formats, plural rules and lazy loading we don't need, plus a
  bundled dependency. Plain TypeScript gives the same safety through the typecheck.
- **JSON files with placeholders** (`"{name} hinzufügen"`): needs its own placeholder syntax and can't express the
  relation-word grammar; functions in TypeScript can.
- **Language per project file**: everybody sharing a file would be forced into one language. Rejected by the user.

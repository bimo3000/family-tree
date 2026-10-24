# UI concept (text level)

> Status: **draft for alignment** (2026-10-24). No mock-ups yet. They follow **only on the user's explicit request**.
> The final look and feel is the **user's decision** (DEV-09). This document describes structure and behaviour, not design.

## 1. Guiding principles

1. **The grandma test (GEN-06):** every common task can be done without explanation, with large click targets,
   clear German words and no technical terms.
2. **Simple until it needs to be complex (TREE-04):** empty fields are not shown, and rare options hide behind "Mehr Angaben".
   Special relation types only appear on screen when they exist.
3. **Nothing gets lost:** autosave to the working copy, undo for everything (P-001), a visible save status (P-003)
   and a confirmation before deleting.
4. **The tree is the app:** the family tree fills the screen. Everything else is a panel or a dialog on top of it.

## 2. Screens

### 2.1 Start

- **If there is a last project:** it opens directly (DATA-03) and the start screen is skipped.
- **Otherwise** a friendly welcome page with three large buttons:
  - **"Neuen Stammbaum anlegen"** asks for a name ("Familie Müller") and then starts with one empty person.
  - **"Stammbaum-Datei öffnen"** opens a file picker for `.stammbaum`. Drag & drop also works.
  - **"Beispiel ansehen"** loads the fictional example family (DATA-06).

### 2.2 Main window

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Familie Müller ▾   ↶ ↷   🔍 Person suchen …         ✓ Gespeichert  [Speichern] │  ← top bar
├───────────────────────────────────────────────────────┬───────────────────┤
│                                                       │                   │
│                  tree (pan / zoom)                    │  detail panel     │
│                                                       │  (opens when a    │
│                                                       │  person is        │
│                                         [+] [−] [⤢]   │  selected)        │
└───────────────────────────────────────────────────────┴───────────────────┘
```

(This rough sketch only shows the arrangement. It is not a mock-up.)

- **Project menu ("Familie Müller ▾"):** Neu, Öffnen …, Speichern unter …, Umbenennen, Beispiel ansehen, Hilfe.
- **↶ ↷** undo/redo (P-001), also via Ctrl+Z / Ctrl+Y.
- **Search** (P-005): type a name, matching persons are listed, and picking one centers the tree on them.
- **Save status** (P-003): "✓ Gespeichert" or "● Nicht in Datei gespeichert".

### 2.3 Person card (in the tree, PERS-04)

```
┌────────────────────────┐
│ (photo)  Anna Müller   │   ← given name(s) + last known surname
│          * 1923 † 2001 │   ← years on the card ❓
└────────────────────────┘
```

- No photo: a neutral placeholder with initials.
- **Hover:** a small tooltip with full dates and places, plus "geb. Schmidt" if a birth name exists (PERS-05).
- **Click:** selects the person, highlights their line (ancestors and descendants) and opens the detail panel.
- **Double-click:** centers the tree on the person.

### 2.4 Detail panel (PERS-05)

- A large photo, the full name ("Anna Maria Müller, geb. Schmidt"), dates and places, Beruf, Wohnorte and Weitere Angaben.
  **Only filled fields are shown.**
- **Lebensgeschichte** (biography) text.
- **Family** as clickable names: Eltern, Partner (with wedding date if known), Kinder, Geschwister.
- **Action buttons:** "Bearbeiten", "+ Elternteil", "+ Partner/in", "+ Kind", "+ Geschwister", and a less prominent "Person löschen".

### 2.5 Editing a person

- Opens in the detail panel (❓ or as a dialog, to be decided with mock-ups).
- **Always visible:** Foto, Vornamen, Nachname, Geburtsname, Geboren (Datum, Ort), Gestorben (Datum, Ort).
- **"Mehr Angaben ▾":** Rufname, Geschlecht, Beruf, Wohnorte, Lebensgeschichte, Weitere Angaben (+ Feld hinzufügen).
- **Date fields** are plain text fields with a live interpretation underneath: "→ 12. März 1923", "→ ungefähr 1850",
  "→ wird so übernommen". See data-model §4.
- Changes apply immediately, with undo. "Fertig" closes the form. There is no "Abbrechen" that loses work: the user undoes instead.

### 2.6 Adding relatives (the main way the tree grows)

Every flow starts **from a person**, which avoids abstract "create relationship" dialogs.

| Button            | What happens                                                                                                          | The extra question appears only if …                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **+ Kind**        | A new person becomes a child of this person **and** their partner                                                     | … the person has several partners: "Mit wem?" (list + "anderer/unbekannt")               |
| **+ Partner/in**  | A new person becomes a partner                                                                                        | never. Details (Ehe, Datum) can be added later under "Beziehung bearbeiten"              |
| **+ Elternteil**  | A new person becomes a parent. If one parent exists already, the new one becomes their partner (checkbox, pre-ticked) | … two biological parents exist already: "Adoptiv-/Stief-/Pflegeelternteil?"              |
| **+ Geschwister** | A new person becomes a child of the same parents                                                                      | … the parents are unknown: a parent is created first ("Eltern unbekannt" placeholder) ❓ |

Each flow offers **"Neue Person"** (default) or **"Vorhandene Person auswählen"** (for linking two people already in the tree,
e.g. a cousin marriage or a person added twice by mistake).

### 2.7 Deleting

"Anna Müller wirklich löschen? Ihre Verbindungen zu anderen Personen werden entfernt. Sie können das mit ↶ rückgängig machen."
[Löschen] [Abbrechen]

## 3. Tree interactions (TREE-02)

- **Pan:** drag the background. **Zoom:** mouse wheel or the `+`/`−` buttons. **⤢ "Alles anzeigen"** fits the whole tree on screen.
- **Focus:** selecting a person highlights their direct line and slightly fades the others. Esc clears the selection.
- **Orientation:** ancestors at the top, descendants below (classic) ❓.
- **Relations drawn:** partners joined by a horizontal line, and children hanging from the middle of that line.
  - Divorced/separated: the couple line is interrupted (e.g. a small "//"). **Only when it applies.**
  - Adoptive/step/foster: a dashed child line plus a label on hover. **Only when it applies.**
  - Several partners: the person sits next to each partner in turn, each couple with its own children.

## 4. Saving behaviour as the user experiences it

| Situation                                 | What the user sees                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Any change                                | Saved to the working copy instantly. The status shows "● Nicht in Datei gespeichert" until the file is written.             |
| "Speichern" in Chrome/Edge                | The first time, a "Speichern unter" dialog. Afterwards automatic ❓ (see architecture, open question 1).                    |
| "Speichern" in Firefox/Safari             | The file is downloaded. The first time, a hint: "Die Datei liegt jetzt in Ihrem Download-Ordner. Bewahren Sie sie gut auf." |
| Closing the tab with unsaved file changes | The browser asks "Seite verlassen?" The working copy is safe anyway.                                                        |
| Not saved to the file for a long time     | A gentle reminder (P-003): "Sie haben seit 7 Tagen nicht in die Datei gespeichert."                                         |

## 5. Language and wording

- German only, with short and friendly sentences.
- Address: "Sie" ❓.
- Dates as `12.03.1923`, `*` for birth and `†` for death.
- Gender-neutral defaults: "Partner/in", "Elternteil", "Kind". Gendered words (Mutter/Vater) only if a gender is set ❓.
- No technical terms in the UI: no "Datei-Handle", no "IndexedDB", no "Cache".

## 6. Visual direction (to be decided with mock-ups)

- A calm, warm look ("family album" rather than "spreadsheet"), large readable fonts (base ≥ 16 px) and generous click targets.
- System fonts only (privacy: no web fonts).
- Mock-ups will offer 2–3 visual variants for the user to choose from.

## 7. Help

- A "?" in the project menu opens a short German help page inside the app (no internet).
- On first use, a few unobtrusive hints ("Klicken Sie auf eine Person, um Details zu sehen").

## Open questions for the user

1. **Address the user with "Sie" or "Du"?** _Recommendation: "Sie". It is respectful and fits all generations._
2. **Card dates:** only years on the card ("* 1923 † 2001", compact) with full dates on hover, or full dates on the card?
   PERS-04 says "date of birth/death". _Recommendation: years on the card, so the tree stays compact._
3. **Orientation:** ancestors on top (classic), or a left-to-right layout? _Recommendation: top-down. It is familiar and fits wide screens with ~4–6 generations._
4. **"+ Geschwister" with unknown parents:** create an invisible "unknown parents" placeholder automatically, or ask the user
   to add a parent first? _Recommendation: an automatic placeholder shown as a small "?" node._
5. **Card colours:** neutral for everyone, or subtle colours by gender (the classic genealogy look)? To be decided with mock-ups.

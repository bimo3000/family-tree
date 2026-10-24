# UI concept (text level)

> Status: **aligned with the user** (2026-10-24), including two mock-up rounds. Nothing is open.
> The clickable reference is [`mockups/index.html`](../../mockups/README.md).
> The final look and feel is the **user's decision** (DEV-09). This document describes structure and behaviour, not design.

## 1. Guiding principles

1. **The grandma test (GEN-06):** every common task can be done without explanation, with large click targets,
   clear German words and no technical terms.
2. **Simple until it needs to be complex (TREE-04):** empty fields are not shown, and rare options hide behind "Mehr Angaben".
   Special relation types only appear on screen when they exist.
3. **Nothing gets lost:** autosave to the working copy, undo for everything (UI-01), a visible save status (UI-02)
   and a confirmation before deleting.
4. **The tree is the app:** the family tree fills the screen. Everything else is a panel or a dialog on top of it.

## 2. Screens

### 2.1 Start

- **If there is a last project:** it opens directly (DATA-03) and the start screen is skipped.
- **Otherwise** a friendly welcome page with three large buttons:
  - **"Neuen Stammbaum anlegen"** asks for a name ("Familie Müller") and then starts with one empty person, whose dialog opens at once.
  - **"Stammbaum-Datei öffnen"** opens a file picker for `.stammbaum`. Drag & drop also works.
  - **"Beispiel ansehen"** loads the fictional example family (DATA-06). It is embedded in `Stammbaum.html`, so it needs no file.

### 2.2 Main window

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Familie Müller ▾   ↶ ↷                         ✓ Gespeichert  [Speichern] │  ← top bar
├───────────────────────────────────────────────────────┬───────────────────┤
│                                                       │                   │
│                  tree (pan / zoom)                    │  detail panel     │
│                                                       │  (opens when a    │
│                                                       │  person is        │
│                                         [+] [−] [⤢]   │  selected)        │
└───────────────────────────────────────────────────────┴───────────────────┘
```

(This rough sketch only shows the arrangement. It is not a mock-up.)

- **Project menu ("Familie Müller ▾"):** Neu, Öffnen …, Speichern unter …, Umbenennen, Drucken / Als Bild speichern (UI-03), Beispiel ansehen, Hilfe.
- **↶ ↷** undo/redo (UI-01), also via Ctrl+Z / Ctrl+Y.
- **No search** (P-005 was rejected, 2026-10-24): people are found by pan, zoom, "Alles anzeigen" and the family links in the panel.
- **Save status** (UI-02): "✓ Gespeichert" or "● Nicht in Datei gespeichert". Nothing is shown while there is nothing
  to save (the untouched example, a new tree before the first entry).
- **Before another project replaces one with unsaved changes** (Neuer Stammbaum, Öffnen, Beispiel ansehen, a dropped file):
  "Noch nicht gespeichert. Dieser Stammbaum ist noch nicht in einer Datei gespeichert." [Jetzt speichern]
  [Ohne Speichern weiter] [Abbrechen] (decided 2026-10-24). A file is read first, so a wrong file changes nothing.

### 2.3 Person card (in the tree, PERS-04)

```
┌──────────────┐
│   (photo)    │   ← big photo on top
│ Anna Maria   │   ← all given names + last known surname
│   Müller     │
│ * 1923 † 2001│   ← years on the card (PERS-04)
└──────────────┘
```

- No photo: a neutral placeholder with initials. Neutral card colours (no colours by gender).
- **Hover:** a small tooltip with full dates and places, plus "geb. Schmidt" if a birth name exists (PERS-05).
- **Click:** selects the person, highlights their line (ancestors and descendants) and opens the detail panel.
- **Double-click:** centers the tree on the person.

### 2.4 Detail panel (PERS-05)

- A large photo, the full name ("Anna Maria Müller, geb. Schmidt"), dates and places, Beruf, Wohnorte and Weitere Angaben.
  **Only filled fields are shown.**
- **Lebensgeschichte** (biography) text.
- **Family** as clickable names: Eltern, Partner (with wedding date if known), Kinder, Geschwister.
  Group titles are set apart clearly from the entries (small bold caps, entries indented along a thin line).
- **Each relation** (parent, partner, child) has a small **✎ "Beziehung bearbeiten"** and **× "Verbindung entfernen"**.
  Siblings have neither, because they follow from shared parents. See §2.8.
- **Action buttons:** "Bearbeiten", "+ Elternteil", "+ Partner/in", "+ Kind", "+ Geschwister", and a less prominent "Person löschen".

### 2.5 Editing a person

- Opens as a **dialog** on top of the tree (decided with mock-up round 1).
- **Always visible:** Foto, Vornamen, Nachname, Geburtsname, Geboren (Datum, Ort), Gestorben (Datum, Ort).
- **"Mehr Angaben ▾":** Geschlecht, Beruf, Wohnorte, Lebensgeschichte, Weitere Angaben (+ Feld hinzufügen).
- **Date fields** are plain text fields with a live interpretation underneath: "→ 12. März 1923", "→ ungefähr 1850",
  "→ wird so übernommen". See data-model §4.
- Changes apply immediately, with undo. "Fertig" closes the form. There is no "Abbrechen" that loses work: the user undoes instead.

### 2.6 Adding relatives (the main way the tree grows)

Every flow starts **from a person**, which avoids abstract "create relationship" dialogs.

| Button            | What happens                                                                                                                                | The extra question appears only if …                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **+ Kind**        | A new person becomes a child of this person **and** their partner                                                                           | … the person has several partners: "Mit wem?" (list + "anderer/unbekannt")                                     |
| **+ Partner/in**  | A new person becomes a partner                                                                                                              | never. Details (Ehe, Datum) can be added later under "Beziehung bearbeiten"                                    |
| **+ Elternteil**  | A new person becomes a parent. If one parent exists already, the new one becomes their partner (no question; remove with × if not a couple) | … two biological parents exist already: "Adoptiv-/Stief-/Pflegeelternteil?"                                    |
| **+ Geschwister** | A new person becomes a child of the same parents                                                                                            | … never. If the parents are unknown, an "unknown parent" placeholder is created automatically (small "?" node) |

Each flow offers **"Neue Person"** (default) or **"Vorhandene Person auswählen"** (for linking two people already in the tree,
e.g. a cousin marriage or a person added twice by mistake).

### 2.7 Deleting

"Anna Müller wirklich löschen? Ihre Verbindungen zu anderen Personen werden entfernt. Du kannst das mit ↶ rückgängig machen."
[Löschen] [Abbrechen]

### 2.8 Editing and removing relations

- **✎ on a partner:** Art der Beziehung (Paar, Ehe, Eingetragene Partnerschaft), since when and where, and
  "Getrennt?" (nein, getrennt, geschieden) with a date. Changes apply immediately, with undo.
- **✎ on a parent or child:** leibliches Kind, Adoptivkind, Stiefkind, Pflegekind. "leiblich" is disabled if the
  child already has two biological parents.
- **× on any relation:** "Verbindung entfernen?" with one sentence on what changes ("Karl ist dann nicht mehr Vater von Peter").
  The persons themselves stay. If this cuts persons off from the rest of the tree, the dialog says so:
  - **one person** left on their own: [Nur Verbindung entfernen] [Peter ganz löschen] [Abbrechen].
  - **several persons** cut off: they stay and stand next to the tree until they are connected again.
- An unknown parent ("?") without children left disappears automatically.
- **At most two biological parents:** linking an existing person as a child who already has biological parents asks
  "Was für ein Kind ist … für …?" (Adoptivkind, Stiefkind, Pflegekind).

## 3. Tree interactions (TREE-02)

- **Pan:** drag the background. **Zoom:** mouse wheel or the `+`/`−` buttons. **⤢ "Alles anzeigen"** fits the whole tree on screen.
- **Focus:** selecting a person highlights their direct line and slightly fades the others. Esc clears the selection.
- **Orientation:** ancestors at the top, descendants below (TREE-02).
- **Arrangement is automatic:** the app recomputes the whole layout after every change (architecture §4, ADR-0006), so deleting
  a person never leaves a gap. To keep the user oriented, cards **glide** to their new places, and the view stays anchored on the
  selected or newly added person. There is **no manual dragging of cards** (positions would have to be stored and would go stale
  with the next change). The mock-up places persons by hand, so there gaps do remain.
- **Relations drawn:** partners joined by a horizontal line, and children hanging from the middle of that line.
  - Divorced/separated: the couple line is interrupted by a small "//", and the children's line starts below it. **Only when it applies.**
  - Adoptive/step/foster: a dashed child line plus a label on hover. **Only when it applies.** A child keeps the
    solid line to the biological parents, and each additional parent gets its own dashed line.
  - Several partners: the person sits next to each partner in turn, each couple with its own children.

## 4. Saving behaviour as the user experiences it

| Situation                                 | What the user sees                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any change                                | Saved to the working copy instantly. The status shows "● Nicht in Datei gespeichert" until the file is written.                                                                                               |
| "Speichern" in Chrome/Edge                | The first time, a "Speichern unter" dialog. Afterwards every change is written automatically (DATA-09).                                                                                                       |
| "Speichern" in Firefox/Safari             | The file is downloaded. The first time, a hint: "Die Datei liegt jetzt in deinem Download-Ordner. Bewahre sie gut auf."                                                                                       |
| Chrome/Edge after a restart or "Öffnen"   | The file is known, but the browser asks once for permission to write when the user clicks "Speichern".                                                                                                        |
| Closing the tab with unsaved file changes | The browser asks "Seite verlassen?" The working copy is safe anyway.                                                                                                                                          |
| Not saved to the file for a long time     | On start, after 7 days, a gentle note (UI-02): "Du hast seit 8 Tagen nicht in die Datei gespeichert." [Jetzt speichern] [×]. Never saved: "Dein Stammbaum ist seit 8 Tagen nicht in einer Datei gespeichert." |

## 5. Language and wording

- German only, with short and friendly sentences.
- Address: informal **"Du"** (UI-04), friendly but not childish.
- Dates as `12.03.1923`, `*` for birth and `†` for death.
- Gender-neutral defaults: "Partner/in", "Elternteil", "Kind". Gendered words (Mutter/Vater) only if a gender is set (PERS-07).
- No technical terms in the UI: no "Datei-Handle", no "IndexedDB", no "Cache".
- **No dashes (– or —) and no middle dots (·) as separators** in UI text (the user finds they look machine-made).
  Use commas, full stops, line breaks or a spaced pipe ("Vater | * 1921 † 1999"). Date ranges read "1890 bis 1895".

## 6. Visual direction (decided with mock-up round 1)

- **"Familienalbum":** warm cream/paper tones with a mustard accent (not brown), a classic system serif font,
  photo-forward cards, the panel photo like a print glued into an album.
- Large readable fonts (base ≥ 16 px) and generous click targets.
- System fonts only (privacy: no web fonts).
- Reference: `mockups/index.html` and `mockups/shared/style.css` (colours as CSS variables).

## 7. Help

- A "?" in the project menu opens a short German help page inside the app (no internet).
- On first use, a few unobtrusive hints ("Klick auf eine Person, um Details zu sehen").

## Decisions (aligned with the user on 2026-10-24)

1. **Address:** "Du" (UI-04).
2. **Card dates:** years only on the card, full dates on hover and in the detail panel (PERS-04).
3. **Orientation:** top-down, with ancestors on top (TREE-02).
4. **"+ Geschwister" with unknown parents:** an automatic placeholder, shown as a small "?" node.

5. **Visual style (mock-up round 1):** variant A "Familienalbum", a bit more mustard and warmer. Big photo on the card,
   neutral card colours, editing a person in a **dialog** (§2.5, §6).
6. **No Rufname field** (removed 2026-10-24 on the user's request). Lists use the first given name ("Karl Brandt").
7. **Wording:** no dashes or middle dots as separators (§5).
8. **Relations can be edited and removed** from the detail panel (user request, §2.8).
9. **Additional parents:** a child can have adoptive/step/foster parents in addition to two biological parents (TREE-03).
   They are drawn with their own dashed line. At most two biological parents.

10. **A person losing their last connection** is not deleted automatically. The dialog offers "Nur Verbindung entfernen"
    or "… ganz löschen" (confirmed after mock-up round 2), so a wrongly attached person can be re-attached without retyping.
11. **Layout is automatic** and recomputed after every change; cards glide to their new places, no manual dragging (§3).

The mock-up (`mockups/index.html`) is the **visual and interaction reference** for the real UI.

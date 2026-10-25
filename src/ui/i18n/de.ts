/**
 * German UI texts, the master copy (GEN-05, ADR-0008). `en.ts` and `fr.ts` must have the same entries:
 * the typecheck fails otherwise. Wording rules (ui-concept §5, UI-04): informal "du", no dashes or middle
 * dots as separators. Grammar lives in the functions, so every language can build its own sentences.
 */
import type {
  Gender,
  ParentChildKind,
  PartnershipEndReason,
  PartnershipKind,
} from '../../core/model/types';

type Kind = Exclude<ParentChildKind, 'biological'>;

/** Gendered word if a gender is set, else the neutral one (PERS-07). */
const word = (g: Gender | undefined, female: string, male: string, neutral: string) =>
  g === 'female' ? female : g === 'male' ? male : neutral;

const KIND_PREFIX: Record<Kind, string> = { adoptive: 'Adoptiv', step: 'Stief', foster: 'Pflege' };

/** "Adoptivvater", "Stiefkind". */
const withKind = (kind: ParentChildKind | undefined, w: string) =>
  kind && kind !== 'biological' ? KIND_PREFIX[kind] + w.toLowerCase() : w;

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const pad = (n: number) => String(n).padStart(2, '0');

const QUALIFIED = {
  about: (y: number) => `ca. ${y}`,
  before: (y: number) => `vor ${y}`,
  after: (y: number) => `nach ${y}`,
  between: (y: number, y2: number) => `${y} bis ${y2}`,
};

const parentWord = (g: Gender | undefined, kind?: ParentChildKind) =>
  withKind(kind, word(g, 'Mutter', 'Vater', 'Elternteil'));
const childWord = (g: Gender | undefined, kind?: ParentChildKind) =>
  withKind(kind, word(g, 'Tochter', 'Sohn', 'Kind'));

export const de = {
  /** Name of the language in itself, for the language choice. */
  name: 'Deutsch',

  dates: {
    /** For the panel, the tooltip and the date field: "12.03.1923". */
    day: (d: number, m: number, y: number) => `${pad(d)}.${pad(m)}.${y}`,
    month: (m: number, y: number) => `${pad(m)}.${y}`,
    ...QUALIFIED,
    /** The card's year line, which must stay short in every language (user, 2026-10-25). */
    card: QUALIFIED,
    /** The live interpretation under a date field (ui-concept §2.5). */
    hint: {
      text: '→ wird so übernommen (kann nicht zum Sortieren genutzt werden)',
      day: (d: number, m: number, y: number) => `→ ${d}. ${MONTHS[m - 1]} ${y}`,
      month: (m: number, y: number) => `→ ${MONTHS[m - 1]} ${y}`,
      year: (y: number) => `→ im Jahr ${y}`,
      about: (y: number) => `→ ungefähr ${y}`,
      before: (y: number) => `→ vor ${y}`,
      after: (y: number) => `→ nach ${y}`,
      between: (y: number, y2: number) => `→ zwischen ${y} und ${y2}`,
    },
    placeholder: 'z. B. 12.03.1923 oder ca. 1850',
  },

  person: {
    unknown: 'Unbekannt',
    noName: 'Ohne Namen',
    unknownParent: 'Unbekannter Elternteil',
    /** "12.03.1923 in Lübeck". */
    atPlace: (place: string) => `in ${place}`,
    birthName: (name: string) => `geb. ${name}`,
    dateUnknown: 'Datum unbekannt',
    born: 'Geboren',
    died: 'Gestorben',
    occupation: 'Beruf',
    residences: 'Wohnorte',
  },

  /** Relation words (PERS-07). */
  words: {
    parent: parentWord,
    child: childWord,
    /** Label of a dashed child line: "Adoptivkind". */
    kind: (kind: Kind) => childWord(undefined, kind),
    partner: (g: Gender | undefined, married: boolean) =>
      married
        ? word(g, 'Ehefrau', 'Ehemann', 'Ehepartner/in')
        : word(g, 'Partnerin', 'Partner', 'Partner/in'),
    sibling: (g: Gender | undefined, full: boolean) =>
      full
        ? word(g, 'Schwester', 'Bruder', 'Geschwister')
        : 'Halb' + word(g, 'schwester', 'bruder', 'geschwister'),
    end: { divorce: 'geschieden', separation: 'getrennt' } satisfies Record<
      PartnershipEndReason,
      string
    >,
    /** "verheiratet 17.05.1947 in Lübeck". */
    started: (married: boolean, when: string) =>
      `${married ? 'verheiratet' : 'zusammen seit'} ${when}`,
  },

  /** Why a change was not possible (ModelErrorCode). */
  errors: {
    loop: 'Das geht nicht: Eine Person kann nicht ihr eigener Vorfahr sein.',
    'too-many-biological-parents':
      'Das geht nicht: Eine Person hat höchstens zwei leibliche Eltern.',
    'duplicate-link': 'Diese Verbindung gibt es schon.',
    'duplicate-partnership': 'Die beiden sind schon ein Paar.',
    'self-partnership': 'Eine Person kann nicht ihr eigener Partner sein.',
    other: 'Das hat nicht geklappt.',
  },

  common: {
    cancel: 'Abbrechen',
    done: 'Fertig',
    saveNow: 'Jetzt speichern',
    hide: 'Ausblenden',
    undoHint: 'Mit ↶ kannst du das rückgängig machen.',
  },

  app: {
    noWorkingCopy: 'Der Browser lässt das Speichern einer Arbeitskopie nicht zu.',
    workingCopyFailed:
      'Deine Änderungen konnten im Browser nicht gesichert werden. Bitte speichere sie.',
    fileWriteFailed: 'Die Datei konnte nicht geschrieben werden. Klick auf Speichern.',
    saveFailed: 'Das Speichern hat nicht geklappt. Bitte versuch es noch einmal.',
    openFailed: 'Die Datei konnte nicht geöffnet werden.',
    notAProject: 'Diese Datei ist keine Stammbaum-Datei.',
    newerVersion:
      'Diese Datei wurde mit einer neueren Version von Stammbaum erstellt. Bitte nimm die neueste Stammbaum.html.',
    damaged: 'Diese Datei ist beschädigt und kann nicht geöffnet werden.',
    newTitle: 'Neuer Stammbaum',
    create: 'Anlegen',
    downloadedTitle: 'Gespeichert',
    downloaded: [
      'Die Datei liegt jetzt in deinem Download-Ordner. Bewahre sie gut auf.',
      'Dein Browser legt bei jedem Speichern eine neue Datei an. Zum Weitermachen öffnest du am besten immer die neueste.',
    ],
    understood: 'Verstanden',
  },

  start: {
    title: 'Stammbaum',
    tagline: 'Deine Familiengeschichte, privat auf deinem Computer.',
    new: 'Neuen Stammbaum anlegen',
    open: 'Stammbaum-Datei öffnen',
    example: 'Beispiel ansehen',
  },

  /** The language choice on the start screen and in the menu. */
  language: 'Sprache',

  project: {
    new: 'Neuer Stammbaum',
    open: 'Öffnen …',
    saveAs: 'Speichern unter …',
    rename: 'Umbenennen',
    renameTitle: 'Stammbaum umbenennen',
    print: 'Drucken / Als PDF speichern',
    example: 'Beispiel ansehen',
    help: 'Hilfe',
    undo: 'Rückgängig',
    undoKey: 'Rückgängig (Strg+Z)',
    redo: 'Wiederholen',
    redoKey: 'Wiederholen (Strg+Y)',
    unsaved: '● Nicht in Datei gespeichert',
    saved: '✓ Gespeichert',
    save: 'Speichern',
    reminderWithFile: (days: number) =>
      `Du hast seit ${days} Tagen nicht in die Datei gespeichert.`,
    reminderNoFile: (days: number) =>
      `Dein Stammbaum ist seit ${days} Tagen nicht in einer Datei gespeichert.`,
    treeHint:
      'Klick auf eine Person, um Details zu sehen. Ziehen verschiebt den Baum, das Mausrad zoomt.',
    unreadablePicture:
      'Dieses Bild kann dein Browser nicht öffnen. Bitte speichere es als JPG und versuch es noch einmal.',
    photoFailed: 'Das Foto konnte nicht gespeichert werden.',
    deleted: 'Gelöscht. Mit ↶ kannst du das rückgängig machen.',
    personDeleted: 'Person gelöscht. Mit ↶ kannst du das rückgängig machen.',
    relationRemoved: 'Verbindung entfernt. Mit ↶ kannst du das rückgängig machen.',
  },

  tree: {
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    fitAll: '⤢ Alles anzeigen',
  },

  panel: {
    label: 'Details',
    close: 'Schließen (Esc)',
    unknownText:
      'Diese Person ist noch nicht bekannt. Sie wurde angelegt, damit Geschwister zusammengehören.',
    empty: 'Noch keine Angaben. Klick auf „Bearbeiten“.',
    biography: 'Lebensgeschichte',
    family: 'Familie',
    parents: 'Eltern',
    partner: 'Partner/in',
    partners: 'Partner/innen',
    children: 'Kinder',
    siblings: 'Geschwister',
    unknown: 'unbekannt',
    editRelation: 'Beziehung bearbeiten',
    editRelationTo: (name: string) => `Beziehung zu ${name} bearbeiten`,
    removeRelation: 'Verbindung entfernen',
    removeRelationTo: (name: string) => `Verbindung zu ${name} entfernen`,
    enterPerson: 'Person eintragen',
    edit: 'Bearbeiten',
    add: {
      parent: '+ Elternteil',
      partner: '+ Partner/in',
      child: '+ Kind',
      sibling: '+ Geschwister',
    },
    delete: 'Person löschen',
  },

  personDialog: {
    newTitle: 'Person eintragen',
    editTitle: 'Person bearbeiten',
    choosePhoto: 'Foto wählen …',
    removePhoto: 'Foto entfernen',
    photo: 'Foto',
    givenNames: 'Vornamen',
    givenNamesExample: 'z. B. Anna Maria',
    surname: 'Nachname (zuletzt bekannt)',
    birthName: 'Geburtsname',
    born: 'Geboren am',
    died: 'Gestorben am',
    place: 'in',
    deceased: 'verstorben, Datum unbekannt',
    more: 'Mehr Angaben',
    gender: 'Geschlecht',
    genders: { '': 'keine Angabe', female: 'weiblich', male: 'männlich', diverse: 'divers' },
    occupation: 'Beruf',
    residences: 'Wohnorte',
    residencesExample: 'z. B. Hamburg, ab 1960 Kiel',
    biography: 'Lebensgeschichte',
    extras: 'Weitere Angaben',
    extraLabel: 'Bezeichnung',
    extraLabelExample: 'z. B. Konfession',
    extraValue: 'Wert',
    extraValueExample: 'z. B. evangelisch',
    removeField: 'Feld entfernen',
    addField: '+ Feld hinzufügen',
    instant: 'Änderungen werden sofort übernommen. Mit ↶ kannst du sie rückgängig machen.',
  },

  crop: {
    title: 'Ausschnitt wählen',
    intro:
      'Verschiebe das Foto mit der Maus und stelle die Größe ein. Gespeichert wird nur dieser Ausschnitt.',
    move: 'Foto verschieben',
    size: 'Größe',
    take: 'Übernehmen',
  },

  nameDialog: {
    name: 'Name',
    example: 'z. B. Familie Müller',
  },

  unsaved: {
    title: 'Noch nicht gespeichert',
    withFile: 'Deine letzten Änderungen sind noch nicht in der Datei gespeichert.',
    noFile: 'Dieser Stammbaum ist noch nicht in einer Datei gespeichert.',
    discard: 'Ohne Speichern weiter',
  },

  deleteDialog: {
    title: (name: string) => `${name} wirklich löschen?`,
    text: (g: Gender | undefined) =>
      `${word(g, 'Ihre', 'Seine', 'Die')} Verbindungen zu anderen Personen werden entfernt. Du kannst das mit ↶ rückgängig machen.`,
    delete: 'Löschen',
  },

  addRelative: {
    titles: {
      child: 'Kind hinzufügen',
      partner: 'Partner/in hinzufügen',
      parent: 'Elternteil hinzufügen',
      sibling: 'Geschwister hinzufügen',
    },
    to: (name: string) => `zu ${name}`,
    withWhom: 'Mit wem?',
    otherParent: 'anderer oder unbekannter Elternteil',
    alsoChildOf: (name: string) => `Das Kind wird auch als Kind von ${name} eingetragen.`,
    twoParents: (name: string) =>
      `${name} hat schon zwei leibliche Eltern. Was für ein Elternteil kommt dazu?`,
    partnerOf: (name: string) => `Der Elternteil wird als Partner/in von ${name} eingetragen.`,
    placeholder:
      'Die Eltern sind noch unbekannt. Damit beide als Geschwister zusammengehören, wird ein Platzhalter „?“ als Elternteil angelegt.',
    who: 'Wer?',
    newPerson: 'Neue Person',
    existing: 'Vorhandene Person auswählen',
    existingLabel: 'Vorhandene Person',
    whatChild: (name: string, parents: string[]) =>
      `${name} hat schon leibliche Eltern. Was für ein Kind ist ${name} für ${parents.join(' und ')}?`,
    add: 'Hinzufügen',
  },

  relation: {
    title: 'Beziehung bearbeiten',
    couple: (a: string, b: string) => `${a} und ${b}`,
    kind: 'Art der Beziehung',
    kinds: {
      '': 'Paar (keine nähere Angabe)',
      marriage: 'Ehe',
      partnership: 'Eingetragene Partnerschaft',
    } satisfies Record<'' | PartnershipKind, string>,
    since: 'Seit',
    ended: 'Getrennt?',
    ends: { '': 'nein', separation: 'getrennt', divorce: 'geschieden' } satisfies Record<
      '' | PartnershipEndReason,
      string
    >,
    endedSince: 'Seit wann?',
    childIntro: (child: string, parent: string) => `${child} ist für ${parent} ein …`,
    childKinds: {
      biological: 'leibliches Kind',
      adoptive: 'Adoptivkind',
      step: 'Stiefkind',
      foster: 'Pflegekind',
    } satisfies Record<ParentChildKind, string>,
    hasTwoParents: '(hat schon zwei leibliche Eltern)',
  },

  removeRelation: {
    title: 'Verbindung entfernen?',
    noCouple: (a: string, b: string) => `${a} und ${b} sind dann kein Paar mehr.`,
    sharedChildren: 'Gemeinsame Kinder bleiben Kinder von beiden.',
    fromPlaceholder: (child: string) =>
      `Die Verbindung von ${child} zum unbekannten Elternteil wird entfernt.`,
    noParent: (
      parent: string,
      child: string,
      g: Gender | undefined,
      kind: ParentChildKind | undefined,
    ) => `${parent} ist dann nicht mehr ${parentWord(g, kind)} von ${child}.`,
    alone: (name: string) =>
      `Danach hat ${name} keine Verbindung mehr zu anderen Personen. Du kannst ${name} behalten (steht dann allein neben dem Stammbaum) oder ganz löschen.`,
    apart: (count: number) =>
      `Danach hängen ${count} Personen nicht mehr mit dem übrigen Stammbaum zusammen. Sie bleiben erhalten und stehen daneben, bis du sie wieder verbindest.`,
    onlyRemove: 'Nur Verbindung entfernen',
    remove: 'Verbindung entfernen',
    deleteToo: (name: string) => `${name} ganz löschen`,
  },

  /** In-app help (ui-concept §7). */
  help: {
    title: 'Hilfe',
    intro: 'Dein Stammbaum bleibt auf deinem Computer. Es wird nichts verschickt.',
    sections: [
      {
        title: 'Personen hinzufügen',
        text: 'Klick auf eine Person. Rechts erscheinen ihre Angaben. Mit „+ Elternteil“, „+ Partner/in“, „+ Kind“ und „+ Geschwister“ fügst du Verwandte hinzu, mit „Bearbeiten“ änderst du Namen, Daten und Foto. Alle Angaben sind freiwillig. Ungenaue Daten gehen auch, zum Beispiel „ca. 1850“ oder „vor 1900“.',
      },
      {
        title: 'Baum bewegen und zoomen',
        text: 'Zieh mit der Maus, um den Baum zu verschieben. Mit dem Mausrad oder mit + und − zoomst du. „Alles anzeigen“ zeigt den ganzen Baum. Ein Doppelklick auf eine Person holt sie in die Mitte.',
      },
      {
        title: 'Beziehungen ändern',
        text: 'In den Angaben einer Person steht bei Eltern, Partnern und Kindern ein ✎ zum Ändern (zum Beispiel Ehe, Scheidung, Adoptivkind) und ein × zum Entfernen der Verbindung. Jede Änderung machst du mit ↶ oder Strg+Z rückgängig.',
      },
      {
        title: 'Speichern und Sichern',
        text: 'Deine Änderungen bleiben im Browser erhalten, auch wenn du ihn schließt. Richtig sicher ist dein Stammbaum aber erst in einer Datei: Klick auf „Speichern“. In Chrome und Edge wählst du einmal einen Ort, danach kommt jede Änderung von selbst in die Datei. In Firefox und Safari landet die Datei im Download-Ordner. Klick nach Änderungen einfach wieder auf „Speichern“. Kopier die Datei ab und zu auf einen USB-Stick.',
      },
      {
        title: 'Drucken',
        text: 'Klick oben links auf den Namen deines Stammbaums und dann auf „Drucken / Als PDF speichern“. Der ganze Baum kommt auf eine Seite im Querformat. Für eine PDF-Datei wählst du im Druckfenster als Drucker „Als PDF speichern“ (auf dem Mac unten „PDF“, dann „Als PDF sichern“).',
      },
    ],
    close: 'Schließen',
  },
};

export type Texts = typeof de;

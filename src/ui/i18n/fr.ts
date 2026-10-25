/**
 * French UI texts (GEN-05, ADR-0008), with the same entries as the German master copy `de.ts`.
 * Informal "tu" (UI-04), French typography: « » with no-break spaces, a no-break space before ? ! : ;.
 */
import type { Gender, ParentChildKind } from '../../core/model/types';
import type { Texts } from './de';

type Kind = Exclude<ParentChildKind, 'biological'>;

/** Gendered word if a gender is set, else the neutral one (PERS-07). */
const word = (g: Gender | undefined, female: string, male: string, neutral: string) =>
  g === 'female' ? female : g === 'male' ? male : neutral;

/** Female, male and neutral word per kind of link. */
const PARENTS: Record<ParentChildKind, [string, string, string]> = {
  biological: ['Mère', 'Père', 'Parent'],
  adoptive: ['Mère adoptive', 'Père adoptif', 'Parent adoptif'],
  step: ['Belle-mère', 'Beau-père', 'Beau-parent'],
  foster: ['Mère d’accueil', 'Père d’accueil', 'Parent d’accueil'],
};
const CHILDREN: Record<ParentChildKind, [string, string, string]> = {
  biological: ['Fille', 'Fils', 'Enfant'],
  adoptive: ['Fille adoptive', 'Fils adoptif', 'Enfant adoptif'],
  step: ['Belle-fille', 'Beau-fils', 'Bel-enfant'],
  foster: ['Fille d’accueil', 'Fils d’accueil', 'Enfant d’accueil'],
};

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** "d’Anna", "de Karl". */
const of = (name: string) =>
  /^[aeiouyàâéèêëîïôûAEIOUYÀÂÉÈÊËÎÏÔÛ]/.test(name) ? `d’${name}` : `de ${name}`;

const parentWord = (g: Gender | undefined, kind?: ParentChildKind) =>
  word(g, ...PARENTS[kind ?? 'biological']);
const childWord = (g: Gender | undefined, kind?: ParentChildKind) =>
  word(g, ...CHILDREN[kind ?? 'biological']);

export const fr: Texts = {
  name: 'Français',

  dates: {
    day: (d: number, m: number, y: number) => `${pad(d)}/${pad(m)}/${y}`,
    month: (m: number, y: number) => `${pad(m)}/${y}`,
    about: (y: number) => `vers ${y}`,
    before: (y: number) => `avant ${y}`,
    after: (y: number) => `après ${y}`,
    between: (y: number, y2: number) => `entre ${y} et ${y2}`,
    hint: {
      text: '→ repris tel quel (ne peut pas servir au tri)',
      day: (d: number, m: number, y: number) => `→ ${d === 1 ? '1er' : d} ${MONTHS[m - 1]} ${y}`,
      month: (m: number, y: number) => `→ ${MONTHS[m - 1]} ${y}`,
      year: (y: number) => `→ en ${y}`,
      about: (y: number) => `→ vers ${y}`,
      before: (y: number) => `→ avant ${y}`,
      after: (y: number) => `→ après ${y}`,
      between: (y: number, y2: number) => `→ entre ${y} et ${y2}`,
    },
    placeholder: 'p. ex. 12/03/1923 ou vers 1850',
  },

  person: {
    unknown: 'Inconnu',
    noName: 'Sans nom',
    unknownParent: 'Parent inconnu',
    atPlace: (place: string) => `à ${place}`,
    birthName: (name: string) => `né(e) ${name}`,
    dateUnknown: 'date inconnue',
    born: 'Naissance',
    died: 'Décès',
    occupation: 'Profession',
    residences: 'Lieux de résidence',
  },

  words: {
    parent: parentWord,
    child: childWord,
    kind: (kind: Kind) => childWord(undefined, kind),
    partner: (g: Gender | undefined, married: boolean) =>
      married
        ? word(g, 'Épouse', 'Époux', 'Conjoint(e)')
        : word(g, 'Compagne', 'Compagnon', 'Partenaire'),
    sibling: (g: Gender | undefined, full: boolean) =>
      full
        ? word(g, 'Sœur', 'Frère', 'Frère ou sœur')
        : word(g, 'Demi-sœur', 'Demi-frère', 'Demi-frère ou demi-sœur'),
    end: { divorce: 'divorcés', separation: 'séparés' },
    started: (married: boolean, when: string) =>
      `${married ? 'mariés' : 'ensemble depuis'} ${when}`,
  },

  errors: {
    loop: 'Impossible\u00a0: une personne ne peut pas être son propre ancêtre.',
    'too-many-biological-parents':
      'Impossible\u00a0: une personne a au plus deux parents biologiques.',
    'duplicate-link': 'Ce lien existe déjà.',
    'duplicate-partnership': 'Ces deux personnes forment déjà un couple.',
    'self-partnership': 'Une personne ne peut pas être son propre partenaire.',
    other: 'Cela n’a pas marché.',
  },

  common: {
    cancel: 'Annuler',
    done: 'Terminé',
    saveNow: 'Enregistrer maintenant',
    hide: 'Masquer',
    undoHint: 'Tu peux annuler avec ↶.',
  },

  app: {
    noWorkingCopy: 'Le navigateur ne permet pas d’enregistrer une copie de travail.',
    workingCopyFailed:
      'Tes modifications n’ont pas pu être sauvegardées dans le navigateur. Enregistre-les, s’il te plaît.',
    fileWriteFailed: 'Le fichier n’a pas pu être écrit. Clique sur Enregistrer.',
    saveFailed: 'L’enregistrement n’a pas marché. Réessaie, s’il te plaît.',
    openFailed: 'Le fichier n’a pas pu être ouvert.',
    notAProject: 'Ce fichier n’est pas un fichier Stammbaum.',
    newerVersion:
      'Ce fichier a été créé avec une version plus récente de Stammbaum. Prends la dernière version de Stammbaum.html.',
    damaged: 'Ce fichier est endommagé et ne peut pas être ouvert.',
    newTitle: 'Nouvel arbre',
    create: 'Créer',
    downloadedTitle: 'Enregistré',
    downloaded: [
      'Le fichier se trouve maintenant dans ton dossier Téléchargements. Garde-le précieusement.',
      'Ton navigateur crée un nouveau fichier à chaque enregistrement. Pour continuer, ouvre toujours le plus récent.',
    ],
    understood: 'Compris',
  },

  start: {
    title: 'Stammbaum',
    tagline: 'Ton histoire familiale, en privé sur ton ordinateur.',
    new: 'Créer un nouvel arbre',
    open: 'Ouvrir un fichier Stammbaum',
    example: 'Voir l’exemple',
  },

  language: 'Langue',

  project: {
    new: 'Nouvel arbre',
    open: 'Ouvrir…',
    saveAs: 'Enregistrer sous…',
    rename: 'Renommer',
    renameTitle: 'Renommer l’arbre',
    print: 'Imprimer / Enregistrer en PDF',
    example: 'Voir l’exemple',
    help: 'Aide',
    undo: 'Annuler',
    undoKey: 'Annuler (Ctrl+Z)',
    redo: 'Rétablir',
    redoKey: 'Rétablir (Ctrl+Y)',
    unsaved: '● Pas enregistré dans le fichier',
    saved: '✓ Enregistré',
    save: 'Enregistrer',
    reminderWithFile: (days: number) =>
      `Tu n’as pas enregistré dans le fichier depuis ${days} jours.`,
    reminderNoFile: (days: number) =>
      `Ton arbre n’est pas enregistré dans un fichier depuis ${days} jours.`,
    treeHint:
      'Clique sur une personne pour voir ses détails. Fais glisser pour déplacer l’arbre, la molette de la souris zoome.',
    unreadablePicture:
      'Ton navigateur ne peut pas ouvrir cette image. Enregistre-la en JPG et réessaie.',
    photoFailed: 'La photo n’a pas pu être enregistrée.',
    deleted: 'Supprimé. Tu peux annuler avec ↶.',
    personDeleted: 'Personne supprimée. Tu peux annuler avec ↶.',
    relationRemoved: 'Lien supprimé. Tu peux annuler avec ↶.',
  },

  tree: {
    zoomIn: 'Agrandir',
    zoomOut: 'Réduire',
    fitAll: '⤢ Tout afficher',
  },

  panel: {
    label: 'Détails',
    close: 'Fermer (Échap)',
    unknownText:
      'Cette personne n’est pas encore connue. Elle a été créée pour que les frères et sœurs restent ensemble.',
    empty: 'Pas encore d’informations. Clique sur «\u00a0Modifier\u00a0».',
    biography: 'Biographie',
    family: 'Famille',
    parents: 'Parents',
    partner: 'Partenaire',
    partners: 'Partenaires',
    children: 'Enfants',
    siblings: 'Frères et sœurs',
    unknown: 'inconnu',
    editRelation: 'Modifier la relation',
    editRelationTo: (name: string) => `Modifier la relation avec ${name}`,
    removeRelation: 'Supprimer le lien',
    removeRelationTo: (name: string) => `Supprimer le lien avec ${name}`,
    enterPerson: 'Saisir la personne',
    edit: 'Modifier',
    add: {
      parent: '+ Parent',
      partner: '+ Partenaire',
      child: '+ Enfant',
      sibling: '+ Frère ou sœur',
    },
    delete: 'Supprimer la personne',
  },

  personDialog: {
    newTitle: 'Saisir la personne',
    editTitle: 'Modifier la personne',
    choosePhoto: 'Choisir une photo…',
    removePhoto: 'Retirer la photo',
    photo: 'Photo',
    givenNames: 'Prénoms',
    givenNamesExample: 'p. ex. Anne Marie',
    surname: 'Nom (le dernier connu)',
    birthName: 'Nom de naissance',
    born: 'Né(e) le',
    died: 'Décédé(e) le',
    place: 'à',
    deceased: 'décédé(e), date inconnue',
    more: 'Plus d’informations',
    gender: 'Sexe',
    genders: { '': 'non précisé', female: 'féminin', male: 'masculin', diverse: 'divers' },
    occupation: 'Profession',
    residences: 'Lieux de résidence',
    residencesExample: 'p. ex. Lyon, à partir de 1960 Paris',
    biography: 'Biographie',
    extras: 'Autres informations',
    extraLabel: 'Intitulé',
    extraLabelExample: 'p. ex. Religion',
    extraValue: 'Valeur',
    extraValueExample: 'p. ex. catholique',
    removeField: 'Supprimer le champ',
    addField: '+ Ajouter un champ',
    instant: 'Les modifications sont prises en compte tout de suite. Tu peux les annuler avec ↶.',
  },

  crop: {
    title: 'Choisir le cadrage',
    intro: 'Déplace la photo avec la souris et règle la taille. Seul ce cadrage est enregistré.',
    move: 'Déplacer la photo',
    size: 'Taille',
    take: 'Valider',
  },

  nameDialog: {
    name: 'Nom',
    example: 'p. ex. Famille Martin',
  },

  unsaved: {
    title: 'Pas encore enregistré',
    withFile: 'Tes dernières modifications ne sont pas encore enregistrées dans le fichier.',
    noFile: 'Cet arbre n’est pas encore enregistré dans un fichier.',
    discard: 'Continuer sans enregistrer',
  },

  deleteDialog: {
    title: (name: string) => `Supprimer vraiment ${name}\u00a0?`,
    // "Ses liens" does not depend on the gender.
    text: () => 'Ses liens avec les autres personnes seront supprimés. Tu peux annuler avec ↶.',
    delete: 'Supprimer',
  },

  addRelative: {
    titles: {
      child: 'Ajouter un enfant',
      partner: 'Ajouter un partenaire',
      parent: 'Ajouter un parent',
      sibling: 'Ajouter un frère ou une sœur',
    },
    to: (name: string) => `pour ${name}`,
    withWhom: 'Avec qui\u00a0?',
    otherParent: 'autre parent ou parent inconnu',
    alsoChildOf: (name: string) => `L’enfant est aussi enregistré comme enfant ${of(name)}.`,
    twoParents: (name: string) =>
      `${name} a déjà deux parents biologiques. Quel genre de parent s’ajoute\u00a0?`,
    partnerOf: (name: string) => `Le parent est enregistré comme partenaire ${of(name)}.`,
    placeholder:
      'Les parents sont encore inconnus. Pour que les deux restent frères et sœurs, un parent «\u00a0?\u00a0» est créé à leur place.',
    who: 'Qui\u00a0?',
    newPerson: 'Nouvelle personne',
    existing: 'Choisir une personne existante',
    existingLabel: 'Personne existante',
    whatChild: (name: string, parents: string[]) =>
      `${name} a déjà des parents biologiques. Quel type d’enfant est ${name} pour ${parents.join(' et ')}\u00a0?`,
    add: 'Ajouter',
  },

  relation: {
    title: 'Modifier la relation',
    couple: (a: string, b: string) => `${a} et ${b}`,
    kind: 'Type de relation',
    kinds: {
      '': 'Couple (sans précision)',
      marriage: 'Mariage',
      partnership: 'Partenariat enregistré',
    },
    since: 'Depuis',
    ended: 'Séparés\u00a0?',
    ends: { '': 'non', separation: 'séparés', divorce: 'divorcés' },
    endedSince: 'Depuis quand\u00a0?',
    childIntro: (child: string, parent: string) => `${child} est pour ${parent}…`,
    childKinds: {
      biological: 'enfant biologique',
      adoptive: 'enfant adoptif',
      step: 'bel-enfant',
      foster: 'enfant d’accueil',
    },
    hasTwoParents: '(a déjà deux parents biologiques)',
  },

  removeRelation: {
    title: 'Supprimer le lien\u00a0?',
    noCouple: (a: string, b: string) => `${a} et ${b} ne formeront plus un couple.`,
    sharedChildren: 'Les enfants communs restent les enfants des deux.',
    fromPlaceholder: (child: string) =>
      `Le lien entre ${child} et le parent inconnu sera supprimé.`,
    noParent: (
      parent: string,
      child: string,
      g: Gender | undefined,
      kind: ParentChildKind | undefined,
    ) =>
      `${parent} ne sera plus ${g === 'female' ? 'la' : 'le'} ${parentWord(g, kind).toLowerCase()} ${of(child)}.`,
    alone: (name: string) =>
      `Ensuite, ${name} n’aura plus aucun lien avec les autres personnes. Tu peux garder cette personne (elle sera placée à part, à côté de l’arbre) ou la supprimer complètement.`,
    apart: (count: number) =>
      `Ensuite, ${count} personnes ne seront plus reliées au reste de l’arbre. Elles sont conservées et placées à côté, jusqu’à ce que tu les relies à nouveau.`,
    onlyRemove: 'Supprimer seulement le lien',
    remove: 'Supprimer le lien',
    deleteToo: (name: string) => `Supprimer complètement ${name}`,
  },

  help: {
    title: 'Aide',
    intro: 'Ton arbre reste sur ton ordinateur. Rien n’est envoyé.',
    sections: [
      {
        title: 'Ajouter des personnes',
        text: 'Clique sur une personne. Ses informations apparaissent à droite. Avec «\u00a0+\u00a0Parent\u00a0», «\u00a0+\u00a0Partenaire\u00a0», «\u00a0+\u00a0Enfant\u00a0» et «\u00a0+\u00a0Frère ou sœur\u00a0», tu ajoutes des proches, avec «\u00a0Modifier\u00a0» tu changes les noms, les dates et la photo. Toutes les informations sont facultatives. Les dates approximatives fonctionnent aussi, par exemple «\u00a0vers 1850\u00a0» ou «\u00a0avant 1900\u00a0».',
      },
      {
        title: 'Déplacer et zoomer',
        text: 'Fais glisser avec la souris pour déplacer l’arbre. Avec la molette ou avec + et −, tu zoomes. «\u00a0Tout afficher\u00a0» montre l’arbre entier. Un double-clic sur une personne l’ouvre pour la modifier.',
      },
      {
        title: 'Modifier les relations',
        text: 'Dans les informations d’une personne, les parents, partenaires et enfants ont un ✎ pour modifier (par exemple mariage, divorce, enfant adoptif) et un × pour supprimer le lien. Tu annules chaque modification avec ↶ ou Ctrl+Z.',
      },
      {
        title: 'Enregistrer et sauvegarder',
        text: 'Tes modifications restent dans le navigateur, même si tu le fermes. Mais ton arbre n’est vraiment en sécurité que dans un fichier\u00a0: clique sur «\u00a0Enregistrer\u00a0». Dans Chrome et Edge, tu choisis une fois un emplacement, ensuite chaque modification va toute seule dans le fichier. Dans Firefox et Safari, le fichier arrive dans le dossier Téléchargements. Après des modifications, clique simplement à nouveau sur «\u00a0Enregistrer\u00a0». Copie le fichier de temps en temps sur une clé USB.',
      },
      {
        title: 'Langue',
        text: 'En bas de la page d’accueil et en bas du menu (clic sur le nom de ton arbre), tu choisis Deutsch, English ou Français. Chacun peut prendre une autre langue sur son ordinateur, le fichier reste le même.',
      },
      {
        title: 'Imprimer',
        text: 'Clique en haut à gauche sur le nom de ton arbre, puis sur «\u00a0Imprimer / Enregistrer en PDF\u00a0». L’arbre entier tient sur une page au format paysage. Pour un fichier PDF, choisis comme imprimante «\u00a0Enregistrer au format PDF\u00a0» (sur Mac, en bas «\u00a0PDF\u00a0», puis «\u00a0Enregistrer au format PDF\u00a0»).',
      },
    ],
    close: 'Fermer',
  },
};

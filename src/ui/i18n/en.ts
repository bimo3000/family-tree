/** English UI texts (GEN-05). Same entries as the German master copy `de.ts`. */
import type { Gender, ParentChildKind } from '../../core/model/types';
import type { Texts } from './de';

type Kind = Exclude<ParentChildKind, 'biological'>;

const word = (g: Gender | undefined, female: string, male: string, neutral: string) =>
  g === 'female' ? female : g === 'male' ? male : neutral;

const KIND_PREFIX: Record<Kind, string> = { adoptive: 'Adoptive', step: 'Step', foster: 'Foster' };

/** "Adoptive father", "Stepchild", "Foster mother". */
const withKind = (kind: ParentChildKind | undefined, w: string) => {
  if (!kind || kind === 'biological') return w;
  return kind === 'step' ? 'Step' + w.toLowerCase() : `${KIND_PREFIX[kind]} ${w.toLowerCase()}`;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
/** "12 Mar 1923": the month in letters, so day and month can't be mixed up (UK and US order differ). */
const short = (m: number) => MONTHS[m - 1]!.slice(0, 3);

const parentWord = (g: Gender | undefined, kind?: ParentChildKind) =>
  withKind(kind, word(g, 'Mother', 'Father', 'Parent'));
const childWord = (g: Gender | undefined, kind?: ParentChildKind) =>
  withKind(kind, word(g, 'Daughter', 'Son', 'Child'));

export const en: Texts = {
  name: 'English',

  dates: {
    day: (d, m, y) => `${d} ${short(m)} ${y}`,
    month: (m, y) => `${short(m)} ${y}`,
    about: (y) => `about ${y}`,
    before: (y) => `before ${y}`,
    after: (y) => `after ${y}`,
    between: (y, y2) => `${y} to ${y2}`,
    hint: {
      text: '→ kept as typed (can’t be used for sorting)',
      day: (d, m, y) => `→ ${d} ${MONTHS[m - 1]} ${y}`,
      month: (m, y) => `→ ${MONTHS[m - 1]} ${y}`,
      year: (y) => `→ in ${y}`,
      about: (y) => `→ about ${y}`,
      before: (y) => `→ before ${y}`,
      after: (y) => `→ after ${y}`,
      between: (y, y2) => `→ between ${y} and ${y2}`,
    },
    placeholder: 'e.g. 12 Mar 1923 or about 1850',
  },

  person: {
    unknown: 'Unknown',
    noName: 'No name',
    unknownParent: 'Unknown parent',
    atPlace: (place) => `in ${place}`,
    birthName: (name) => `born ${name}`,
    dateUnknown: 'date unknown',
    born: 'Born',
    died: 'Died',
    occupation: 'Occupation',
    residences: 'Places lived',
  },

  words: {
    parent: parentWord,
    child: childWord,
    kind: (kind) => childWord(undefined, kind),
    partner: (g, married) =>
      married ? word(g, 'Wife', 'Husband', 'Spouse') : word(g, 'Partner', 'Partner', 'Partner'),
    sibling: (g, full) =>
      full
        ? word(g, 'Sister', 'Brother', 'Sibling')
        : word(g, 'Half-sister', 'Half-brother', 'Half-sibling'),
    end: { divorce: 'divorced', separation: 'separated' },
    started: (married, when) => `${married ? 'married' : 'together since'} ${when}`,
  },

  errors: {
    loop: 'That’s not possible: a person can’t be their own ancestor.',
    'too-many-biological-parents': 'That’s not possible: a person has at most two birth parents.',
    'duplicate-link': 'This connection already exists.',
    'duplicate-partnership': 'These two are already a couple.',
    'self-partnership': 'A person can’t be their own partner.',
    other: 'That didn’t work.',
  },

  common: {
    cancel: 'Cancel',
    done: 'Done',
    saveNow: 'Save now',
    hide: 'Hide',
    undoHint: 'You can undo this with ↶.',
  },

  app: {
    noWorkingCopy: 'Your browser doesn’t allow keeping a working copy.',
    workingCopyFailed: 'Your changes couldn’t be kept in the browser. Please save them.',
    fileWriteFailed: 'The file couldn’t be written. Click Save.',
    saveFailed: 'Saving didn’t work. Please try again.',
    openFailed: 'The file couldn’t be opened.',
    notAProject: 'This file is not a Stammbaum file.',
    newerVersion:
      'This file was made with a newer version of Stammbaum. Please use the latest Stammbaum.html.',
    damaged: 'This file is damaged and can’t be opened.',
    newTitle: 'New family tree',
    create: 'Create',
    downloadedTitle: 'Saved',
    downloaded: [
      'The file is now in your Downloads folder. Keep it safe.',
      'Your browser makes a new file every time you save. To carry on, always open the newest one.',
    ],
    understood: 'Got it',
  },

  start: {
    title: 'Stammbaum',
    tagline: 'Your family history, private on your computer.',
    new: 'Create a new family tree',
    open: 'Open a Stammbaum file',
    example: 'See an example',
  },

  language: 'Language',

  project: {
    new: 'New family tree',
    open: 'Open …',
    saveAs: 'Save as …',
    rename: 'Rename',
    renameTitle: 'Rename family tree',
    print: 'Print / Save as PDF',
    example: 'See an example',
    help: 'Help',
    undo: 'Undo',
    undoKey: 'Undo (Ctrl+Z)',
    redo: 'Redo',
    redoKey: 'Redo (Ctrl+Y)',
    unsaved: '● Not saved to a file',
    saved: '✓ Saved',
    save: 'Save',
    reminderWithFile: (days) => `You haven’t saved to the file for ${days} days.`,
    reminderNoFile: (days) => `Your family tree hasn’t been saved to a file for ${days} days.`,
    treeHint: 'Click a person to see details. Drag to move the tree, use the mouse wheel to zoom.',
    unreadablePicture:
      'Your browser can’t open this picture. Please save it as a JPG and try again.',
    photoFailed: 'The photo couldn’t be saved.',
    deleted: 'Deleted. You can undo this with ↶.',
    personDeleted: 'Person deleted. You can undo this with ↶.',
    relationRemoved: 'Connection removed. You can undo this with ↶.',
  },

  tree: {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fitAll: '⤢ Show all',
  },

  panel: {
    label: 'Details',
    close: 'Close (Esc)',
    unknownText: 'This person isn’t known yet. They were added so that siblings belong together.',
    empty: 'No details yet. Click “Edit”.',
    biography: 'Life story',
    family: 'Family',
    parents: 'Parents',
    partner: 'Partner',
    partners: 'Partners',
    children: 'Children',
    siblings: 'Siblings',
    unknown: 'unknown',
    editRelation: 'Edit relationship',
    editRelationTo: (name) => `Edit relationship with ${name}`,
    removeRelation: 'Remove connection',
    removeRelationTo: (name) => `Remove connection to ${name}`,
    enterPerson: 'Enter person',
    edit: 'Edit',
    add: {
      parent: '+ Parent',
      partner: '+ Partner',
      child: '+ Child',
      sibling: '+ Sibling',
    },
    delete: 'Delete person',
  },

  personDialog: {
    newTitle: 'Enter person',
    editTitle: 'Edit person',
    choosePhoto: 'Choose photo …',
    removePhoto: 'Remove photo',
    photo: 'Photo',
    givenNames: 'Given names',
    givenNamesExample: 'e.g. Anna Maria',
    surname: 'Surname (last known)',
    birthName: 'Birth name',
    born: 'Born on',
    died: 'Died on',
    place: 'in',
    deceased: 'deceased, date unknown',
    more: 'More details',
    gender: 'Gender',
    genders: { '': 'not given', female: 'female', male: 'male', diverse: 'diverse' },
    occupation: 'Occupation',
    residences: 'Places lived',
    residencesExample: 'e.g. Hamburg, from 1960 Kiel',
    biography: 'Life story',
    extras: 'Other details',
    extraLabel: 'Label',
    extraLabelExample: 'e.g. Religion',
    extraValue: 'Value',
    extraValueExample: 'e.g. Protestant',
    removeField: 'Remove field',
    addField: '+ Add field',
    instant: 'Changes are applied at once. You can undo them with ↶.',
  },

  crop: {
    title: 'Choose the part to show',
    intro: 'Move the photo with the mouse and set the size. Only this part is saved.',
    move: 'Move photo',
    size: 'Size',
    take: 'Use this',
  },

  nameDialog: {
    name: 'Name',
    example: 'e.g. Miller family',
  },

  unsaved: {
    title: 'Not saved yet',
    withFile: 'Your latest changes are not in the file yet.',
    noFile: 'This family tree is not saved to a file yet.',
    discard: 'Continue without saving',
  },

  deleteDialog: {
    title: (name) => `Really delete ${name}?`,
    text: (g) =>
      `${word(g, 'Her', 'His', 'Their')} connections to other people will be removed. You can undo this with ↶.`,
    delete: 'Delete',
  },

  addRelative: {
    titles: {
      child: 'Add child',
      partner: 'Add partner',
      parent: 'Add parent',
      sibling: 'Add sibling',
    },
    to: (name) => `for ${name}`,
    withWhom: 'With whom?',
    otherParent: 'another or unknown parent',
    alsoChildOf: (name) => `The child is also entered as a child of ${name}.`,
    twoParents: (name) =>
      `${name} already has two birth parents. What kind of parent are you adding?`,
    partnerOf: (name) => `The parent is entered as the partner of ${name}.`,
    placeholder:
      'The parents are not known yet. So that both belong together as siblings, a placeholder “?” is added as their parent.',
    who: 'Who?',
    newPerson: 'New person',
    existing: 'Choose an existing person',
    existingLabel: 'Existing person',
    whatChild: (name, parents) =>
      `${name} already has birth parents. What kind of child is ${name} to ${parents.join(' and ')}?`,
    add: 'Add',
  },

  relation: {
    title: 'Edit relationship',
    couple: (a, b) => `${a} and ${b}`,
    kind: 'Kind of relationship',
    kinds: {
      '': 'Couple (no further details)',
      marriage: 'Marriage',
      partnership: 'Registered partnership',
    },
    since: 'Since',
    ended: 'Separated?',
    ends: { '': 'no', separation: 'separated', divorce: 'divorced' },
    endedSince: 'Since when?',
    childIntro: (child, parent) => `To ${parent}, ${child} is a …`,
    childKinds: {
      biological: 'birth child',
      adoptive: 'adopted child',
      step: 'stepchild',
      foster: 'foster child',
    },
    hasTwoParents: '(already has two birth parents)',
  },

  removeRelation: {
    title: 'Remove connection?',
    noCouple: (a, b) => `${a} and ${b} will no longer be a couple.`,
    sharedChildren: 'Shared children stay the children of both.',
    fromPlaceholder: (child) => `The connection from ${child} to the unknown parent is removed.`,
    noParent: (parent, child, g, kind) =>
      `${parent} will no longer be the ${parentWord(g, kind).toLowerCase()} of ${child}.`,
    alone: (name) =>
      `After that, ${name} has no connection to anyone else. You can keep ${name} (then standing alone next to the family tree) or delete them completely.`,
    apart: (count) =>
      `After that, ${count} people are no longer connected to the rest of the family tree. They are kept and stand next to it until you connect them again.`,
    onlyRemove: 'Only remove the connection',
    remove: 'Remove connection',
    deleteToo: (name) => `Delete ${name} completely`,
  },

  help: {
    title: 'Help',
    intro: 'Your family tree stays on your computer. Nothing is sent anywhere.',
    sections: [
      {
        title: 'Adding people',
        text: 'Click a person. Their details appear on the right. With “+ Parent”, “+ Partner”, “+ Child” and “+ Sibling” you add relatives, with “Edit” you change names, dates and the photo. Every detail is optional. Vague dates work too, for example “about 1850” or “before 1900”.',
      },
      {
        title: 'Moving and zooming the tree',
        text: 'Drag with the mouse to move the tree. Zoom with the mouse wheel or with + and −. “Show all” shows the whole tree. A double-click on a person brings them to the middle.',
      },
      {
        title: 'Changing relationships',
        text: 'In a person’s details, parents, partners and children have a ✎ to change the relationship (for example marriage, divorce, adopted child) and a × to remove the connection. You can undo every change with ↶ or Ctrl+Z.',
      },
      {
        title: 'Saving and backing up',
        text: 'Your changes are kept in the browser, even when you close it. But your family tree is only really safe in a file: click “Save”. In Chrome and Edge you choose a place once, after that every change goes into the file by itself. In Firefox and Safari the file lands in your Downloads folder. After changes, simply click “Save” again. Copy the file to a USB stick now and then.',
      },
      {
        title: 'Language',
        text: 'At the bottom of the start page and at the bottom of the menu (click the name of your family tree) you choose Deutsch, English or Français. Everyone can pick a different language on their own computer; the file stays the same.',
      },
      {
        title: 'Printing',
        text: 'Click the name of your family tree at the top left, then “Print / Save as PDF”. The whole tree fits on one landscape page. For a PDF file, choose “Save as PDF” as the printer in the print window (on a Mac: “PDF” at the bottom, then “Save as PDF”).',
      },
    ],
    close: 'Close',
  },
};

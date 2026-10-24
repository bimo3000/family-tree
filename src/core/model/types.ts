/**
 * The family-tree data model (docs/concept/data-model.md). A project holds three lists: persons,
 * partnerships and parent-child links. Everything else (siblings, families, generations) is derived.
 * Every field except the IDs is optional (PERS-02). Field names are English; the UI shows German labels.
 */

export type PersonId = string;

/** A flexible date (PERS-06, data-model §4). Only the interpreted value is stored, never the typed text. */
export type FlexDate = ExactDate | QualifiedDate | RangeDate | TextDate;

/** `{ y }`, `{ y, m }` or `{ y, m, d }`. */
export interface ExactDate {
  y: number;
  m?: number;
  d?: number;
}

/** "ca. 1850", "vor 1900", "nach 1900". */
export interface QualifiedDate {
  y: number;
  q: 'about' | 'before' | 'after';
}

/** "zw. 1890 und 1895". */
export interface RangeDate {
  y: number;
  q: 'between';
  y2: number;
}

/** Input the app could not read, kept as written. It can't be used for sorting. */
export interface TextDate {
  text: string;
}

export interface LifeEvent {
  date?: FlexDate;
  place?: string;
}

export type Gender = 'female' | 'male' | 'diverse';

/** A free label/value pair ("Weitere Angaben"), for everything without a dedicated field. */
export interface ExtraField {
  label: string;
  value: string;
}

export interface Person {
  id: PersonId;
  givenNames?: string;
  callName?: string;
  /** Last known surname (PERS-04). */
  surname?: string;
  birthName?: string;
  /** Used for wording only (PERS-07). Absent means unknown. */
  gender?: Gender;
  birth?: LifeEvent;
  death?: LifeEvent;
  /** Only needed when the person is dead but the death date is unknown. */
  deceased?: boolean;
  occupation?: string;
  residences?: string;
  biography?: string;
  photoId?: string;
  extraFields?: ExtraField[];
}

export type PartnershipKind = 'marriage' | 'partnership';
export type PartnershipEndReason = 'divorce' | 'separation';

export interface PartnershipEnd {
  date?: FlexDate;
  reason?: PartnershipEndReason;
}

export interface Partnership {
  id: string;
  partners: [PersonId, PersonId];
  /** Absent: simply drawn as a couple. */
  kind?: PartnershipKind;
  start?: LifeEvent;
  end?: PartnershipEnd;
}

/** All the optional details of a partnership, i.e. everything except its identity. */
export type PartnershipDetails = Omit<Partnership, 'id' | 'partners'>;

export type ParentChildKind = 'biological' | 'adoptive' | 'step' | 'foster';

export interface ParentChildLink {
  parentId: PersonId;
  childId: PersonId;
  /** Absent means biological (99 % of cases). */
  kind?: ParentChildKind;
}

export interface ImageRef {
  id: string;
  /** Path inside the project file, e.g. `bilder/img_8f3a.jpg`. */
  file: string;
  width: number;
  height: number;
}

/** Remembered view state. A convenience, not family data. */
export interface ProjectView {
  focusPersonId?: PersonId;
}

/**
 * One family-tree project as the app holds it in memory. The file-level fields (`format`,
 * `schemaVersion`, `savedWithAppVersion`) are added and checked by serialization.ts.
 */
export interface Project {
  id: string;
  name: string;
  /** ISO 8601 timestamps. */
  createdAt: string;
  modifiedAt: string;
  persons: Person[];
  partnerships: Partnership[];
  parentChild: ParentChildLink[];
  images: ImageRef[];
  view?: ProjectView;
}

/**
 * Input and output of the tree layout (ADR-0006). The layout turns a project into positions and line geometry;
 * the UI only draws what it gets. All coordinates are in pixels, x to the right, y downwards, starting at 0.
 */
import type { ParentChildKind, PartnershipEndReason, PersonId } from '../model/types';

export interface LayoutSizes {
  cardWidth: number;
  cardHeight: number;
  /** Width and height of the small "?" node of an unknown parent. */
  unknownSize: number;
  /** Distance between the centres of two neighbouring rows. */
  rowHeight: number;
  /** Space between partners and between siblings. */
  gap: number;
  /** Space between divorced or separated partners, room for the "//" mark. */
  endedGap: number;
  /** Space between neighbours that are neither partners nor siblings. */
  familyGap: number;
  /** Space between parts of the tree that have no relation to each other. */
  partGap: number;
}

/** Card sizes of the mock-up (`mockups/shared/style.css`). */
export const DEFAULT_SIZES: LayoutSizes = {
  cardWidth: 150,
  cardHeight: 182,
  unknownSize: 40,
  rowHeight: 250,
  gap: 42,
  endedGap: 70,
  familyGap: 84,
  partGap: 168,
};

export interface Point {
  x: number;
  y: number;
}

/** A person's card, positioned by its centre. */
export interface CardBox {
  id: PersonId;
  x: number;
  y: number;
  width: number;
  height: number;
  /** The small "?" node of an unknown parent. */
  placeholder: boolean;
}

/**
 * The line between two partners: straight between neighbours, arching over the cards in between when a person
 * with several partners stands between them, diagonal for partners in different rows. The UI draws a "//" at
 * `middle` when `ended` is set.
 */
export interface CoupleLine {
  partnershipId: string;
  points: Point[];
  middle: Point;
  ended?: PartnershipEndReason;
}

/**
 * The line from one set of parents to their children. Every stem runs from a parent (or from the middle of the
 * couple line) to the hub; every drop runs from the hub to one child, so the UI can highlight a single child's line.
 */
export interface ChildLine {
  parentIds: PersonId[];
  /** Set for adoptive, step and foster links: drawn dashed. Absent means biological. */
  kind?: Exclude<ParentChildKind, 'biological'>;
  stems: Point[][];
  drops: { childId: PersonId; points: Point[] }[];
}

export interface Layout {
  /** In the order of `project.persons`. */
  cards: CardBox[];
  coupleLines: CoupleLine[];
  childLines: ChildLine[];
  /** Size of the whole drawing, for "Alles anzeigen". */
  width: number;
  height: number;
}

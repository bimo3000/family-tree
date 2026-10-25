/**
 * Pure helpers for drawing the tree and moving the view (TREE-02). No DOM, so they are unit-tested.
 * The view is a CSS transform of the drawing: screen = drawing * k + (x, y).
 */
import type { CardBox, CoupleLine, Layout, Point } from '../../core/layout';
import type { PersonId, Project } from '../../core/model/types';

export interface View {
  x: number;
  y: number;
  k: number;
}

export interface Size {
  width: number;
  height: number;
}

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2.5;
/** "Alles anzeigen" never zooms in further than this, so a small tree doesn't look huge. */
const FIT_MAX_ZOOM = 1.1;
/** Free space around the tree after "Alles anzeigen" (the zoom buttons sit bottom right). */
const FIT_MARGIN = { x: 40, y: 70 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Half the width of the gap where another line crosses (`breaks` of the layout). */
const BREAK = 5;

/** An SVG path through the points, with a small gap at every break that lies inside one of its horizontal pieces. */
export function pathD(points: Point[], breaks: Point[] = []): string {
  return points
    .map((p, i) => {
      const prev = points[i - 1];
      if (!prev) return `M${p.x} ${p.y}`;
      const [lo, hi] = [Math.min(prev.x, p.x), Math.max(prev.x, p.x)];
      const dir = Math.sign(p.x - prev.x);
      const gaps =
        prev.y === p.y
          ? breaks
              .filter((b) => b.y === p.y && b.x > lo && b.x < hi)
              .sort((a, b) => (a.x - b.x) * dir)
              .map((b) => {
                const at = (x: number) => Math.min(hi, Math.max(lo, x));
                return `L${at(b.x - dir * BREAK)} ${p.y} M${at(b.x + dir * BREAK)} ${p.y} `;
              })
          : [];
      return `${gaps.join('')}L${p.x} ${p.y}`;
    })
    .join(' ');
}

/** The "//" of a divorced or separated couple, centred on the couple line. */
export function endMarkD({ x, y }: Point): string {
  return `M${x - 7} ${y + 7} L${x - 1} ${y - 7} M${x + 1} ${y + 7} L${x + 7} ${y - 7}`;
}

/** The whole tree centred in the viewport. */
export function fitView(drawing: Size, viewport: Size): View {
  const k = clamp(
    Math.min(
      (viewport.width - 2 * FIT_MARGIN.x) / Math.max(drawing.width, 1),
      (viewport.height - 2 * FIT_MARGIN.y) / Math.max(drawing.height, 1),
      FIT_MAX_ZOOM,
    ),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  return {
    k,
    x: viewport.width / 2 - (drawing.width / 2) * k,
    y: viewport.height / 2 - (drawing.height / 2) * k,
  };
}

/**
 * The printable part of an A4 landscape page (297 × 210 mm, 10 mm margins) in CSS pixels (96 per inch),
 * less a line for the project name on top (UI-03).
 */
export const PRINT_AREA: Size = { width: 1046, height: 660 };

/** The whole tree on one printed page: scaled down to fit (never up), centred across the page, at its top. */
export function printView(drawing: Size, page: Size = PRINT_AREA): View {
  const k = Math.min(
    page.width / Math.max(drawing.width, 1),
    page.height / Math.max(drawing.height, 1),
    1,
  );
  return { k, x: (page.width - drawing.width * k) / 2, y: 0 };
}

/** Zooms by `factor`, keeping the drawing point under the screen point (cx, cy) in place. */
export function zoomAt(view: View, factor: number, cx: number, cy: number): View {
  const k = clamp(view.k * factor, MIN_ZOOM, MAX_ZOOM);
  return {
    k,
    x: cx - (cx - view.x) * (k / view.k),
    y: cy - (cy - view.y) * (k / view.k),
  };
}

/** Moves the view so the drawing point sits in the middle of the viewport. */
export function centerOn(view: View, point: Point, viewport: Size): View {
  return {
    k: view.k,
    x: viewport.width / 2 - point.x * view.k,
    y: viewport.height / 2 - point.y * view.k,
  };
}

/** Whether the drawing point is on screen, at least `margin` pixels from the edges. */
export function isOnScreen(view: View, point: Point, viewport: Size, margin = 60): boolean {
  const sx = view.x + point.x * view.k;
  const sy = view.y + point.y * view.k;
  return (
    sx >= margin && sy >= margin && sx <= viewport.width - margin && sy <= viewport.height - margin
  );
}

export interface Highlight {
  /** IDs of highlighted couple lines. */
  couples: Set<string>;
  /**
   * Couple lines lit only from one partner to the middle, because the line to their child starts there:
   * partnership ID → that partner.
   */
  halves: Map<string, PersonId>;
  /** Per entry of `layout.childLines`: which stems are on, and which children's drops are on. */
  childLines: { stems: boolean[]; drops: Set<PersonId> }[];
}

/**
 * Which lines belong to the selected person's line (`focus`, from core `focusSet`): a couple line when both
 * partners are in focus, a child's drop when the child and one of the line's parents are, the stems of the
 * parents in focus when any drop is. So only the focused child of a family is highlighted, not all siblings.
 * When only one partner is in focus (a descendant of the selected person), their half of the couple line is
 * lit up to where the lit line to their child starts, so the highlighted line runs through without a break.
 */
export function highlight(project: Project, layout: Layout, focus: Set<PersonId>): Highlight {
  const partners = new Map(project.partnerships.map((r) => [r.id, r.partners]));
  const couples = new Set(
    layout.coupleLines
      .filter((l) => partners.get(l.partnershipId)?.every((id) => focus.has(id)))
      .map((l) => l.partnershipId),
  );
  const childLines = layout.childLines.map((line) => {
    const parentOn = line.parentIds.some((id) => focus.has(id));
    const drops = new Set(
      parentOn ? line.drops.filter((d) => focus.has(d.childId)).map((d) => d.childId) : [],
    );
    // One stem from the middle of the couple line, or one from each parent (in the order of `parentIds`).
    const stems = line.stems.map(
      (_, s) => drops.size > 0 && (line.stems.length === 1 || focus.has(line.parentIds[s] ?? '')),
    );
    return { stems, drops };
  });
  const halves = new Map<string, PersonId>();
  for (const l of layout.coupleLines) {
    const pair: PersonId[] = partners.get(l.partnershipId) ?? [];
    const lit = pair.filter((id) => focus.has(id));
    const fromMiddle = layout.childLines.some(
      (line, i) =>
        line.stems.length === 1 &&
        line.parentIds.length === 2 &&
        line.parentIds.every((id) => pair.includes(id)) &&
        childLines[i]?.stems[0],
    );
    if (lit.length === 1 && lit[0] && fromMiddle) halves.set(l.partnershipId, lit[0]);
  }
  return { couples, halves, childLines };
}

/** The part of a couple line from the partner's card to its middle (for `Highlight.halves`). */
export function halfCouple(line: CoupleLine, partner: CardBox): Point[] {
  const { middle } = line;
  return partner.x < middle.x
    ? [...line.points.filter((p) => p.x < middle.x), middle]
    : [middle, ...line.points.filter((p) => p.x > middle.x)];
}

/**
 * Pure helpers for drawing the tree and moving the view (TREE-02). No DOM, so they are unit-tested.
 * The view is a CSS transform of the drawing: screen = drawing * k + (x, y).
 */
import type { Layout, Point } from '../../core/layout';
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

export function pathD(points: Point[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
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
  /** Per entry of `layout.childLines`: are the stems on, and which children's drops are on. */
  childLines: { stems: boolean; drops: Set<PersonId> }[];
}

/**
 * Which lines belong to the selected person's line (`focus`, from core `focusSet`): a couple line when both
 * partners are in focus, a child's drop when the child and one of the line's parents are, the stems when
 * any drop is. So only the focused child of a family is highlighted, not all siblings.
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
    return { stems: drops.size > 0, drops };
  });
  return { couples, childLines };
}

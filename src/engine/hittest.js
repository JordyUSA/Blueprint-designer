/**
 * Hit-testing and selection geometry.
 *
 * Tolerances are expressed in *screen pixels* and converted to world units via
 * the current zoom, so a target stays equally clickable at every zoom level.
 * Handles are the exception: they are tested purely in screen space, because a
 * world-space handle would shrink to nothing when zoomed out.
 */

import {
  boundsIntersect,
  distToSegment,
  pointInRotatedRect,
  unionBounds,
  dist,
} from './geometry.js';
import { screenToWorldDist, worldToScreen } from './camera.js';
import { entityBounds, openingFrame } from '../state/document.js';

/** Click tolerance in screen pixels. */
export const PICK_TOLERANCE_PX = 6;
/** Half-size of a resize handle's hit zone, in screen pixels. */
export const HANDLE_HIT_PX = 8;
/** Drawn half-size of a resize handle, in screen pixels. */
export const HANDLE_DRAW_PX = 4.5;
/** Distance from the selection box to the rotation anchor, in screen pixels. */
export const ROTATE_OFFSET_PX = 26;
/**
 * A room only accepts clicks within this band of its border (in feet), so
 * furniture sitting on top of a room is always reachable.
 */
export const ROOM_EDGE_BAND = 0.6;

/**
 * Top-down hit test. Z-order is furniture > openings > walls > rooms, matching
 * the paint order in the renderer.
 * @returns {object|null} the hit entity
 */
export function hitTest(doc, worldPt, view) {
  const tol = screenToWorldDist(view, PICK_TOLERANCE_PX);

  for (let i = doc.furniture.length - 1; i >= 0; i -= 1) {
    const f = doc.furniture[i];
    if (pointInRotatedRect(worldPt, f.x, f.y, f.w, f.h, f.rot, tol)) return f;
  }

  for (let i = doc.openings.length - 1; i >= 0; i -= 1) {
    const o = doc.openings[i];
    const frame = openingFrame(doc, o);
    if (!frame) continue;
    if (
      pointInRotatedRect(
        worldPt,
        frame.center.x,
        frame.center.y,
        frame.width,
        Math.max(frame.thickness, tol * 2),
        frame.angle,
        tol,
      )
    ) {
      return o;
    }
  }

  for (let i = doc.walls.length - 1; i >= 0; i -= 1) {
    const w = doc.walls[i];
    if (distToSegment(worldPt, w.a, w.b) <= w.thickness / 2 + tol) return w;
  }

  for (let i = doc.rooms.length - 1; i >= 0; i -= 1) {
    const r = doc.rooms[i];
    const inside =
      worldPt.x >= r.x - tol &&
      worldPt.x <= r.x + r.w + tol &&
      worldPt.y >= r.y - tol &&
      worldPt.y <= r.y + r.h + tol;
    if (!inside) continue;
    // Interior clicks fall through unless they land near an edge or the label.
    const edgeDist = Math.min(
      worldPt.x - r.x,
      r.x + r.w - worldPt.x,
      worldPt.y - r.y,
      r.y + r.h - worldPt.y,
    );
    const nearLabel =
      dist(worldPt, { x: r.x + r.w / 2, y: r.y + r.h / 2 }) <
      screenToWorldDist(view, 34);
    if (edgeDist <= ROOM_EDGE_BAND + tol || nearLabel) return r;
  }

  return null;
}

/** World-space bounds of a set of ids, or null when the selection is empty. */
export function selectionBounds(doc, ids) {
  let bounds = null;
  const idSet = ids instanceof Set ? ids : new Set(ids);
  if (!idSet.size) return null;
  for (const key of ['rooms', 'walls', 'openings', 'furniture']) {
    for (const e of doc[key]) {
      if (idSet.has(e.id)) bounds = unionBounds(bounds, entityBounds(e, doc));
    }
  }
  return bounds;
}

/**
 * Screen positions of the eight resize handles plus the rotation anchor for a
 * world-space bounds rectangle.
 */
export function handlePositions(bounds, view) {
  const tl = worldToScreen(view, { x: bounds.minX, y: bounds.minY });
  const br = worldToScreen(view, { x: bounds.maxX, y: bounds.maxY });
  const midX = (tl.x + br.x) / 2;
  const midY = (tl.y + br.y) / 2;
  return {
    nw: { x: tl.x, y: tl.y },
    n: { x: midX, y: tl.y },
    ne: { x: br.x, y: tl.y },
    e: { x: br.x, y: midY },
    se: { x: br.x, y: br.y },
    s: { x: midX, y: br.y },
    sw: { x: tl.x, y: br.y },
    w: { x: tl.x, y: midY },
    rotate: { x: midX, y: tl.y - ROTATE_OFFSET_PX },
  };
}

/**
 * Which handle (if any) is under a screen point.
 * @returns {'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'rotate'|null}
 */
export function hitHandle(bounds, view, screenPt) {
  if (!bounds) return null;
  const handles = handlePositions(bounds, view);
  // Rotation anchor wins ties — it sits outside the box, so it is unambiguous.
  const order = ['rotate', 'nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
  for (const key of order) {
    const h = handles[key];
    if (
      Math.abs(screenPt.x - h.x) <= HANDLE_HIT_PX &&
      Math.abs(screenPt.y - h.y) <= HANDLE_HIT_PX
    ) {
      return key;
    }
  }
  return null;
}

/** CSS cursor for each handle, rotated crudely to match the drag direction. */
export const HANDLE_CURSORS = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  rotate: 'grab',
};

/**
 * Every entity id whose bounds intersect a world-space marquee rectangle.
 * Openings are only picked up when their host wall is also selected, since an
 * opening cannot exist independently.
 */
export function marqueeSelect(doc, rect) {
  const target = {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.w,
    maxY: rect.y + rect.h,
  };
  const ids = [];
  for (const key of ['rooms', 'walls', 'furniture']) {
    for (const e of doc[key]) {
      if (boundsIntersect(entityBounds(e, doc), target)) ids.push(e.id);
    }
  }
  const wallIds = new Set(doc.walls.filter((w) => ids.includes(w.id)).map((w) => w.id));
  for (const o of doc.openings) {
    if (wallIds.has(o.wallId)) ids.push(o.id);
  }
  return ids;
}

/**
 * The screen <-> world transform.
 *
 * A view is `{ panX, panY, zoom }` where pan is in CSS pixels and zoom is a
 * unitless scalar. The mapping is:
 *
 *   screenX = worldX * PPF * zoom + panX
 *   worldX  = (screenX - panX) / (PPF * zoom)
 *
 * Everything that converts between the two lives here so there is exactly one
 * definition of the transform in the codebase.
 */

import { PPF } from './units.js';
import { clamp } from './geometry.js';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;

export const createView = (overrides = {}) => ({
  panX: 0,
  panY: 0,
  zoom: 1,
  ...overrides,
});

/** Pixels per world foot at the view's current zoom. */
export const pixelsPerFoot = (view) => PPF * view.zoom;

export function worldToScreen(view, p) {
  const k = PPF * view.zoom;
  return { x: p.x * k + view.panX, y: p.y * k + view.panY };
}

export function screenToWorld(view, p) {
  const k = PPF * view.zoom;
  return { x: (p.x - view.panX) / k, y: (p.y - view.panY) / k };
}

/** Convert a screen-space distance (px) into world units (feet). */
export const screenToWorldDist = (view, px) => px / (PPF * view.zoom);

/**
 * Change zoom while keeping the world point currently under `screenPt` pinned
 * to that same screen position. This is what makes wheel-zoom feel correct.
 */
export function zoomAt(view, screenPt, nextZoom) {
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  const world = screenToWorld(view, screenPt);
  const k = PPF * zoom;
  return {
    zoom,
    panX: screenPt.x - world.x * k,
    panY: screenPt.y - world.y * k,
  };
}

/** Zoom about the center of the viewport (used by the slider and +/- buttons). */
export function zoomAtCenter(view, size, nextZoom) {
  return zoomAt(view, { x: size.width / 2, y: size.height / 2 }, nextZoom);
}

/** Multiplicative wheel step, so zooming feels even across the range. */
export function zoomByWheel(view, screenPt, deltaY) {
  const factor = Math.pow(1.0015, -deltaY);
  return zoomAt(view, screenPt, view.zoom * factor);
}

/**
 * Build a view that fits `bounds` (world units) inside `size` (CSS px) with
 * `padding` pixels of margin. Falls back to a centered default when the
 * document is empty.
 */
export function fitToBounds(bounds, size, padding = 64) {
  if (!bounds || size.width <= 0 || size.height <= 0) {
    return createView({
      panX: size.width / 2,
      panY: size.height / 2,
      zoom: 1,
    });
  }
  const w = Math.max(bounds.maxX - bounds.minX, 1e-3);
  const h = Math.max(bounds.maxY - bounds.minY, 1e-3);
  const availW = Math.max(size.width - padding * 2, 32);
  const availH = Math.max(size.height - padding * 2, 32);
  const zoom = clamp(
    Math.min(availW / (w * PPF), availH / (h * PPF)),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  const k = PPF * zoom;
  return {
    zoom,
    panX: size.width / 2 - ((bounds.minX + bounds.maxX) / 2) * k,
    panY: size.height / 2 - ((bounds.minY + bounds.maxY) / 2) * k,
  };
}


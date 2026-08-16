/**
 * Pure 2D geometry helpers. Everything here works in world units (feet) unless
 * a function name says otherwise, and nothing in this module touches React,
 * the DOM, or the canvas.
 */

export const EPS = 1e-9;

export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a, k) => ({ x: a.x * k, y: a.y * k });
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
export const lerp = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

export function normalize(a) {
  const l = Math.hypot(a.x, a.y);
  return l < EPS ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
}

export const deg2rad = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Normalize any angle in degrees into [0, 360). */
export function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

/** Parametric position of the closest point on segment ab to p, clamped 0..1. */
export function projectOnSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  if (l2 < EPS) return 0;
  return clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / l2, 0, 1);
}

export function nearestPointOnSegment(p, a, b) {
  const t = projectOnSegment(p, a, b);
  return { point: lerp(a, b, t), t };
}

export function distToSegment(p, a, b) {
  const { point } = nearestPointOnSegment(p, a, b);
  return dist(p, point);
}

/** Corners of a rotated rectangle, clockwise from top-left in local space. */
export function rotatedRectCorners(cx, cy, w, h, rotDeg) {
  const hw = w / 2;
  const hh = h / 2;
  const r = deg2rad(rotDeg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  const local = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  return local.map((p) => ({
    x: cx + p.x * c - p.y * s,
    y: cy + p.x * s + p.y * c,
  }));
}

/**
 * Point-in-rotated-rect. Rotates the probe point back into the rect's local
 * frame rather than rotating the rect, which is four times cheaper.
 * `pad` widens the rect on all sides (used for click tolerance).
 */
export function pointInRotatedRect(p, cx, cy, w, h, rotDeg, pad = 0) {
  const r = deg2rad(-rotDeg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  const dx = p.x - cx;
  const dy = p.y - cy;
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= w / 2 + pad && Math.abs(ly) <= h / 2 + pad;
}

/** Axis-aligned bounds of an array of points. */
export function boundsOfPoints(points) {
  if (!points.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export function unionBounds(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function boundsFromRect(x, y, w, h) {
  return { minX: x, minY: y, maxX: x + w, maxY: y + h };
}

export function boundsIntersect(a, b) {
  if (!a || !b) return false;
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

export function boundsCenter(b) {
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

/** Normalized rect from two arbitrary corner points. */
export function rectFromPoints(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

export function snapValue(v, step) {
  if (!step || step <= 0) return v;
  return Math.round(v / step) * step;
}

export function snapPoint(p, step) {
  return { x: snapValue(p.x, step), y: snapValue(p.y, step) };
}

/**
 * Constrain `b` so the segment a->b sits on a multiple of `stepDeg` degrees,
 * preserving the segment length. Used for shift-constrained wall drawing.
 */
export function snapSegmentAngle(a, b, stepDeg = 45) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length < EPS) return { ...b };
  const angle = rad2deg(Math.atan2(dy, dx));
  const snapped = deg2rad(Math.round(angle / stepDeg) * stepDeg);
  return {
    x: a.x + Math.cos(snapped) * length,
    y: a.y + Math.sin(snapped) * length,
  };
}

/** Segment angle in degrees, measured from +X, y-down. */
export function segmentAngle(a, b) {
  return rad2deg(Math.atan2(b.y - a.y, b.x - a.x));
}

/**
 * Andrew's monotone chain convex hull. Returns the hull in counter-clockwise
 * order (screen coords). Used to build clean wall corner joins from the
 * corner points of every wall quad meeting at a node.
 */
export function convexHull(points) {
  if (points.length < 3) return points.slice();
  const pts = points
    .slice()
    .sort((p, q) => (p.x === q.x ? p.y - q.y : p.x - q.x));

  const build = (src) => {
    const out = [];
    for (const p of src) {
      while (out.length >= 2) {
        const o = out[out.length - 2];
        const a = out[out.length - 1];
        if (cross(sub(a, o), sub(p, o)) <= 0) out.pop();
        else break;
      }
      out.push(p);
    }
    out.pop();
    return out;
  };

  return build(pts).concat(build(pts.slice().reverse()));
}

/**
 * Signed polygon area. The sign encodes winding direction, which callers use
 * to normalize polygons before unioning them with a nonzero-rule fill —
 * opposite windings would punch holes instead of merging.
 */
export function polygonSignedArea(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += poly[j].x * poly[i].y - poly[i].x * poly[j].y;
  }
  return a / 2;
}

/** Smallest absolute difference between two angles, in degrees. */
export function angleDelta(a, b) {
  let d = normalizeAngle(a - b);
  if (d > 180) d -= 360;
  return d;
}

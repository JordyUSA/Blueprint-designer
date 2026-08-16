/**
 * Wall solid geometry.
 *
 * Walls are stored as centerline segments with a thickness. Turning that into
 * drafted line-work needs three things:
 *
 *   1. a node graph, so walls sharing an endpoint know about each other;
 *   2. opening subtraction, so doors/windows are genuine holes in the wall
 *      rather than sprites painted over it;
 *   3. join patches at each node, so L-corners and T-junctions read as solid.
 *
 * The classic double-line wall is then produced by the renderer *without* any
 * polygon offsetting: it fills the union of these polygons once in the outline
 * color while also stroking it (which grows the union outward by half the
 * stroke width), then fills the same union again in the body color. The second
 * fill covers every internal seam, so the dark edge survives only on the true
 * outer boundary — including across corner joins and around openings.
 *
 * Everything here is pure: it takes a document and returns plain point data.
 */

import {
  EPS,
  angleDelta,
  convexHull,
  dist,
  normalize,
  polygonSignedArea,
  segmentAngle,
  sub,
} from './geometry.js';
import { openingSpan, openingsForWall, wallLength } from '../state/document.js';

/** Endpoints closer than this (in feet) are treated as the same node. */
export const NODE_TOLERANCE = 0.06;

/** Drafted wall outline weight, in feet. */
export const WALL_OUTLINE = 0.06;

const keyFor = (p) =>
  `${Math.round(p.x / NODE_TOLERANCE)}:${Math.round(p.y / NODE_TOLERANCE)}`;

/**
 * Build the wall node graph.
 * @returns {Map<string, { point: {x,y}, walls: Array<{ wall, end: 'a'|'b' }> }>}
 */
export function buildNodeGraph(walls) {
  const nodes = new Map();
  const attach = (wall, end) => {
    const p = wall[end];
    const key = keyFor(p);
    let node = nodes.get(key);
    if (!node) {
      node = { point: { x: p.x, y: p.y }, walls: [] };
      nodes.set(key, node);
    }
    node.walls.push({ wall, end });
  };
  for (const wall of walls) {
    if (wallLength(wall) < EPS) continue;
    attach(wall, 'a');
    attach(wall, 'b');
  }
  return nodes;
}

/**
 * Snap a point to the nearest existing wall endpoint within `radius`.
 * This is what makes chained wall drawing produce watertight corners.
 * @returns {{x:number,y:number}|null}
 */
export function snapToWallEndpoint(walls, point, radius, excludeWallId = null) {
  let best = null;
  let bestD = radius;
  for (const wall of walls) {
    if (wall.id === excludeWallId) continue;
    for (const end of ['a', 'b']) {
      const d = dist(point, wall[end]);
      if (d < bestD) {
        bestD = d;
        best = { x: wall[end].x, y: wall[end].y };
      }
    }
  }
  return best;
}

/**
 * Find the wall nearest to `point`, within `maxDist`, and the parametric
 * position along it. Used by the door and window tools.
 * @returns {{ wall, t:number, point:{x,y}, distance:number }|null}
 */
export function nearestWall(walls, point, maxDist) {
  let best = null;
  for (const wall of walls) {
    const abx = wall.b.x - wall.a.x;
    const aby = wall.b.y - wall.a.y;
    const l2 = abx * abx + aby * aby;
    if (l2 < EPS) continue;
    let t = ((point.x - wall.a.x) * abx + (point.y - wall.a.y) * aby) / l2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = wall.a.x + abx * t;
    const py = wall.a.y + aby * t;
    const d = Math.hypot(point.x - px, point.y - py);
    if (d <= maxDist && (!best || d < best.distance)) {
      best = { wall, t, point: { x: px, y: py }, distance: d };
    }
  }
  return best;
}

/**
 * The solid intervals of a wall once its openings are subtracted, expressed
 * as distances along the wall in feet.
 * @returns {Array<[number, number]>}
 */
export function solidIntervals(doc, wall) {
  const length = wallLength(wall);
  if (length < EPS) return [];

  const holes = [];
  for (const opening of openingsForWall(doc, wall.id)) {
    const span = openingSpan(wall, opening);
    if (span) holes.push([span.start, span.end]);
  }
  if (!holes.length) return [[0, length]];

  // Merge overlapping holes so adjacent openings do not leave zero-width slivers.
  holes.sort((p, q) => p[0] - q[0]);
  const merged = [holes[0].slice()];
  for (let i = 1; i < holes.length; i += 1) {
    const last = merged[merged.length - 1];
    if (holes[i][0] <= last[1] + EPS) last[1] = Math.max(last[1], holes[i][1]);
    else merged.push(holes[i].slice());
  }

  const solids = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start - cursor > 1e-4) solids.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (length - cursor > 1e-4) solids.push([cursor, length]);
  return solids;
}

/** Ensure a polygon winds consistently, so nonzero fill unions rather than cancels. */
function withPositiveWinding(poly) {
  return polygonSignedArea(poly) < 0 ? poly.slice().reverse() : poly;
}

/**
 * Intersection of two infinite lines given as point + direction.
 * @returns {{x:number,y:number}|null} null when the lines are parallel.
 */
function lineIntersection(p1, d1, p2, d2) {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / denom;
  return { x: p1.x + d1.x * t, y: p1.y + d1.y * t };
}

/** Quad (4 corners) for a sub-segment of a wall between two distances. */
function quadFor(wall, d0, d1) {
  const dir = normalize(sub(wall.b, wall.a));
  const nx = -dir.y;
  const ny = dir.x;
  const half = wall.thickness / 2;
  const p0 = { x: wall.a.x + dir.x * d0, y: wall.a.y + dir.y * d0 };
  const p1 = { x: wall.a.x + dir.x * d1, y: wall.a.y + dir.y * d1 };
  return withPositiveWinding([
    { x: p0.x + nx * half, y: p0.y + ny * half },
    { x: p1.x + nx * half, y: p1.y + ny * half },
    { x: p1.x - nx * half, y: p1.y - ny * half },
    { x: p0.x - nx * half, y: p0.y - ny * half },
  ]);
}

/** Full-length quad for a wall, ignoring openings. */
export function wallQuad(wall) {
  return quadFor(wall, 0, wallLength(wall));
}

/**
 * Compute every polygon needed to paint the walls:
 *   `solids` — wall bodies with openings subtracted
 *   `joins`  — corner patches filling the gap where walls meet
 *
 * A join patch is the convex hull of the wall-quad corners incident to a node.
 * That one rule handles L-corners, T-junctions, and crossings, and — unlike a
 * round disc — keeps building corners properly square. Near-collinear pairs
 * are skipped: their hull would be a degenerate sliver and the abutting quads
 * already cover the seam.
 */
export function buildWallPolygons(doc) {
  const solids = [];
  for (const wall of doc.walls) {
    const length = wallLength(wall);
    if (length < EPS) continue;
    for (const [d0, d1] of solidIntervals(doc, wall)) {
      solids.push({ wallId: wall.id, poly: quadFor(wall, d0, d1) });
    }
  }

  const joins = [];
  const nodes = buildNodeGraph(doc.walls);
  for (const node of nodes.values()) {
    if (node.walls.length < 2) continue;

    const outgoing = node.walls.map(({ wall, end }) => {
      const far = end === 'a' ? wall.b : wall.a;
      return { wall, end, angle: segmentAngle(node.point, far) };
    });

    // Two nearly collinear walls need no patch — their quads already abut.
    if (outgoing.length === 2) {
      const delta = Math.abs(angleDelta(outgoing[0].angle, outgoing[1].angle));
      if (Math.abs(delta - 180) < 5 || delta < 5) continue;
    }

    // Collect, for each incident wall, the two face points *at the node* and
    // the face lines radiating away from it.
    //
    // The patch must stay inside the node's own neighbourhood. Sampling a stub
    // along each arm would make the hull span both arms, and since the union of
    // two walls at a corner has a reflex vertex on the inside, the hull would
    // cut a chamfer straight across that inner corner and bulge into the room.
    const pts = [];
    const edges = [];
    for (const { wall, end } of outgoing) {
      const length = wallLength(wall);
      if (length < EPS) continue;

      // Skip a wall whose solid does not actually reach this node — its
      // opening starts here, and a patch would plug the hole.
      const intervals = solidIntervals(doc, wall);
      if (!intervals.length) continue;
      if (end === 'a' && intervals[0][0] > 1e-4) continue;
      if (end === 'b' && length - intervals[intervals.length - 1][1] > 1e-4) continue;

      const far = end === 'a' ? wall.b : wall.a;
      const dir = normalize(sub(far, node.point));
      const normal = { x: -dir.y, y: dir.x };
      const half = wall.thickness / 2;

      pts.push(
        { x: node.point.x + normal.x * half, y: node.point.y + normal.y * half },
        { x: node.point.x - normal.x * half, y: node.point.y - normal.y * half },
      );
      edges.push({ dir, normal, half });
    }
    if (edges.length < 2) continue;

    // The face points alone hull to a chamfered outer corner, because the true
    // square corner is where two wall faces cross and belongs to neither wall.
    // Adding the face-line intersections makes the hull mitre properly.
    // Intersections beyond the mitre limit (very acute walls) are dropped and
    // the join falls back to a chamfer, which is the correct degenerate case.
    const miterLimit = Math.max(...edges.map((e) => e.half)) * 6;
    for (let i = 0; i < edges.length; i += 1) {
      for (let j = i + 1; j < edges.length; j += 1) {
        for (const si of [1, -1]) {
          for (const sj of [1, -1]) {
            const p = lineIntersection(
              {
                x: node.point.x + edges[i].normal.x * edges[i].half * si,
                y: node.point.y + edges[i].normal.y * edges[i].half * si,
              },
              edges[i].dir,
              {
                x: node.point.x + edges[j].normal.x * edges[j].half * sj,
                y: node.point.y + edges[j].normal.y * edges[j].half * sj,
              },
              edges[j].dir,
            );
            if (p && dist(p, node.point) <= miterLimit) pts.push(p);
          }
        }
      }
    }

    const hull = convexHull(pts);
    if (hull.length >= 3) joins.push({ poly: withPositiveWinding(hull) });
  }

  return { solids, joins };
}

/**
 * Geometry for rendering a single opening: the reveal box in the wall plus,
 * for doors, the leaf line and swing arc.
 * @returns {object|null}
 */
export function buildOpeningGeometry(doc, opening) {
  const wall = doc.walls.find((w) => w.id === opening.wallId);
  if (!wall) return null;
  const span = openingSpan(wall, opening);
  if (!span) return null;

  const dir = normalize(sub(wall.b, wall.a));
  const normal = { x: -dir.y, y: dir.x };
  const half = wall.thickness / 2;

  const at = (d, off) => ({
    x: wall.a.x + dir.x * d + normal.x * off,
    y: wall.a.y + dir.y * d + normal.y * off,
  });

  const { start, end, center, width } = span;

  const geom = {
    kind: opening.kind,
    wall,
    dir,
    normal,
    thickness: wall.thickness,
    width,
    center: at(center, 0),
    angle: segmentAngle(wall.a, wall.b),
    // The two long reveal edges of the opening.
    revealPos: [at(start, half), at(end, half)],
    revealNeg: [at(start, -half), at(end, -half)],
  };

  if (opening.kind === 'door' && opening.style !== 'cased') {
    // The hinge sits at one end of the opening; the leaf swings to one side.
    const hingeDist = opening.hinge === 'a' ? start : end;
    const alongSign = opening.hinge === 'a' ? 1 : -1;
    const sideSign = opening.swing === 'in' ? 1 : -1;
    const hinge = at(hingeDist, 0);
    // Leaf drawn fully open, perpendicular to the wall.
    const leafEnd = {
      x: hinge.x + normal.x * sideSign * width,
      y: hinge.y + normal.y * sideSign * width,
    };
    // Arc sweeps from the closed position (along the wall) to the open leaf.
    const closedPoint = at(hingeDist + alongSign * width, 0);

    geom.door = {
      hinge,
      leafEnd,
      closedPoint,
      radius: width,
      startAngle: Math.atan2(closedPoint.y - hinge.y, closedPoint.x - hinge.x),
      endAngle: Math.atan2(leafEnd.y - hinge.y, leafEnd.x - hinge.x),
      // Canvas measures increasing angles clockwise on screen (y is down).
      // Sweeping the *short* 90 degree way means going counterclockwise
      // exactly when the along-wall and across-wall signs disagree.
      counterclockwise: alongSign * sideSign < 0,
    };
  } else if (opening.kind === 'door') {
    // Cased opening: a framed threshold with no leaf and no swing arc.
    geom.cased = true;
  } else {
    // Window glazing: three lines across the reveal.
    geom.glazing = [
      [at(start, half * 0.5), at(end, half * 0.5)],
      [at(start, 0), at(end, 0)],
      [at(start, -half * 0.5), at(end, -half * 0.5)],
    ];
  }

  return geom;
}

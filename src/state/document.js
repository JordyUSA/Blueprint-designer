/**
 * The blueprint document: schema, entity factories, and JSON (de)serialization.
 *
 * Coordinates are in FEET. Furniture and room rotation is in degrees.
 * Openings (doors/windows) are parameterised onto their host wall by
 * `wallId` + `t` (0..1 along the wall) so that moving or re-lengthing a wall
 * carries its doors and windows along with it.
 */

import {
  boundsFromRect,
  boundsOfPoints,
  rotatedRectCorners,
  unionBounds,
  clamp,
  dist,
} from '../engine/geometry.js';
import { getFurniture } from '../data/furniture.js';

export const SCHEMA_VERSION = 'bp-1';

export const ENTITY_WALL = 'wall';
export const ENTITY_OPENING = 'opening';
export const ENTITY_ROOM = 'room';
export const ENTITY_FURNITURE = 'furniture';

export const DEFAULT_WALL_THICKNESS = 0.5; // 6"
export const DEFAULT_DOOR_WIDTH = 3;
export const DEFAULT_WINDOW_WIDTH = 3.5;

let idCounter = 0;
/** Monotonic, collision-proof-enough id. Prefixed so ids are readable in JSON. */
export function makeId(prefix = 'e') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.floor(
    Math.random() * 1296,
  )
    .toString(36)
    .padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ *
 * Factories
 * ------------------------------------------------------------------ */

export function makeWall(a, b, overrides = {}) {
  return {
    id: makeId('w'),
    entity: ENTITY_WALL,
    a: { x: a.x, y: a.y },
    b: { x: b.x, y: b.y },
    thickness: DEFAULT_WALL_THICKNESS,
    ...overrides,
  };
}

export function makeOpening(kind, wallId, t, overrides = {}) {
  return {
    id: makeId(kind === 'window' ? 'win' : 'dr'),
    entity: ENTITY_OPENING,
    kind, // 'door' | 'window'
    wallId,
    t: clamp(t, 0, 1),
    width: kind === 'window' ? DEFAULT_WINDOW_WIDTH : DEFAULT_DOOR_WIDTH,
    hinge: 'a', // which end of the opening the door is hinged on
    swing: 'in', // which side of the wall the leaf swings toward
    style: 'swing', // 'swing' draws a leaf + arc, 'cased' is an open threshold
    label: '',
    ...overrides,
  };
}

export function makeRoom(x, y, w, h, overrides = {}) {
  return {
    id: makeId('rm'),
    entity: ENTITY_ROOM,
    x,
    y,
    w,
    h,
    label: 'Room',
    preset: 'custom',
    tint: null,
    ...overrides,
  };
}

export function makeFurniture(kind, x, y, overrides = {}) {
  const def = getFurniture(kind);
  return {
    id: makeId('f'),
    entity: ENTITY_FURNITURE,
    kind,
    x,
    y,
    w: def.w,
    h: def.h,
    rot: 0,
    tint: null,
    label: '',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ *
 * Document helpers
 * ------------------------------------------------------------------ */

export function createEmptyDoc(name = 'Untitled Plan') {
  return {
    version: SCHEMA_VERSION,
    name,
    walls: [],
    openings: [],
    rooms: [],
    furniture: [],
  };
}

export const COLLECTIONS = ['walls', 'openings', 'rooms', 'furniture'];

/** Every entity in z-order, bottom first: rooms, walls, openings, furniture. */
export function allEntities(doc) {
  return [...doc.rooms, ...doc.walls, ...doc.openings, ...doc.furniture];
}

export function entityCount(doc) {
  return (
    doc.walls.length +
    doc.openings.length +
    doc.rooms.length +
    doc.furniture.length
  );
}

/** Total floor area in square feet, summed over rooms. */
export function totalArea(doc) {
  return doc.rooms.reduce((sum, r) => sum + Math.abs(r.w * r.h), 0);
}

export const wallLength = (wall) => dist(wall.a, wall.b);

/** Openings belonging to a wall, sorted along the wall. */
export function openingsForWall(doc, wallId) {
  return doc.openings
    .filter((o) => o.wallId === wallId)
    .sort((p, q) => p.t - q.t);
}

/* ------------------------------------------------------------------ *
 * Bounds
 * ------------------------------------------------------------------ */

export function entityBounds(entity, doc) {
  switch (entity.entity) {
    case ENTITY_WALL: {
      const pad = entity.thickness / 2;
      const b = boundsOfPoints([entity.a, entity.b]);
      return {
        minX: b.minX - pad,
        minY: b.minY - pad,
        maxX: b.maxX + pad,
        maxY: b.maxY + pad,
      };
    }
    case ENTITY_ROOM:
      return boundsFromRect(entity.x, entity.y, entity.w, entity.h);
    case ENTITY_FURNITURE:
      return boundsOfPoints(
        rotatedRectCorners(entity.x, entity.y, entity.w, entity.h, entity.rot),
      );
    case ENTITY_OPENING: {
      const frame = openingFrame(doc, entity);
      if (!frame) return null;
      return boundsOfPoints(
        rotatedRectCorners(
          frame.center.x,
          frame.center.y,
          entity.width,
          frame.thickness,
          frame.angle,
        ),
      );
    }
    default:
      return null;
  }
}

export function docBounds(doc) {
  let b = null;
  for (const e of allEntities(doc)) b = unionBounds(b, entityBounds(e, doc));
  return b;
}

/**
 * Where an opening actually sits along its wall, in feet from `wall.a`.
 *
 * The opening is clamped to leave a margin of solid wall at each end — a door
 * jamb cannot land exactly on a building corner, and letting one do so would
 * also let a corner join patch bleed into the opening. This is the single
 * source of truth for opening placement: rendering, hit-testing, and wall
 * subtraction all derive from it, so they can never disagree.
 *
 * @returns {{ start:number, end:number, center:number, width:number, length:number }|null}
 */
export function openingSpan(wall, opening) {
  const length = wallLength(wall);
  if (length < 1e-6) return null;

  // Prefer a full wall-thickness margin, but give it up on short walls
  // rather than refusing to place the opening at all.
  const desiredMargin = wall.thickness;
  const width = Math.min(opening.width, Math.max(length - desiredMargin * 2, length * 0.5));
  const half = width / 2;
  const margin = Math.min(desiredMargin, Math.max(0, (length - width) / 2));

  const lo = half + margin;
  const hi = length - half - margin;
  const center = lo > hi ? length / 2 : clamp(opening.t * length, lo, hi);

  return { start: center - half, end: center + half, center, width, length };
}

/**
 * Resolve an opening into concrete world geometry on its host wall.
 * Returns null when the host wall no longer exists.
 */
export function openingFrame(doc, opening) {
  const wall = doc.walls.find((w) => w.id === opening.wallId);
  if (!wall) return null;
  const span = openingSpan(wall, opening);
  if (!span) return null;

  const dx = (wall.b.x - wall.a.x) / span.length;
  const dy = (wall.b.y - wall.a.y) / span.length;

  return {
    wall,
    length: span.length,
    dir: { x: dx, y: dy },
    normal: { x: -dy, y: dx },
    center: { x: wall.a.x + dx * span.center, y: wall.a.y + dy * span.center },
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    thickness: wall.thickness,
    width: span.width,
    startDist: span.start,
    endDist: span.end,
  };
}

/* ------------------------------------------------------------------ *
 * Serialization
 * ------------------------------------------------------------------ */

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v, fallback = '') =>
  typeof v === 'string' ? v : v == null ? fallback : String(v);

export function serialize(doc) {
  return JSON.stringify(
    {
      version: SCHEMA_VERSION,
      name: doc.name,
      generator: 'blueprint-designer',
      savedAt: new Date().toISOString(),
      walls: doc.walls,
      openings: doc.openings,
      rooms: doc.rooms,
      furniture: doc.furniture,
    },
    null,
    2,
  );
}

/**
 * Parse a saved blueprint. Coerces every numeric field, drops unknown keys,
 * and removes openings whose host wall is missing — a malformed file should
 * degrade rather than crash the renderer.
 *
 * @throws {Error} when the payload is not a recognisable blueprint document.
 */
export function deserialize(json) {
  const raw = typeof json === 'string' ? JSON.parse(json) : json;
  if (!raw || typeof raw !== 'object') {
    throw new Error('File is not a blueprint document.');
  }
  if (raw.version && raw.version !== SCHEMA_VERSION) {
    throw new Error(
      `Unsupported blueprint version "${raw.version}" (expected ${SCHEMA_VERSION}).`,
    );
  }
  if (!Array.isArray(raw.walls) && !Array.isArray(raw.furniture)) {
    throw new Error('File is missing blueprint geometry.');
  }

  const walls = (raw.walls ?? []).map((w) => ({
    id: str(w.id) || makeId('w'),
    entity: ENTITY_WALL,
    a: { x: num(w.a?.x), y: num(w.a?.y) },
    b: { x: num(w.b?.x), y: num(w.b?.y) },
    thickness: Math.max(0.08, num(w.thickness, DEFAULT_WALL_THICKNESS)),
  }));
  const wallIds = new Set(walls.map((w) => w.id));

  const openings = (raw.openings ?? [])
    .filter((o) => wallIds.has(str(o.wallId)))
    .map((o) => ({
      id: str(o.id) || makeId('op'),
      entity: ENTITY_OPENING,
      kind: o.kind === 'window' ? 'window' : 'door',
      wallId: str(o.wallId),
      t: clamp(num(o.t, 0.5), 0, 1),
      width: Math.max(0.5, num(o.width, DEFAULT_DOOR_WIDTH)),
      hinge: o.hinge === 'b' ? 'b' : 'a',
      swing: o.swing === 'out' ? 'out' : 'in',
      style: o.style === 'cased' ? 'cased' : 'swing',
      label: str(o.label),
    }));

  const rooms = (raw.rooms ?? []).map((r) => ({
    id: str(r.id) || makeId('rm'),
    entity: ENTITY_ROOM,
    x: num(r.x),
    y: num(r.y),
    w: Math.max(0.5, num(r.w, 1)),
    h: Math.max(0.5, num(r.h, 1)),
    label: str(r.label, 'Room'),
    preset: str(r.preset, 'custom'),
    tint: r.tint ? str(r.tint) : null,
  }));

  const furniture = (raw.furniture ?? []).map((f) => {
    const def = getFurniture(str(f.kind));
    return {
      id: str(f.id) || makeId('f'),
      entity: ENTITY_FURNITURE,
      kind: def.kind,
      x: num(f.x),
      y: num(f.y),
      w: Math.max(0.2, num(f.w, def.w)),
      h: Math.max(0.2, num(f.h, def.h)),
      rot: num(f.rot),
      tint: f.tint ? str(f.tint) : null,
      label: str(f.label),
    };
  });

  return {
    version: SCHEMA_VERSION,
    name: str(raw.name, 'Imported Plan'),
    walls,
    openings,
    rooms,
    furniture,
  };
}

/**
 * Deep-clone a set of entities with fresh ids, offset by (dx, dy).
 * Openings are only carried over when their host wall is also in the set, and
 * are re-pointed at the cloned wall.
 */
export function cloneEntities(doc, ids, dx = 0, dy = 0) {
  const idSet = new Set(ids);
  const wallIdMap = new Map();
  const out = { walls: [], openings: [], rooms: [], furniture: [] };

  for (const w of doc.walls) {
    if (!idSet.has(w.id)) continue;
    const copy = {
      ...w,
      id: makeId('w'),
      a: { x: w.a.x + dx, y: w.a.y + dy },
      b: { x: w.b.x + dx, y: w.b.y + dy },
    };
    wallIdMap.set(w.id, copy.id);
    out.walls.push(copy);
  }
  for (const o of doc.openings) {
    if (!idSet.has(o.id)) continue;
    const hostId = wallIdMap.get(o.wallId) ?? o.wallId;
    // An opening can only be duplicated onto a wall that still exists.
    if (!wallIdMap.has(o.wallId) && !doc.walls.some((w) => w.id === o.wallId)) {
      continue;
    }
    out.openings.push({ ...o, id: makeId(o.kind === 'window' ? 'win' : 'dr'), wallId: hostId });
  }
  for (const r of doc.rooms) {
    if (!idSet.has(r.id)) continue;
    out.rooms.push({ ...r, id: makeId('rm'), x: r.x + dx, y: r.y + dy });
  }
  for (const f of doc.furniture) {
    if (!idSet.has(f.id)) continue;
    out.furniture.push({ ...f, id: makeId('f'), x: f.x + dx, y: f.y + dy });
  }
  return out;
}

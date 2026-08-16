/**
 * Document reducer + undo/redo history.
 *
 * History entries are only pushed for *committed* operations. A pointer drag
 * mutates a scratch ref and dispatches exactly one action on pointerup, so a
 * drag collapses to a single undo step rather than several hundred.
 */

import {
  COLLECTIONS,
  ENTITY_FURNITURE,
  ENTITY_OPENING,
  ENTITY_ROOM,
  ENTITY_WALL,
  createEmptyDoc,
} from './document.js';

export const HISTORY_LIMIT = 100;

export const ACTIONS = {
  ADD: 'ADD',
  UPDATE: 'UPDATE',
  UPDATE_MANY: 'UPDATE_MANY',
  DELETE: 'DELETE',
  REPLACE: 'REPLACE',
  SET_NAME: 'SET_NAME',
  UNDO: 'UNDO',
  REDO: 'REDO',
};

const COLLECTION_FOR_ENTITY = {
  [ENTITY_WALL]: 'walls',
  [ENTITY_OPENING]: 'openings',
  [ENTITY_ROOM]: 'rooms',
  [ENTITY_FURNITURE]: 'furniture',
};

export function createHistory(doc = createEmptyDoc()) {
  return { past: [], present: doc, future: [] };
}

export const canUndo = (history) => history.past.length > 0;
export const canRedo = (history) => history.future.length > 0;

function pushHistory(history, nextDoc) {
  if (nextDoc === history.present) return history;
  const past = [...history.past, history.present];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, present: nextDoc, future: [] };
}

/**
 * Apply an action to the document only (no history bookkeeping).
 * Returns the same object reference when nothing changed, which lets
 * `pushHistory` skip no-op undo entries.
 */
function applyToDoc(doc, action) {
  switch (action.type) {
    case ACTIONS.ADD: {
      // `entities` may be a single entity or a { walls, rooms, ... } bundle.
      const next = { ...doc };
      const items = Array.isArray(action.entities)
        ? action.entities
        : action.entities.entity
          ? [action.entities]
          : null;

      if (items) {
        const grouped = new Map();
        for (const item of items) {
          const key = COLLECTION_FOR_ENTITY[item.entity];
          if (!key) continue;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key).push(item);
        }
        if (!grouped.size) return doc;
        for (const [key, list] of grouped) next[key] = [...doc[key], ...list];
        return next;
      }

      // Bundle form (used by paste/duplicate).
      let touched = false;
      for (const key of COLLECTIONS) {
        const list = action.entities[key];
        if (list?.length) {
          next[key] = [...doc[key], ...list];
          touched = true;
        }
      }
      return touched ? next : doc;
    }

    case ACTIONS.UPDATE: {
      for (const key of COLLECTIONS) {
        const idx = doc[key].findIndex((e) => e.id === action.id);
        if (idx === -1) continue;
        const current = doc[key][idx];
        const merged = { ...current, ...action.patch };
        // Skip the write when the patch is a no-op.
        const changed = Object.keys(action.patch).some(
          (k) => !shallowEqual(current[k], merged[k]),
        );
        if (!changed) return doc;
        const list = doc[key].slice();
        list[idx] = merged;
        return { ...doc, [key]: list };
      }
      return doc;
    }

    case ACTIONS.UPDATE_MANY: {
      // action.patches: Map<id, patch> | Array<[id, patch]> | Record<id, patch>
      const entries =
        action.patches instanceof Map
          ? [...action.patches.entries()]
          : Array.isArray(action.patches)
            ? action.patches
            : Object.entries(action.patches);
      if (!entries.length) return doc;

      const patchById = new Map(entries);
      const next = { ...doc };
      let touched = false;
      for (const key of COLLECTIONS) {
        let listChanged = false;
        const list = doc[key].map((e) => {
          const patch = patchById.get(e.id);
          if (!patch) return e;
          listChanged = true;
          return { ...e, ...patch };
        });
        if (listChanged) {
          next[key] = list;
          touched = true;
        }
      }
      return touched ? next : doc;
    }

    case ACTIONS.DELETE: {
      const ids = new Set(action.ids);
      if (!ids.size) return doc;
      const next = { ...doc };
      let touched = false;
      for (const key of COLLECTIONS) {
        const list = doc[key].filter((e) => !ids.has(e.id));
        if (list.length !== doc[key].length) {
          next[key] = list;
          touched = true;
        }
      }
      if (!touched) return doc;
      // Deleting a wall orphans its openings; drop them too.
      const liveWalls = new Set(next.walls.map((w) => w.id));
      const openings = next.openings.filter((o) => liveWalls.has(o.wallId));
      if (openings.length !== next.openings.length) next.openings = openings;
      return next;
    }

    case ACTIONS.REPLACE:
      return action.doc;

    case ACTIONS.SET_NAME:
      return doc.name === action.name ? doc : { ...doc, name: action.name };

    default:
      return doc;
  }
}

function shallowEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a[k] === b[k]);
}

export function historyReducer(history, action) {
  switch (action.type) {
    case ACTIONS.UNDO: {
      if (!history.past.length) return history;
      const past = history.past.slice(0, -1);
      const present = history.past[history.past.length - 1];
      return { past, present, future: [history.present, ...history.future] };
    }
    case ACTIONS.REDO: {
      if (!history.future.length) return history;
      const [present, ...future] = history.future;
      return { past: [...history.past, history.present], present, future };
    }
    default: {
      const nextDoc = applyToDoc(history.present, action);
      if (nextDoc === history.present) return history;
      // `transient` actions (e.g. restoring an autosave) bypass the undo stack.
      if (action.transient) return { ...history, present: nextDoc };
      return pushHistory(history, nextDoc);
    }
  }
}

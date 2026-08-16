/**
 * The application store.
 *
 * Split by update frequency:
 *   - React state  : the document, selection, and UI toggles — change rarely.
 *   - Refs         : camera, pointer scratch, drag draft — change every frame.
 *
 * Pointer handlers read and write the refs and ask for a canvas repaint; they
 * never call setState during a drag. A drag therefore produces zero React
 * renders and exactly one history entry, dispatched on pointerup.
 */

import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createHistory, historyReducer, canRedo, canUndo, ACTIONS } from './reducer.js';
import {
  cloneEntities,
  createEmptyDoc,
  deserialize,
  entityCount,
  serialize,
  totalArea,
} from './document.js';
import { createTemplateDoc } from '../data/template.js';
import { createView } from '../engine/camera.js';
import { THEME_BLUEPRINT } from '../engine/theme.js';
import { UNIT_IMPERIAL } from '../engine/units.js';

export const TOOL_SELECT = 'select';
export const TOOL_WALL = 'wall';
export const TOOL_DOOR = 'door';
export const TOOL_WINDOW = 'window';
export const TOOL_ROOM = 'room';
export const TOOL_PAN = 'pan';

/**
 * Lazy initializer. This runs inside `useReducer`, not an effect, so React 19
 * StrictMode's double-invocation cannot produce two templates or two history
 * entries — the function is pure and its result is equivalent either way.
 */
function initHistory() {
  return createHistory(createTemplateDoc());
}

export function useBlueprintStore() {
  const [history, dispatch] = useReducer(historyReducer, undefined, initHistory);
  const doc = history.present;

  const [selection, setSelection] = useState(() => new Set());
  const [tool, setToolState] = useState(TOOL_SELECT);
  const [themeId, setThemeId] = useState(THEME_BLUEPRINT);
  const [units, setUnits] = useState(UNIT_IMPERIAL);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapSize, setSnapSize] = useState(0.5);
  const [showDimensions, setShowDimensions] = useState(true);
  const [roomPreset, setRoomPreset] = useState('living');
  const [notice, setNotice] = useState(null);

  // Zoom mirrored into state purely so the slider and status bar can render it.
  const [zoomDisplay, setZoomDisplay] = useState(1);

  /* ---------------- Refs: the hot path ---------------- */
  const viewRef = useRef(createView());
  const docRef = useRef(doc);
  const selectionRef = useRef(selection);
  const toolRef = useRef(tool);
  const settingsRef = useRef({ snapEnabled, snapSize, themeId, units, roomPreset, showDimensions });
  const draftRef = useRef(null);
  const clipboardRef = useRef(null);
  const repaintRef = useRef(() => {});
  // Shared between the sidebar (writes on dragstart) and the canvas (reads on
  // drop), because some browsers block reading dataTransfer during dragover.
  const dragKindRef = useRef(null);

  // Mirror React state into refs before paint so handlers never see stale data.
  useLayoutEffect(() => {
    docRef.current = doc;
  }, [doc]);
  useLayoutEffect(() => {
    selectionRef.current = selection;
  }, [selection]);
  useLayoutEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useLayoutEffect(() => {
    settingsRef.current = { snapEnabled, snapSize, themeId, units, roomPreset, showDimensions };
  }, [snapEnabled, snapSize, themeId, units, roomPreset, showDimensions]);

  /** Registered by the canvas so any caller can request a repaint. */
  const setRepaint = useCallback((fn) => {
    repaintRef.current = fn ?? (() => {});
  }, []);
  const repaint = useCallback(() => repaintRef.current(), []);

  /* ---------------- Selection helpers ---------------- */

  const selectOnly = useCallback(
    (ids) => {
      const next = new Set(ids ? (Array.isArray(ids) ? ids : [ids]) : []);
      selectionRef.current = next;
      setSelection(next);
      repaint();
    },
    [repaint],
  );

  const toggleSelection = useCallback(
    (id) => {
      const next = new Set(selectionRef.current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      selectionRef.current = next;
      setSelection(next);
      repaint();
    },
    [repaint],
  );

  const clearSelection = useCallback(() => selectOnly([]), [selectOnly]);

  const selectAll = useCallback(() => {
    const d = docRef.current;
    selectOnly([
      ...d.rooms.map((e) => e.id),
      ...d.walls.map((e) => e.id),
      ...d.furniture.map((e) => e.id),
    ]);
  }, [selectOnly]);

  /* ---------------- Commands ---------------- */

  const setTool = useCallback(
    (next) => {
      draftRef.current = null;
      setToolState(next);
      toolRef.current = next;
      repaint();
    },
    [repaint],
  );

  const commit = useCallback(
    (action) => {
      dispatch(action);
      repaint();
    },
    [repaint],
  );

  const deleteSelection = useCallback(() => {
    const ids = [...selectionRef.current];
    if (!ids.length) return;
    commit({ type: ACTIONS.DELETE, ids });
    selectOnly([]);
  }, [commit, selectOnly]);

  const duplicateSelection = useCallback(
    (dx = 1, dy = 1) => {
      const ids = [...selectionRef.current];
      if (!ids.length) return;
      const bundle = cloneEntities(docRef.current, ids, dx, dy);
      commit({ type: ACTIONS.ADD, entities: bundle });
      const newIds = [
        ...bundle.walls,
        ...bundle.openings,
        ...bundle.rooms,
        ...bundle.furniture,
      ].map((e) => e.id);
      selectOnly(newIds);
    },
    [commit, selectOnly],
  );

  const copySelection = useCallback(() => {
    const ids = [...selectionRef.current];
    if (!ids.length) return false;
    // Snapshot at copy time so later edits to the originals do not leak in.
    clipboardRef.current = cloneEntities(docRef.current, ids, 0, 0);
    return true;
  }, []);

  const pasteClipboard = useCallback(
    (dx = 1.5, dy = 1.5) => {
      const clip = clipboardRef.current;
      if (!clip) return false;
      // Re-clone so repeated pastes get fresh ids each time.
      const staging = {
        version: 'bp-1',
        name: '',
        walls: clip.walls,
        openings: clip.openings,
        rooms: clip.rooms,
        furniture: clip.furniture,
      };
      const allIds = [
        ...clip.walls,
        ...clip.openings,
        ...clip.rooms,
        ...clip.furniture,
      ].map((e) => e.id);
      const bundle = cloneEntities(staging, allIds, dx, dy);
      commit({ type: ACTIONS.ADD, entities: bundle });
      selectOnly(
        [...bundle.walls, ...bundle.openings, ...bundle.rooms, ...bundle.furniture].map(
          (e) => e.id,
        ),
      );
      return true;
    },
    [commit, selectOnly],
  );

  const undo = useCallback(() => {
    dispatch({ type: ACTIONS.UNDO });
    repaint();
  }, [repaint]);

  const redo = useCallback(() => {
    dispatch({ type: ACTIONS.REDO });
    repaint();
  }, [repaint]);

  const clearCanvas = useCallback(() => {
    commit({ type: ACTIONS.REPLACE, doc: createEmptyDoc('Untitled Plan') });
    selectOnly([]);
  }, [commit, selectOnly]);

  const loadTemplate = useCallback(() => {
    commit({ type: ACTIONS.REPLACE, doc: createTemplateDoc() });
    selectOnly([]);
  }, [commit, selectOnly]);

  const loadJson = useCallback(
    (text) => {
      try {
        const next = deserialize(text);
        commit({ type: ACTIONS.REPLACE, doc: next });
        selectOnly([]);
        setNotice({ kind: 'success', message: `Loaded “${next.name}”.` });
        return true;
      } catch (err) {
        setNotice({ kind: 'error', message: err.message || 'Could not read that file.' });
        return false;
      }
    },
    [commit, selectOnly],
  );

  const toJson = useCallback(() => serialize(docRef.current), []);

  /* ---------------- Derived, memoized ---------------- */

  const stats = useMemo(
    () => ({ area: totalArea(doc), count: entityCount(doc) }),
    [doc],
  );

  // Selection is stored as ids; resolve to entities only when the panel renders.
  const selectedEntities = useMemo(() => {
    if (!selection.size) return [];
    const out = [];
    for (const key of ['rooms', 'walls', 'openings', 'furniture']) {
      for (const e of doc[key]) if (selection.has(e.id)) out.push(e);
    }
    return out;
  }, [doc, selection]);

  return {
    // document + history
    doc,
    docRef,
    dispatch: commit,
    undo,
    redo,
    canUndo: canUndo(history),
    canRedo: canRedo(history),

    // selection
    selection,
    selectionRef,
    selectedEntities,
    selectOnly,
    toggleSelection,
    clearSelection,
    selectAll,
    deleteSelection,
    duplicateSelection,
    copySelection,
    pasteClipboard,

    // tools + settings
    tool,
    toolRef,
    setTool,
    themeId,
    setThemeId,
    units,
    setUnits,
    snapEnabled,
    setSnapEnabled,
    snapSize,
    setSnapSize,
    showDimensions,
    setShowDimensions,
    roomPreset,
    setRoomPreset,
    settingsRef,

    // camera + rendering
    viewRef,
    draftRef,
    dragKindRef,
    zoomDisplay,
    setZoomDisplay,
    setRepaint,
    repaint,

    // io
    clearCanvas,
    loadTemplate,
    loadJson,
    toJson,
    notice,
    setNotice,

    // stats
    stats,
  };
}

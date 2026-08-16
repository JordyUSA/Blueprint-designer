/**
 * Global keyboard shortcuts.
 *
 * All bindings are suppressed while a text input has focus, so typing a room
 * name never deletes the selection or switches tools.
 */

import { useEffect } from 'react';
import { ACTIONS } from '../state/reducer.js';
import {
  TOOL_DOOR,
  TOOL_PAN,
  TOOL_ROOM,
  TOOL_SELECT,
  TOOL_WALL,
  TOOL_WINDOW,
} from '../state/useBlueprintStore.js';
import { THEME_BLUEPRINT, THEME_CAD } from '../engine/theme.js';

const TOOL_KEYS = {
  v: TOOL_SELECT,
  w: TOOL_WALL,
  d: TOOL_DOOR,
  n: TOOL_WINDOW,
  m: TOOL_ROOM,
  h: TOOL_PAN,
};

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(store, { onSave, onExport, onZoomFit, onZoomReset }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      /* ---- Modified shortcuts ---- */
      if (mod) {
        switch (key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) store.redo();
            else store.undo();
            return;
          case 'y':
            e.preventDefault();
            store.redo();
            return;
          case 'd':
            e.preventDefault();
            store.duplicateSelection();
            return;
          case 'c':
            e.preventDefault();
            if (store.copySelection()) {
              store.setNotice({
                kind: 'success',
                message: `Copied ${store.selection.size} object${store.selection.size === 1 ? '' : 's'}.`,
              });
            }
            return;
          case 'v':
            e.preventDefault();
            store.pasteClipboard();
            return;
          case 'a':
            e.preventDefault();
            store.selectAll();
            return;
          case 's':
            e.preventDefault();
            onSave();
            return;
          case 'e':
            e.preventDefault();
            onExport();
            return;
          default:
            return;
        }
      }

      if (e.altKey) return;

      /* ---- Plain keys ---- */
      // `R` rotates the selection when there is one, and only otherwise falls
      // through to a tool binding — rotation is the more common intent.
      if (key === 'r') {
        if (store.selection.size) {
          e.preventDefault();
          const patches = new Map();
          for (const item of store.selectedEntities) {
            if (item.entity === 'furniture') {
              patches.set(item.id, { rot: item.rot + (e.shiftKey ? -45 : 45) });
            }
          }
          if (patches.size) store.dispatch({ type: ACTIONS.UPDATE_MANY, patches });
          return;
        }
      }

      if (TOOL_KEYS[key] && !e.shiftKey) {
        e.preventDefault();
        store.setTool(TOOL_KEYS[key]);
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          store.deleteSelection();
          return;
        case 'Escape':
          e.preventDefault();
          store.draftRef.current = null;
          store.clearSelection();
          return;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown': {
          if (!store.selection.size) return;
          e.preventDefault();
          const step = e.shiftKey ? 1 : store.snapEnabled ? store.snapSize : 0.25;
          const dx =
            e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          const patches = new Map();
          for (const item of store.selectedEntities) {
            if (item.entity === 'wall') {
              patches.set(item.id, {
                a: { x: item.a.x + dx, y: item.a.y + dy },
                b: { x: item.b.x + dx, y: item.b.y + dy },
              });
            } else if (item.entity === 'room' || item.entity === 'furniture') {
              patches.set(item.id, { x: item.x + dx, y: item.y + dy });
            }
          }
          if (patches.size) store.dispatch({ type: ACTIONS.UPDATE_MANY, patches });
          return;
        }
        default:
          break;
      }

      switch (key) {
        case 'g':
          e.preventDefault();
          store.setSnapEnabled(!store.snapEnabled);
          return;
        case 't':
          e.preventDefault();
          store.setThemeId(store.themeId === THEME_BLUEPRINT ? THEME_CAD : THEME_BLUEPRINT);
          return;
        case 'f':
          e.preventDefault();
          onZoomFit();
          return;
        case '0':
          e.preventDefault();
          onZoomReset();
          return;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store, onSave, onExport, onZoomFit, onZoomReset]);
}

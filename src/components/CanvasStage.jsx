/**
 * The drawing surface.
 *
 * Owns every pointer, wheel, keyboard-modifier and drag-and-drop interaction,
 * plus the render loop. During a drag this component mutates refs and asks for
 * a repaint; it does not call setState, so React renders zero times between
 * pointerdown and pointerup.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useCanvasSize } from '../hooks/useCanvasSize.js';
import { useRafRender } from '../hooks/useRafRender.js';
import { renderScene } from '../engine/renderer.js';
import { getTheme } from '../engine/theme.js';
import {
  fitToBounds,
  screenToWorld,
  screenToWorldDist,
  zoomByWheel,
} from '../engine/camera.js';
import {
  clamp,
  deg2rad,
  dist,
  rad2deg,
  rectFromPoints,
  snapPoint,
  snapSegmentAngle,
  snapValue,
} from '../engine/geometry.js';
import {
  HANDLE_CURSORS,
  hitHandle,
  hitTest,
  marqueeSelect,
  selectionBounds,
} from '../engine/hittest.js';
import { nearestWall, snapToWallEndpoint } from '../engine/wallGeometry.js';
import {
  DEFAULT_DOOR_WIDTH,
  DEFAULT_WINDOW_WIDTH,
  docBounds,
  makeFurniture,
  makeOpening,
  makeRoom,
  makeWall,
  openingSpan,
  wallLength,
} from '../state/document.js';
import { ACTIONS } from '../state/reducer.js';
import {
  TOOL_DOOR,
  TOOL_PAN,
  TOOL_ROOM,
  TOOL_SELECT,
  TOOL_WALL,
  TOOL_WINDOW,
} from '../state/useBlueprintStore.js';
import { getRoomPreset } from '../data/roomPresets.js';
import { formatCoord } from '../engine/units.js';

/** How close (screen px) the cursor must be to an existing endpoint to snap. */
const ENDPOINT_SNAP_PX = 14;
/** How close (screen px) the cursor must be to a wall to place an opening. */
const WALL_ATTACH_PX = 26;
/** Minimum drag distance (screen px) before a click becomes a drag. */
const DRAG_THRESHOLD_PX = 3;

export const DRAG_MIME = 'application/x-blueprint-kind';

export function CanvasStage({ store, readoutRef }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rectRef = useRef({ left: 0, top: 0 });
  const modifiersRef = useRef({ shift: false, alt: false, space: false });
  const hoverRef = useRef({ handle: null, id: null });
  const didFitRef = useRef(false);
  // Mirrors the kind being dragged: some browsers block reading dataTransfer
  // during dragover, so the sidebar also stashes the kind in this shared ref.
  const dragKindRef = store.dragKindRef;

  const [size, sizeRef] = useCanvasSize(containerRef);

  const {
    docRef,
    dispatch,
    selectionRef,
    selectOnly,
    toggleSelection,
    viewRef,
    draftRef,
    settingsRef,
    toolRef,
    setRepaint,
    setZoomDisplay,
  } = store;

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const { width, height, dpr } = sizeRef.current;
    if (!canvas || width === 0 || height === 0) return;

    const pixelW = Math.round(width * dpr);
    const pixelH = Math.round(height * dpr);
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }

    const ctx = canvas.getContext('2d');
    const { themeId, units, showDimensions } = settingsRef.current;

    renderScene(ctx, {
      doc: docRef.current,
      view: viewRef.current,
      theme: getTheme(themeId),
      size: { width, height, dpr },
      selection: selectionRef.current,
      draft: draftRef.current,
      units,
      options: { grid: true, labels: true, dimensions: showDimensions, chrome: true },
    });

    // Publish zoom to React at most once per frame, and only when it moved.
    setZoomDisplay((prev) =>
      Math.abs(prev - viewRef.current.zoom) < 0.005 ? prev : viewRef.current.zoom,
    );
  }, [docRef, draftRef, selectionRef, settingsRef, sizeRef, viewRef, setZoomDisplay]);

  const requestRender = useRafRender(draw);

  // Let the rest of the app trigger repaints.
  useLayoutEffect(() => {
    setRepaint(requestRender);
    return () => setRepaint(null);
  }, [setRepaint, requestRender]);

  /**
   * Repaint whenever anything React-visible that affects the drawing changes.
   * The refs the renderer reads are updated in a layout effect inside the
   * store, so by the time this runs they already hold the new values. Without
   * this the canvas would keep the old theme until some unrelated interaction
   * happened to request a frame.
   */
  useLayoutEffect(() => {
    requestRender();
  }, [
    size,
    requestRender,
    store.doc,
    store.selection,
    store.themeId,
    store.units,
    store.showDimensions,
    store.tool,
  ]);

  // Fit the pre-loaded template into view once the viewport has a real size.
  useEffect(() => {
    if (didFitRef.current || size.width === 0 || size.height === 0) return;
    didFitRef.current = true;
    const bounds = docBounds(docRef.current);
    viewRef.current = fitToBounds(bounds, size, 72);
    requestRender();
  }, [size, docRef, viewRef, requestRender]);

  /* ------------------------------------------------------------------ *
   * Coordinate helpers
   * ------------------------------------------------------------------ */

  const cacheRect = useCallback(() => {
    const el = canvasRef.current;
    if (el) rectRef.current = el.getBoundingClientRect();
  }, []);

  /**
   * Screen position of an event, relative to the canvas.
   * `offsetX/offsetY` are unreliable once a pointer is captured, so this always
   * works from clientX/clientY and a cached bounding rect.
   */
  const toScreen = useCallback((e) => {
    const r = rectRef.current;
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const toWorld = useCallback(
    (e) => screenToWorld(viewRef.current, toScreen(e)),
    [toScreen, viewRef],
  );

  /** Apply grid snapping when enabled and the alt key is not held. */
  const applySnap = useCallback(
    (world) => {
      const { snapEnabled, snapSize } = settingsRef.current;
      if (!snapEnabled || modifiersRef.current.alt) return world;
      return snapPoint(world, snapSize);
    },
    [settingsRef],
  );

  /** Endpoint magnet first, then the grid. Returns the point and a snap marker. */
  const resolveDraftPoint = useCallback(
    (world) => {
      const view = viewRef.current;
      const radius = screenToWorldDist(view, ENDPOINT_SNAP_PX);
      const endpoint = snapToWallEndpoint(docRef.current.walls, world, radius);
      if (endpoint) return { point: endpoint, marker: endpoint };
      return { point: applySnap(world), marker: null };
    },
    [applySnap, docRef, viewRef],
  );

  /* ------------------------------------------------------------------ *
   * Status bar readout (written imperatively, never through React)
   * ------------------------------------------------------------------ */

  const writeReadout = useCallback(
    (world) => {
      const nodes = readoutRef.current;
      if (!nodes) return;
      const { units } = settingsRef.current;
      if (nodes.x) nodes.x.textContent = formatCoord(world.x, units);
      if (nodes.y) nodes.y.textContent = formatCoord(world.y, units);
    },
    [readoutRef, settingsRef],
  );

  /* ------------------------------------------------------------------ *
   * Transform application
   * ------------------------------------------------------------------ */

  /** Build the patch map for a translate of the current drag selection. */
  const buildMovePatches = useCallback(
    (drag, dx, dy) => {
      const doc = docRef.current;
      const patches = new Map();
      const selectedWallIds = new Set(
        [...drag.originals.keys()].filter((id) => doc.walls.some((w) => w.id === id)),
      );

      for (const [id, original] of drag.originals) {
        switch (original.entity) {
          case 'wall':
            patches.set(id, {
              a: { x: original.a.x + dx, y: original.a.y + dy },
              b: { x: original.b.x + dx, y: original.b.y + dy },
            });
            break;
          case 'room':
          case 'furniture':
            patches.set(id, { x: original.x + dx, y: original.y + dy });
            break;
          case 'opening': {
            // An opening rides its wall. Only slide it when its host is not
            // itself being moved, otherwise it would double up.
            if (selectedWallIds.has(original.wallId)) break;
            const wall = doc.walls.find((w) => w.id === original.wallId);
            if (!wall) break;
            const span = openingSpan(wall, original);
            if (!span) break;
            const dirX = (wall.b.x - wall.a.x) / span.length;
            const dirY = (wall.b.y - wall.a.y) / span.length;
            // Project the drag delta onto the wall direction.
            const along = dx * dirX + dy * dirY;
            patches.set(id, {
              t: clamp((span.center + along) / span.length, 0, 1),
            });
            break;
          }
          default:
            break;
        }
      }
      return patches;
    },
    [docRef],
  );

  /** Build the patch map for a bounds-relative scale. */
  const buildScalePatches = useCallback((drag, sx, sy, anchor) => {
    const patches = new Map();
    const mapPoint = (p) => ({
      x: anchor.x + (p.x - anchor.x) * sx,
      y: anchor.y + (p.y - anchor.y) * sy,
    });
    for (const [id, o] of drag.originals) {
      switch (o.entity) {
        case 'wall':
          patches.set(id, { a: mapPoint(o.a), b: mapPoint(o.b) });
          break;
        case 'room': {
          const tl = mapPoint({ x: o.x, y: o.y });
          const br = mapPoint({ x: o.x + o.w, y: o.y + o.h });
          patches.set(id, {
            x: Math.min(tl.x, br.x),
            y: Math.min(tl.y, br.y),
            w: Math.max(Math.abs(br.x - tl.x), 0.5),
            h: Math.max(Math.abs(br.y - tl.y), 0.5),
          });
          break;
        }
        case 'furniture': {
          const c = mapPoint({ x: o.x, y: o.y });
          patches.set(id, {
            x: c.x,
            y: c.y,
            w: Math.max(o.w * Math.abs(sx), 0.25),
            h: Math.max(o.h * Math.abs(sy), 0.25),
          });
          break;
        }
        default:
          break;
      }
    }
    return patches;
  }, []);

  /**
   * Build the patch map for a rotation about `center`.
   * Rooms are axis-aligned by model, so they keep their orientation and are
   * left in place rather than being silently distorted.
   */
  const buildRotatePatches = useCallback((drag, deltaDeg, center) => {
    const patches = new Map();
    const rad = deg2rad(deltaDeg);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const spin = (p) => ({
      x: center.x + (p.x - center.x) * cos - (p.y - center.y) * sin,
      y: center.y + (p.x - center.x) * sin + (p.y - center.y) * cos,
    });
    for (const [id, o] of drag.originals) {
      if (o.entity === 'wall') patches.set(id, { a: spin(o.a), b: spin(o.b) });
      else if (o.entity === 'furniture') {
        const c = spin({ x: o.x, y: o.y });
        patches.set(id, { x: c.x, y: c.y, rot: o.rot + deltaDeg });
      }
    }
    return patches;
  }, []);

  /* ------------------------------------------------------------------ *
   * Pointer handling
   * ------------------------------------------------------------------ */

  const endDrag = useCallback(() => {
    draftRef.current = null;
    requestRender();
  }, [draftRef, requestRender]);

  const onPointerDown = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      cacheRect();
      const screen = toScreen(e);
      const world = screenToWorld(viewRef.current, screen);
      const tool = toolRef.current;
      const doc = docRef.current;
      modifiersRef.current.shift = e.shiftKey;
      modifiersRef.current.alt = e.altKey;

      // Middle mouse and space-drag always pan, whatever the active tool is.
      const wantsPan =
        tool === TOOL_PAN || e.button === 1 || modifiersRef.current.space;

      if (e.button !== 0 && e.button !== 1) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);

      if (wantsPan) {
        draftRef.current = {
          kind: 'pan',
          pointerId: e.pointerId,
          startScreen: screen,
          startPan: { x: viewRef.current.panX, y: viewRef.current.panY },
        };
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (tool === TOOL_WALL) {
        const { point, marker } = resolveDraftPoint(world);
        draftRef.current = {
          kind: 'wall',
          pointerId: e.pointerId,
          startScreen: screen,
          a: point,
          b: point,
          thickness: 0.5,
          snap: marker,
          moved: false,
        };
        requestRender();
        return;
      }

      if (tool === TOOL_ROOM) {
        const start = applySnap(world);
        draftRef.current = {
          kind: 'room',
          pointerId: e.pointerId,
          startScreen: screen,
          start,
          rect: { x: start.x, y: start.y, w: 0, h: 0 },
          moved: false,
        };
        requestRender();
        return;
      }

      if (tool === TOOL_DOOR || tool === TOOL_WINDOW) {
        const kind = tool === TOOL_DOOR ? 'door' : 'window';
        const width = kind === 'door' ? DEFAULT_DOOR_WIDTH : DEFAULT_WINDOW_WIDTH;
        const hit = nearestWall(
          doc.walls,
          world,
          screenToWorldDist(viewRef.current, WALL_ATTACH_PX),
        );
        if (hit && wallLength(hit.wall) > width * 0.6) {
          const opening = makeOpening(kind, hit.wall.id, hit.t, { width });
          dispatch({ type: ACTIONS.ADD, entities: opening });
          selectOnly([opening.id]);
        }
        draftRef.current = null;
        return;
      }

      /* ---- Select tool ---- */
      const selection = selectionRef.current;
      const bounds = selectionBounds(doc, selection);
      const handle = hitHandle(bounds, viewRef.current, screen);

      /** Pristine snapshots of everything currently selected. */
      const snapshot = (ids) => {
        const originals = new Map();
        for (const key of ['rooms', 'walls', 'openings', 'furniture']) {
          for (const en of doc[key]) {
            if (ids.has(en.id)) originals.set(en.id, structuredClone(en));
          }
        }
        return originals;
      };

      if (handle && bounds) {
        const originals = snapshot(selection);
        const center = {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
        };
        draftRef.current =
          handle === 'rotate'
            ? {
                kind: 'rotate',
                pointerId: e.pointerId,
                startScreen: screen,
                originals,
                center,
                startAngle: rad2deg(Math.atan2(world.y - center.y, world.x - center.x)),
                moved: false,
              }
            : {
                kind: 'scale',
                pointerId: e.pointerId,
                startScreen: screen,
                originals,
                handle,
                bounds0: bounds,
                startWorld: world,
                moved: false,
              };
        return;
      }

      const hit = hitTest(doc, world, viewRef.current);

      if (!hit) {
        if (!e.shiftKey) selectOnly([]);
        draftRef.current = {
          kind: 'marquee',
          pointerId: e.pointerId,
          startScreen: screen,
          start: world,
          rect: { x: world.x, y: world.y, w: 0, h: 0 },
          base: e.shiftKey ? [...selection] : [],
          moved: false,
        };
        return;
      }

      // Clicking an unselected item selects it; shift-click extends. Both
      // helpers update `selectionRef` synchronously, so it is the source of
      // truth for the drag that may follow this click.
      if (e.shiftKey) toggleSelection(hit.id);
      else if (!selection.has(hit.id)) selectOnly([hit.id]);

      draftRef.current = {
        kind: 'move',
        pointerId: e.pointerId,
        startScreen: screen,
        originals: snapshot(selectionRef.current),
        startWorld: world,
        anchorId: hit.id,
        moved: false,
      };
    },
    [
      applySnap,
      cacheRect,
      dispatch,
      docRef,
      draftRef,
      requestRender,
      resolveDraftPoint,
      selectOnly,
      selectionRef,
      toScreen,
      toggleSelection,
      toolRef,
      viewRef,
    ],
  );

  const onPointerMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const screen = toScreen(e);
      const world = screenToWorld(viewRef.current, screen);
      modifiersRef.current.shift = e.shiftKey;
      modifiersRef.current.alt = e.altKey;
      writeReadout(world);

      const drag = draftRef.current;
      const tool = toolRef.current;
      const doc = docRef.current;

      /* ---- No active drag: hover feedback only ---- */
      if (!drag || drag.pointerId == null) {
        if (tool === TOOL_DOOR || tool === TOOL_WINDOW) {
          const kind = tool === TOOL_DOOR ? 'door' : 'window';
          const width = kind === 'door' ? DEFAULT_DOOR_WIDTH : DEFAULT_WINDOW_WIDTH;
          const hit = nearestWall(
            doc.walls,
            world,
            screenToWorldDist(viewRef.current, WALL_ATTACH_PX),
          );
          if (hit) {
            const span = openingSpan(hit.wall, { t: hit.t, width });
            draftRef.current = span
              ? {
                  kind: 'opening',
                  preview: {
                    kind,
                    center: {
                      x: hit.wall.a.x + ((hit.wall.b.x - hit.wall.a.x) / span.length) * span.center,
                      y: hit.wall.a.y + ((hit.wall.b.y - hit.wall.a.y) / span.length) * span.center,
                    },
                    angle: rad2deg(
                      Math.atan2(hit.wall.b.y - hit.wall.a.y, hit.wall.b.x - hit.wall.a.x),
                    ),
                    width: span.width,
                    thickness: hit.wall.thickness,
                  },
                }
              : null;
          } else if (draftRef.current) {
            draftRef.current = null;
          }
          requestRender();
          return;
        }

        if (tool === TOOL_SELECT) {
          const bounds = selectionBounds(doc, selectionRef.current);
          const handle = hitHandle(bounds, viewRef.current, screen);
          const hovered = handle ? null : hitTest(doc, world, viewRef.current);
          const prev = hoverRef.current;
          if (prev.handle !== handle || prev.id !== (hovered?.id ?? null)) {
            hoverRef.current = { handle, id: hovered?.id ?? null };
            canvas.style.cursor = handle
              ? HANDLE_CURSORS[handle]
              : hovered
                ? 'move'
                : 'default';
          }
        }
        return;
      }

      if (e.pointerId !== drag.pointerId) return;

      // Every drag records `startScreen`, so this is a plain screen-space
      // distance test — a click never counts as a drag.
      if (!drag.moved && drag.startScreen) {
        drag.moved =
          Math.hypot(screen.x - drag.startScreen.x, screen.y - drag.startScreen.y) >
          DRAG_THRESHOLD_PX;
      }

      switch (drag.kind) {
        case 'pan': {
          viewRef.current = {
            ...viewRef.current,
            panX: drag.startPan.x + (screen.x - drag.startScreen.x),
            panY: drag.startPan.y + (screen.y - drag.startScreen.y),
          };
          break;
        }

        case 'wall': {
          const { point, marker } = resolveDraftPoint(world);
          let b = point;
          if (e.shiftKey) {
            b = snapSegmentAngle(drag.a, b, 45);
            const { snapEnabled, snapSize } = settingsRef.current;
            if (snapEnabled && !e.altKey) {
              // Keep the angle but quantise the length.
              const length = snapValue(dist(drag.a, b), snapSize);
              const ang = Math.atan2(b.y - drag.a.y, b.x - drag.a.x);
              b = { x: drag.a.x + Math.cos(ang) * length, y: drag.a.y + Math.sin(ang) * length };
            }
          }
          drag.b = b;
          drag.snap = marker;
          break;
        }

        case 'room': {
          const end = applySnap(world);
          drag.rect = rectFromPoints(drag.start, end);
          break;
        }

        case 'marquee': {
          drag.rect = rectFromPoints(drag.start, world);
          break;
        }

        case 'move': {
          let dx = world.x - drag.startWorld.x;
          let dy = world.y - drag.startWorld.y;
          const { snapEnabled, snapSize } = settingsRef.current;
          if (snapEnabled && !e.altKey) {
            // Snap the dragged item's own origin, then move everything by the
            // same delta so relative positions inside a multi-selection hold.
            const anchor = drag.originals.get(drag.anchorId);
            if (anchor) {
              const ax = anchor.entity === 'wall' ? anchor.a.x : anchor.x;
              const ay = anchor.entity === 'wall' ? anchor.a.y : anchor.y;
              if (Number.isFinite(ax) && Number.isFinite(ay)) {
                dx = snapValue(ax + dx, snapSize) - ax;
                dy = snapValue(ay + dy, snapSize) - ay;
              }
            }
          }
          drag.patches = buildMovePatches(drag, dx, dy);
          drag.delta = { dx, dy };
          break;
        }

        case 'scale': {
          const b0 = drag.bounds0;
          const h = drag.handle;
          const target = applySnap(world);

          // The anchor is the edge opposite the grabbed handle and stays put;
          // the grabbed edge follows the cursor. Axes the handle does not
          // touch (e.g. X for the 'n' handle) are left unscaled.
          const west = h.includes('w');
          const east = h.includes('e');
          const north = h.includes('n');
          const south = h.includes('s');

          const anchorX = west ? b0.maxX : east ? b0.minX : (b0.minX + b0.maxX) / 2;
          const anchorY = north ? b0.maxY : south ? b0.minY : (b0.minY + b0.maxY) / 2;
          const movingX = west ? b0.minX : b0.maxX;
          const movingY = north ? b0.minY : b0.maxY;

          let sx = 1;
          if (west || east) {
            const span = movingX - anchorX;
            if (Math.abs(span) > 1e-6) sx = (target.x - anchorX) / span;
          }
          let sy = 1;
          if (north || south) {
            const span = movingY - anchorY;
            if (Math.abs(span) > 1e-6) sy = (target.y - anchorY) / span;
          }
          if (!Number.isFinite(sx)) sx = 1;
          if (!Number.isFinite(sy)) sy = 1;

          // Shift preserves the aspect ratio on corner handles.
          if (e.shiftKey && h.length === 2) {
            const k = Math.max(Math.abs(sx), Math.abs(sy));
            sx = (sx < 0 ? -1 : 1) * k;
            sy = (sy < 0 ? -1 : 1) * k;
          }

          // Never allow a mirror flip or a total collapse.
          sx = clamp(sx, 0.02, 40);
          sy = clamp(sy, 0.02, 40);
          drag.patches = buildScalePatches(drag, sx, sy, { x: anchorX, y: anchorY });
          break;
        }

        case 'rotate': {
          const angle = rad2deg(
            Math.atan2(world.y - drag.center.y, world.x - drag.center.x),
          );
          let delta = angle - drag.startAngle;
          if (e.shiftKey) delta = Math.round(delta / 15) * 15;
          drag.patches = buildRotatePatches(drag, delta, drag.center);
          drag.deltaAngle = delta;
          break;
        }

        default:
          break;
      }

      // Live-preview transforms by applying the pending patches to the doc ref
      // copy the renderer reads. The reducer is only touched on pointerup.
      if (drag.patches) applyPreview(docRef, drag);
      requestRender();
    },
    [
      applySnap,
      buildMovePatches,
      buildRotatePatches,
      buildScalePatches,
      docRef,
      draftRef,
      requestRender,
      resolveDraftPoint,
      selectionRef,
      settingsRef,
      toScreen,
      toolRef,
      viewRef,
      writeReadout,
    ],
  );

  const onPointerUp = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const drag = draftRef.current;
      if (canvas?.hasPointerCapture?.(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      if (!drag || e.pointerId !== drag.pointerId) {
        if (canvas) canvas.style.cursor = cursorForTool(toolRef.current);
        return;
      }

      const doc = docRef.current;

      switch (drag.kind) {
        case 'wall': {
          const length = dist(drag.a, drag.b);
          if (length >= 0.25) {
            const wall = makeWall(drag.a, drag.b, { thickness: drag.thickness });
            dispatch({ type: ACTIONS.ADD, entities: wall });
            selectOnly([wall.id]);
          }
          break;
        }

        case 'room': {
          const r = drag.rect;
          if (r && r.w >= 0.5 && r.h >= 0.5) {
            const preset = getRoomPreset(settingsRef.current.roomPreset);
            const room = makeRoom(r.x, r.y, r.w, r.h, {
              label: preset.label,
              preset: preset.id,
              tint: preset.tint,
            });
            dispatch({ type: ACTIONS.ADD, entities: room });
            selectOnly([room.id]);
          }
          break;
        }

        case 'marquee': {
          if (drag.moved && drag.rect) {
            const found = marqueeSelect(doc, drag.rect);
            selectOnly([...new Set([...drag.base, ...found])]);
          }
          break;
        }

        case 'move':
        case 'scale':
        case 'rotate': {
          if (drag.moved && drag.patches && drag.patches.size) {
            // Restore the pristine document, then commit one history entry.
            revertPreview(docRef, drag);
            dispatch({ type: ACTIONS.UPDATE_MANY, patches: drag.patches });
          } else if (drag.patches) {
            revertPreview(docRef, drag);
          }
          break;
        }

        default:
          break;
      }

      draftRef.current = null;
      if (canvas) canvas.style.cursor = cursorForTool(toolRef.current);
      requestRender();
    },
    [dispatch, docRef, draftRef, requestRender, selectOnly, settingsRef, toolRef],
  );

  const onPointerCancel = useCallback(
    (e) => {
      const drag = draftRef.current;
      if (drag?.patches) revertPreview(docRef, drag);
      const canvas = canvasRef.current;
      if (canvas?.hasPointerCapture?.(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      endDrag();
    },
    [docRef, draftRef, endDrag],
  );

  /* ------------------------------------------------------------------ *
   * Wheel — must be a non-passive native listener.
   * React's synthetic onWheel is passive, so preventDefault() there is a
   * no-op and the page would scroll instead of the canvas zooming.
   * ------------------------------------------------------------------ */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      cacheRect();
      const r = rectRef.current;
      const screen = { x: e.clientX - r.left, y: e.clientY - r.top };
      // deltaMode 1 is lines (Firefox); normalise so one notch feels the same.
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      viewRef.current = zoomByWheel(viewRef.current, screen, clamp(delta, -240, 240));
      requestRender();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [cacheRect, requestRender, viewRef]);

  /* ------------------------------------------------------------------ *
   * Space-to-pan. Reset on blur, or a lost keyup leaves the app stuck.
   * ------------------------------------------------------------------ */

  useEffect(() => {
    const isTyping = (t) =>
      t instanceof HTMLElement &&
      (t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT' ||
        t.isContentEditable);

    const onKeyDown = (e) => {
      if (e.code === 'Space' && !isTyping(e.target)) {
        e.preventDefault();
        if (!modifiersRef.current.space) {
          modifiersRef.current.space = true;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        modifiersRef.current.space = false;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = cursorForTool(toolRef.current);
        }
      }
    };
    const reset = () => {
      modifiersRef.current = { shift: false, alt: false, space: false };
      if (canvasRef.current) {
        canvasRef.current.style.cursor = cursorForTool(toolRef.current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [toolRef]);

  // Keep the cached rect fresh when the page scrolls or resizes.
  useEffect(() => {
    cacheRect();
    window.addEventListener('scroll', cacheRect, true);
    window.addEventListener('resize', cacheRect);
    return () => {
      window.removeEventListener('scroll', cacheRect, true);
      window.removeEventListener('resize', cacheRect);
    };
  }, [cacheRect, size]);

  // Reflect the active tool in the cursor.
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = cursorForTool(store.tool);
    }
  }, [store.tool]);

  /* ------------------------------------------------------------------ *
   * HTML5 drag-and-drop from the sidebar
   * ------------------------------------------------------------------ */

  const onDragOver = useCallback((e) => {
    // Without preventDefault here, `drop` never fires at all.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      cacheRect();
      const kind =
        e.dataTransfer.getData(DRAG_MIME) ||
        e.dataTransfer.getData('text/plain') ||
        dragKindRef.current;
      if (!kind) return;
      const r = rectRef.current;
      const world = screenToWorld(viewRef.current, {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      });
      const at = applySnap(world);
      const item = makeFurniture(kind, at.x, at.y);
      dispatch({ type: ACTIONS.ADD, entities: item });
      selectOnly([item.id]);
      dragKindRef.current = null;
    },
    [applySnap, cacheRect, dispatch, dragKindRef, selectOnly, viewRef],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        onDragOver={onDragOver}
        onDrop={onDrop}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Live preview helpers
 *
 * A drag previews by writing the pending patches straight onto the document
 * object the renderer reads, keeping a snapshot so the mutation can be undone
 * before the single real dispatch on pointerup. This keeps the canvas at 60fps
 * without the reducer — and therefore React — running per frame.
 * ------------------------------------------------------------------ */

function applyPreview(docRef, drag) {
  const doc = docRef.current;
  if (!drag.previewBackup) drag.previewBackup = new Map();

  for (const [id, patch] of drag.patches) {
    for (const key of ['rooms', 'walls', 'openings', 'furniture']) {
      const idx = doc[key].findIndex((en) => en.id === id);
      if (idx === -1) continue;
      if (!drag.previewBackup.has(id)) {
        drag.previewBackup.set(id, { key, idx, entity: doc[key][idx] });
      }
      const base = drag.originals.get(id) ?? doc[key][idx];
      doc[key][idx] = { ...base, ...patch };
      break;
    }
  }
}

function revertPreview(docRef, drag) {
  const doc = docRef.current;
  if (!drag.previewBackup) return;
  for (const { key, idx, entity } of drag.previewBackup.values()) {
    if (doc[key][idx]?.id === entity.id) doc[key][idx] = entity;
  }
  drag.previewBackup = null;
}

function cursorForTool(tool) {
  switch (tool) {
    case TOOL_PAN:
      return 'grab';
    case TOOL_WALL:
    case TOOL_ROOM:
      return 'crosshair';
    case TOOL_DOOR:
    case TOOL_WINDOW:
      return 'copy';
    default:
      return 'default';
  }
}

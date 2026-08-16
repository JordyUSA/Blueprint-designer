/**
 * The scene renderer.
 *
 * `renderScene` is a pure function of its `scene` argument with no module-level
 * state, which is what lets the PNG exporter reuse it verbatim: the exported
 * image is guaranteed to match the screen because it is produced by the same
 * code path with a different camera and canvas size.
 *
 * Transform discipline — there are only two modes:
 *   world  : units are feet; stroke widths must be divided by `pxPerFt`
 *   screen : units are CSS pixels; used for ALL text and selection chrome
 * Text is never drawn under the world transform, or it would scale with zoom
 * and hint badly.
 */

import { formatArea, formatFeetInches, formatLength } from './units.js';
import { pixelsPerFoot, screenToWorld } from './camera.js';
import { deg2rad, dist, rotatedRectCorners, segmentAngle } from './geometry.js';
import { buildOpeningGeometry, buildWallPolygons, WALL_OUTLINE } from './wallGeometry.js';
import { getFurniture } from '../data/furniture.js';
import { entityBounds, openingFrame, wallLength } from '../state/document.js';
import { HANDLE_DRAW_PX, handlePositions, selectionBounds } from './hittest.js';

/* ------------------------------------------------------------------ *
 * Transform helpers
 * ------------------------------------------------------------------ */

function beginScreen(ctx, dpr) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function beginWorld(ctx, view, dpr) {
  const k = pixelsPerFoot(view) * dpr;
  ctx.setTransform(k, 0, 0, k, view.panX * dpr, view.panY * dpr);
}

/* ------------------------------------------------------------------ *
 * Text helpers (always screen space)
 * ------------------------------------------------------------------ */

function drawPill(ctx, text, sx, sy, theme, { font = '11px ui-sans-serif, system-ui', color, angle = 0 } = {}) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 10;
  const h = 17;
  ctx.translate(sx, sy);
  if (angle) ctx.rotate(angle);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(-w / 2, -h / 2, w, h, 4);
  else ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = theme.labelBg;
  ctx.fill();
  ctx.strokeStyle = theme.labelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color ?? theme.text;
  ctx.fillText(text, 0, 0.5);
  ctx.restore();
}

/** Halo-stroked text, legible over any fill without a background box. */
function drawHaloText(ctx, text, sx, sy, theme, { font, color, align = 'center', baseline = 'middle' } = {}) {
  ctx.save();
  ctx.font = font ?? '12px ui-sans-serif, system-ui';
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.bg;
  ctx.strokeText(text, sx, sy);
  ctx.fillStyle = color ?? theme.text;
  ctx.fillText(text, sx, sy);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Layers
 * ------------------------------------------------------------------ */

function drawBackground(ctx, scene) {
  const { theme, size } = scene;
  beginScreen(ctx, size.dpr);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, size.width, size.height);

  if (theme.dark && scene.options.vignette !== false) {
    const g = ctx.createRadialGradient(
      size.width / 2,
      size.height / 2,
      Math.min(size.width, size.height) * 0.2,
      size.width / 2,
      size.height / 2,
      Math.max(size.width, size.height) * 0.75,
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, theme.bgVignette);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size.width, size.height);
  }
}

/**
 * Grid, drawn in screen space with half-pixel offsets so hairlines land on
 * exact device pixels. Level-of-detail keeps the line count bounded: when a
 * 1 ft square would be under ~7 px, step up to 5 ft, then 25 ft.
 */
function drawGrid(ctx, scene) {
  const { view, theme, size } = scene;
  beginScreen(ctx, size.dpr);

  const k = pixelsPerFoot(view);
  let step = 1;
  while (k * step < 7) step *= 5;
  const major = step * 5;
  const decade = step * 25;

  const tl = screenToWorld(view, { x: 0, y: 0 });
  const br = screenToWorld(view, { x: size.width, y: size.height });

  const drawSet = (spacing, color, width) => {
    ctx.beginPath();
    const x0 = Math.floor(tl.x / spacing) * spacing;
    for (let x = x0; x <= br.x; x += spacing) {
      const sx = Math.round(x * k + view.panX) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, size.height);
    }
    const y0 = Math.floor(tl.y / spacing) * spacing;
    for (let y = y0; y <= br.y; y += spacing) {
      const sy = Math.round(y * k + view.panY) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(size.width, sy);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  // Minor lines are skipped once they would be denser than ~5 px apart.
  if (k * step >= 5) drawSet(step, theme.gridMinor, 1);
  drawSet(major, theme.gridMajor, 1);
  drawSet(decade, theme.gridDecade, 1);

  // Origin axes.
  ctx.beginPath();
  const ox = Math.round(view.panX) + 0.5;
  const oy = Math.round(view.panY) + 0.5;
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, size.height);
  ctx.moveTo(0, oy);
  ctx.lineTo(size.width, oy);
  ctx.strokeStyle = theme.axis;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawRooms(ctx, scene) {
  const { doc, view, theme, size, options } = scene;
  beginWorld(ctx, view, size.dpr);
  const px = 1 / pixelsPerFoot(view);

  for (const room of doc.rooms) {
    // The theme's neutral wash goes down first and the preset tint layers on
    // top. Painting the tint alone would let a warm hue land *darker* than the
    // blueprint ground, so a kitchen would read as a black hole next to a
    // cool-tinted bedroom.
    ctx.fillStyle = theme.roomFill;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    if (room.tint) {
      ctx.fillStyle = room.tint;
      ctx.fillRect(room.x, room.y, room.w, room.h);
    }
    ctx.strokeStyle = theme.roomStroke;
    ctx.lineWidth = px * 1.25;
    ctx.strokeRect(room.x, room.y, room.w, room.h);
  }

  if (!options.labels) return;

  beginScreen(ctx, size.dpr);
  const k = pixelsPerFoot(view);
  for (const room of doc.rooms) {
    // Hide labels that no longer fit inside the room on screen.
    if (room.w * k < 54 || room.h * k < 30) continue;
    const cx = (room.x + room.w / 2) * k + view.panX;
    const cy = (room.y + room.h / 2) * k + view.panY;
    drawHaloText(ctx, room.label, cx, cy - 7, theme, {
      font: '600 13px ui-sans-serif, system-ui',
      color: theme.roomLabel,
    });
    drawHaloText(ctx, formatArea(Math.abs(room.w * room.h), scene.units), cx, cy + 9, theme, {
      font: '11px ui-sans-serif, system-ui',
      color: theme.roomArea,
    });
  }
}

/**
 * Wall bodies. Fill + stroke in the outline color grows the union outward by
 * half the stroke width; the second fill in the body color then covers every
 * interior seam, leaving the dark edge only on the true outer boundary.
 */
function drawWalls(ctx, scene) {
  const { doc, view, theme, size } = scene;
  if (!doc.walls.length) return;

  beginWorld(ctx, view, size.dpr);
  const { solids, joins } = buildWallPolygons(doc);

  const path = new Path2D();
  const addPoly = (poly) => {
    path.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) path.lineTo(poly[i].x, poly[i].y);
    path.closePath();
  };
  for (const s of solids) addPoly(s.poly);
  for (const j of joins) addPoly(j.poly);

  ctx.save();
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 8;

  // Grow pass — outline color.
  ctx.fillStyle = theme.wallStroke;
  ctx.fill(path, 'nonzero');
  ctx.strokeStyle = theme.wallStroke;
  ctx.lineWidth = WALL_OUTLINE * 2;
  ctx.stroke(path);

  // Body pass — covers all interior seams.
  ctx.fillStyle = theme.wallFill;
  ctx.fill(path, 'nonzero');
  ctx.restore();
}

function drawOpenings(ctx, scene) {
  const { doc, view, theme, size } = scene;
  if (!doc.openings.length) return;

  beginWorld(ctx, view, size.dpr);
  const px = 1 / pixelsPerFoot(view);

  for (const opening of doc.openings) {
    const g = buildOpeningGeometry(doc, opening);
    if (!g) continue;

    ctx.lineCap = 'butt';

    if (g.cased) {
      // A cased opening is just a framed hole: the wall subtraction and its
      // dark jamb caps already draw it, so nothing further is needed here.
      continue;
    } else if (g.kind === 'door') {
      // Swing arc.
      ctx.beginPath();
      ctx.arc(
        g.door.hinge.x,
        g.door.hinge.y,
        g.door.radius,
        g.door.startAngle,
        g.door.endAngle,
        g.door.counterclockwise,
      );
      ctx.strokeStyle = theme.doorArc;
      ctx.lineWidth = px * 1.1;
      ctx.setLineDash([px * 4, px * 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Door leaf, drawn fully open.
      ctx.beginPath();
      ctx.moveTo(g.door.hinge.x, g.door.hinge.y);
      ctx.lineTo(g.door.leafEnd.x, g.door.leafEnd.y);
      ctx.strokeStyle = theme.openingStroke;
      ctx.lineWidth = Math.max(px * 2, g.thickness * 0.28);
      ctx.stroke();
    } else {
      // Window: frame edges flush with the wall faces, plus glazing lines.
      ctx.strokeStyle = theme.openingStroke;
      ctx.lineWidth = px * 1.4;
      for (const [p, q] of [g.revealPos, g.revealNeg]) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      ctx.strokeStyle = theme.glazing;
      ctx.lineWidth = px * 1.1;
      for (const [p, q] of g.glazing) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }
}

function drawFurniture(ctx, scene) {
  const { doc, view, theme, size } = scene;
  if (!doc.furniture.length) return;

  beginWorld(ctx, view, size.dpr);
  const px = 1 / pixelsPerFoot(view);

  for (const item of doc.furniture) {
    const def = getFurniture(item.kind);
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(deg2rad(item.rot));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    def.draw(ctx, {
      w: item.w,
      h: item.h,
      theme,
      fill: item.tint ?? theme.furnitureFill,
      stroke: theme.furnitureStroke,
      detail: theme.furnitureDetail,
      lw: px,
      item,
    });
    ctx.restore();
  }

  if (!scene.options.labels) return;
  beginScreen(ctx, size.dpr);
  const k = pixelsPerFoot(view);
  for (const item of doc.furniture) {
    if (!item.label) continue;
    drawHaloText(
      ctx,
      item.label,
      item.x * k + view.panX,
      (item.y + item.h / 2) * k + view.panY + 11,
      theme,
      { font: '11px ui-sans-serif, system-ui', color: theme.textMuted },
    );
  }
}

/** Dimension labels along wall centerlines, kept upright. */
function drawWallDimensions(ctx, scene) {
  const { doc, view, theme, size, units } = scene;
  beginScreen(ctx, size.dpr);
  const k = pixelsPerFoot(view);

  for (const wall of doc.walls) {
    const length = wallLength(wall);
    if (length < 0.5) continue;
    const screenLen = length * k;
    if (screenLen < 44) continue; // no room for the label

    const mx = ((wall.a.x + wall.b.x) / 2) * k + view.panX;
    const my = ((wall.a.y + wall.b.y) / 2) * k + view.panY;

    let angle = segmentAngle(wall.a, wall.b);
    // Flip so text is never upside down.
    if (angle > 90 || angle < -90) angle += 180;
    const rad = deg2rad(angle);
    // Offset perpendicular to the wall, on the consistent "outside" side.
    const off = wall.thickness * k * 0.5 + 12;
    drawPill(
      ctx,
      formatLength(length, units, { compact: true }),
      mx + Math.sin(rad) * off,
      my - Math.cos(rad) * off,
      theme,
      { angle: rad, color: theme.textMuted },
    );
  }
}

/* ------------------------------------------------------------------ *
 * Selection chrome & drag overlays (screen space)
 * ------------------------------------------------------------------ */

function drawSelection(ctx, scene) {
  const { doc, view, theme, size, selection } = scene;
  if (!selection || !selection.size) return;

  beginScreen(ctx, size.dpr);
  const k = pixelsPerFoot(view);

  // Thin outline around each selected entity.
  ctx.save();
  ctx.strokeStyle = theme.selection;
  ctx.lineWidth = 1.5;
  for (const key of ['rooms', 'walls', 'openings', 'furniture']) {
    for (const e of doc[key]) {
      if (!selection.has(e.id)) continue;
      const corners =
        e.entity === 'furniture'
          ? rotatedRectCorners(e.x, e.y, e.w, e.h, e.rot)
          : e.entity === 'opening'
            ? (() => {
                const f = openingFrame(doc, e);
                return f
                  ? rotatedRectCorners(f.center.x, f.center.y, f.width, f.thickness, f.angle)
                  : [];
              })()
            : (() => {
                const b = entityBounds(e, doc);
                return b
                  ? [
                      { x: b.minX, y: b.minY },
                      { x: b.maxX, y: b.minY },
                      { x: b.maxX, y: b.maxY },
                      { x: b.minX, y: b.maxY },
                    ]
                  : [];
              })();
      if (!corners.length) continue;
      ctx.beginPath();
      corners.forEach((p, i) => {
        const sx = p.x * k + view.panX;
        const sy = p.y * k + view.panY;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  // Union bounding box + handles.
  const bounds = selectionBounds(doc, selection);
  if (!bounds) return;
  const handles = handlePositions(bounds, view);

  ctx.save();
  ctx.strokeStyle = theme.selection;
  ctx.fillStyle = theme.selectionFill;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  const x = bounds.minX * k + view.panX;
  const y = bounds.minY * k + view.panY;
  const w = (bounds.maxX - bounds.minX) * k;
  const h = (bounds.maxY - bounds.minY) * k;
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  // Rotation tether + anchor.
  ctx.beginPath();
  ctx.moveTo(handles.n.x, handles.n.y);
  ctx.lineTo(handles.rotate.x, handles.rotate.y);
  ctx.strokeStyle = theme.selection;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(handles.rotate.x, handles.rotate.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = theme.handle;
  ctx.fill();
  ctx.strokeStyle = theme.handleStroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Scale handles.
  for (const key of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
    const p = handles[key];
    ctx.beginPath();
    ctx.rect(
      p.x - HANDLE_DRAW_PX,
      p.y - HANDLE_DRAW_PX,
      HANDLE_DRAW_PX * 2,
      HANDLE_DRAW_PX * 2,
    );
    ctx.fillStyle = theme.handle;
    ctx.fill();
    ctx.strokeStyle = theme.handleStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

/** Live previews for in-progress tool drags. */
function drawDraft(ctx, scene) {
  const { draft, view, theme, size, units } = scene;
  if (!draft) return;
  beginScreen(ctx, size.dpr);
  const k = pixelsPerFoot(view);
  const toScreen = (p) => ({ x: p.x * k + view.panX, y: p.y * k + view.panY });

  if (draft.kind === 'wall' && draft.a && draft.b) {
    const a = toScreen(draft.a);
    const b = toScreen(draft.b);
    const thicknessPx = Math.max(2, (draft.thickness ?? 0.5) * k);
    ctx.save();
    ctx.strokeStyle = theme.ghost;
    ctx.lineWidth = thicknessPx;
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();

    const length = dist(draft.a, draft.b);
    if (length > 0.05) {
      let angle = segmentAngle(draft.a, draft.b);
      if (angle > 90 || angle < -90) angle += 180;
      const rad = deg2rad(angle);
      const off = thicknessPx / 2 + 14;
      drawPill(
        ctx,
        `${formatLength(length, units, { compact: true })}  ${Math.round(
          ((segmentAngle(draft.a, draft.b) % 360) + 360) % 360,
        )}°`,
        (a.x + b.x) / 2 + Math.sin(rad) * off,
        (a.y + b.y) / 2 - Math.cos(rad) * off,
        theme,
        { angle: rad, color: theme.accent },
      );
    }
  }

  if (draft.kind === 'room' && draft.rect) {
    const p = toScreen({ x: draft.rect.x, y: draft.rect.y });
    const w = draft.rect.w * k;
    const h = draft.rect.h * k;
    ctx.save();
    ctx.fillStyle = theme.ghostFill;
    ctx.fillRect(p.x, p.y, w, h);
    ctx.strokeStyle = theme.ghost;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(p.x, p.y, w, h);
    ctx.restore();
    if (draft.rect.w > 0.2 && draft.rect.h > 0.2) {
      drawPill(
        ctx,
        `${formatFeetInches(draft.rect.w, { compact: true })} × ${formatFeetInches(
          draft.rect.h,
          { compact: true },
        )}  ·  ${formatArea(draft.rect.w * draft.rect.h, units)}`,
        p.x + w / 2,
        p.y + h / 2,
        theme,
        { color: theme.accent },
      );
    }
  }

  if (draft.kind === 'marquee' && draft.rect) {
    const p = toScreen({ x: draft.rect.x, y: draft.rect.y });
    ctx.save();
    ctx.fillStyle = theme.marqueeFill;
    ctx.fillRect(p.x, p.y, draft.rect.w * k, draft.rect.h * k);
    ctx.strokeStyle = theme.marqueeStroke;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(p.x, p.y, draft.rect.w * k, draft.rect.h * k);
    ctx.restore();
  }

  // Door/window placement preview projected onto the hovered wall.
  if (draft.kind === 'opening' && draft.preview) {
    const { center, angle, width, thickness } = draft.preview;
    const c = toScreen(center);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(deg2rad(angle));
    ctx.fillStyle = theme.ghostFill;
    ctx.strokeStyle = theme.ghost;
    ctx.lineWidth = 1.5;
    const w = width * k;
    const h = Math.max(thickness * k, 4);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    if (draft.preview.kind === 'door') {
      ctx.beginPath();
      ctx.arc(-w / 2, 0, w, -Math.PI / 2, 0);
      ctx.setLineDash([5, 4]);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Snap indicator ring.
  if (draft.snap) {
    const s = toScreen(draft.snap);
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = theme.snapMarker;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

/**
 * Draw the whole scene.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} scene
 * @param {object}   scene.doc        blueprint document
 * @param {object}   scene.view       { panX, panY, zoom }
 * @param {object}   scene.theme      theme token object
 * @param {{width:number,height:number,dpr:number}} scene.size  CSS size + DPR
 * @param {Set<string>} [scene.selection]
 * @param {object}   [scene.draft]    in-progress interaction preview
 * @param {string}   [scene.units]
 * @param {object}   [scene.options]  { grid, labels, dimensions, chrome, vignette }
 */
export function renderScene(ctx, scene) {
  const options = {
    grid: true,
    labels: true,
    dimensions: true,
    chrome: true,
    ...(scene.options ?? {}),
  };
  const s = { units: 'imperial', selection: new Set(), draft: null, ...scene, options };

  ctx.save();
  drawBackground(ctx, s);
  if (options.grid) drawGrid(ctx, s);
  drawRooms(ctx, s);
  drawWalls(ctx, s);
  drawOpenings(ctx, s);
  drawFurniture(ctx, s);
  if (options.dimensions) drawWallDimensions(ctx, s);
  if (options.chrome) {
    drawSelection(ctx, s);
    drawDraft(ctx, s);
  }
  ctx.restore();
  // Leave the context in screen space so callers can composite predictably.
  beginScreen(ctx, s.size.dpr);
}

/**
 * Decor & utility plan symbols.
 *
 * Each function receives a context already translated to the item centre,
 * rotated, and scaled so 1 unit === 1 foot. Draw in local space spanning
 * [-w/2, w/2] x [-h/2, h/2]; by convention an item "faces" -y (up).
 */

import {
  arcSweep,
  body,
  circle,
  dashRect,
  dial,
  hatch,
  line,
  outline,
  poly,
  ribs,
  rrect,
} from './primitives.js';

function drawPlant(ctx, env) {
  const { w, h } = env;
  const r = Math.min(w, h) / 2;
  // Pot.
  circle(ctx, env, 0, 0, r * 0.42, { fill: env.fill, stroke: env.stroke, width: 1.4 });
  // Foliage as overlapping lobes.
  const lobes = 7;
  ctx.beginPath();
  for (let i = 0; i <= 64; i += 1) {
    const a = (i / 64) * Math.PI * 2;
    const rr = r * (0.78 + 0.22 * Math.sin(a * lobes));
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.3;
  ctx.stroke();
  for (let i = 0; i < lobes; i += 1) {
    const a = (i / lobes) * Math.PI * 2;
    line(ctx, env, 0, 0, Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, 0.9);
  }
}

function drawRug(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Everything sits ON a rug, so it is drawn as a faint outline-led symbol
  // rather than a solid body that would wash out the furniture above it.
  rrect(ctx, -hw, -hh, w, h, 0.1);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = env.fill;
  ctx.fill();
  ctx.restore();
  ctx.setLineDash([0.35 * 1, 0.22 * 1]);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.4;
  ctx.stroke();
  ctx.setLineDash([]);
  outline(ctx, env, -hw + 0.35, -hh + 0.35, w - 0.7, h - 0.7, 0.08, 1);
  outline(ctx, env, -hw + 0.62, -hh + 0.62, w - 1.24, h - 1.24, 0.06, 0.8);
}

function drawStairs(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.04);
  const treads = Math.max(3, Math.round(h / 0.92));
  ribs(ctx, env, -hw, -hh, w, h, treads, false, 1);
  // Direction-of-travel arrow (up = toward -y).
  const ax = 0;
  line(ctx, env, ax, hh - 0.5, ax, -hh + 0.6, 1.6, env.stroke);
  ctx.beginPath();
  ctx.moveTo(ax, -hh + 0.25);
  ctx.lineTo(ax - 0.28, -hh + 0.78);
  ctx.lineTo(ax + 0.28, -hh + 0.78);
  ctx.closePath();
  ctx.fillStyle = env.stroke;
  ctx.fill();
}

function drawPatioTable(ctx, env) {
  const { w, h } = env;
  const r = Math.min(w, h) / 2;
  const chairR = r * 0.24;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    circle(ctx, env, Math.cos(a) * (r - chairR * 0.9), Math.sin(a) * (r - chairR * 0.9), chairR, {
      fill: env.fill,
      stroke: env.stroke,
      width: 1.2,
    });
  }
  circle(ctx, env, 0, 0, r * 0.6, { fill: env.fill, stroke: env.stroke, width: 1.5 });
  // Parasol hole + spokes.
  circle(ctx, env, 0, 0, r * 0.1, { stroke: env.detail, width: 1 });
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    line(ctx, env, Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14, Math.cos(a) * r * 0.56, Math.sin(a) * r * 0.56, 0.8);
  }
}

/** Front-loading washer or dryer; `vent` adds the dryer's exhaust stub. */
function drawLaundryUnit(ctx, env, { vent = false } = {}) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  // Control fascia at the back, port-hole door facing the room.
  const fascia = h * 0.18;
  line(ctx, env, -hw, -hh + fascia, hw, -hh + fascia, 1.1);
  dial(ctx, env, 0, -hh + fascia / 2, 0.07, 3, 0.42);
  const r = Math.min(w, h - fascia) * 0.32;
  circle(ctx, env, 0, -hh + fascia + (h - fascia) / 2, r, { stroke: env.stroke, width: 1.5 });
  circle(ctx, env, 0, -hh + fascia + (h - fascia) / 2, r * 0.6, { stroke: env.detail, width: 0.9 });
  if (vent) {
    // Exhaust duct stub out of the back.
    circle(ctx, env, hw - 0.3, -hh - 0.16, 0.14, { stroke: env.detail, width: 1.1 });
  }
}

const drawWasher = (ctx, env) => drawLaundryUnit(ctx, env);
const drawDryer = (ctx, env) => drawLaundryUnit(ctx, env, { vent: true });

function drawStackedLaundry(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  // The lower machine is real; the stacked one above is dashed.
  const r = Math.min(w, h) * 0.26;
  circle(ctx, env, 0, hh - r - 0.18, r, { stroke: env.stroke, width: 1.5 });
  circle(ctx, env, 0, hh - r - 0.18, r * 0.6, { stroke: env.detail, width: 0.9 });
  dial(ctx, env, 0, hh - 0.12, 0.06, 3, 0.36);
  dashRect(ctx, env, -hw + 0.06, -hh + 0.06, w - 0.12, h * 0.44, 0.05, 4, 1.2);
  circle(ctx, env, 0, -hh + h * 0.26, r * 0.8, { stroke: env.detail, width: 1 });
}

function drawWaterHeater(ctx, env) {
  const { w, h } = env;
  const r = Math.min(w, h) / 2;
  // Cylindrical tank seen in plan, with pipe stubs at the top.
  circle(ctx, env, 0, 0, r, { fill: env.fill, stroke: env.stroke, width: 1.6 });
  circle(ctx, env, 0, 0, r * 0.72, { stroke: env.detail, width: 0.9 });
  for (const sx of [-1, 1]) {
    line(ctx, env, sx * r * 0.45, -r * 0.72, sx * r * 0.45, -r - 0.18, 1.6, env.stroke);
    circle(ctx, env, sx * r * 0.45, -r - 0.18, 0.07, { stroke: env.detail, width: 0.9 });
  }
  // Access panel.
  line(ctx, env, -r * 0.3, r * 0.62, r * 0.3, r * 0.62, 1.1);
}

function drawHvacUnit(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Louvred return face toward the room, plus a hatched plant body.
  const louvre = h * 0.36;
  hatch(ctx, env, -hw + 0.08, -hh + 0.08, w - 0.16, h - louvre - 0.16, 0.22, Math.PI / 4, 0.8);
  ribs(ctx, env, -hw + 0.1, hh - louvre, w - 0.2, louvre - 0.1, 6, false, 1);
  outline(ctx, env, -hw + 0.1, hh - louvre, w - 0.2, louvre - 0.1, 0.04, 1.2);
  // Duct connection.
  line(ctx, env, -w * 0.18, -hh, w * 0.18, -hh, 2, env.stroke);
}

function drawIroningBoard(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Tapered board: wide square end, rounded narrow nose.
  ctx.beginPath();
  ctx.moveTo(-hw, -hh + h * 0.12);
  ctx.lineTo(-hw, hh - h * 0.12);
  ctx.quadraticCurveTo(-hw, hh, -hw + w * 0.12, hh);
  ctx.lineTo(hw - w * 0.16, hh - h * 0.28);
  ctx.quadraticCurveTo(hw, hh - h * 0.5, hw - w * 0.16, -hh + h * 0.28);
  ctx.lineTo(-hw + w * 0.12, -hh);
  ctx.quadraticCurveTo(-hw, -hh, -hw, -hh + h * 0.12);
  ctx.closePath();
  ctx.fillStyle = env.fill;
  ctx.fill();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.6;
  ctx.stroke();
  // Cross-braced legs underneath.
  line(ctx, env, -hw + w * 0.16, -hh + h * 0.3, -hw + w * 0.52, hh - h * 0.3, 0.9);
  line(ctx, env, -hw + w * 0.16, hh - h * 0.3, -hw + w * 0.52, -hh + h * 0.3, 0.9);
}

function drawStairsL(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  const runW = w * 0.42;
  // L-shaped flight: up the left leg, across the landing, out to the right.
  poly(ctx, env, [
    [-hw, -hh],
    [-hw + runW, -hh],
    [-hw + runW, hh - runW],
    [hw, hh - runW],
    [hw, hh],
    [-hw, hh],
  ], { fill: env.fill, stroke: env.stroke, width: 1.6 });
  // Treads on the vertical leg.
  const vTreads = Math.max(3, Math.round((h - runW) / 0.92));
  for (let i = 1; i < vTreads; i += 1) {
    const y = -hh + ((h - runW) * i) / vTreads;
    line(ctx, env, -hw, y, -hw + runW, y, 1);
  }
  // Landing divider, then treads on the horizontal leg.
  line(ctx, env, -hw, hh - runW, -hw + runW, hh - runW, 1.3);
  const hTreads = Math.max(3, Math.round((w - runW) / 0.92));
  for (let i = 1; i < hTreads; i += 1) {
    const x = -hw + runW + ((w - runW) * i) / hTreads;
    line(ctx, env, x, hh - runW, x, hh, 1);
  }
  // Direction of travel: up the leg then right.
  line(ctx, env, -hw + runW / 2, hh - runW - 0.3, -hw + runW / 2, -hh + 0.6, 1.5, env.stroke);
  poly(ctx, env, [
    [-hw + runW / 2, -hh + 0.24],
    [-hw + runW / 2 - 0.26, -hh + 0.74],
    [-hw + runW / 2 + 0.26, -hh + 0.74],
  ], { fill: env.stroke, stroke: null });
}

function drawStairsSpiral(ctx, env) {
  const { w, h } = env;
  const r = Math.min(w, h) / 2;
  circle(ctx, env, 0, 0, r, { fill: env.fill, stroke: env.stroke, width: 1.6 });
  // Central newel post.
  circle(ctx, env, 0, 0, r * 0.16, { fill: env.stroke, stroke: env.stroke, width: 1 });
  // Radial treads, wedge-shaped, sweeping most of the circle.
  const treads = 12;
  for (let i = 0; i < treads; i += 1) {
    const a = (i / treads) * Math.PI * 2;
    line(ctx, env, Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16, Math.cos(a) * r, Math.sin(a) * r, 1);
  }
  // Direction arrow riding the tread ring.
  arcSweep(ctx, env, 0, 0, r * 0.62, -Math.PI / 2, Math.PI * 0.85, { width: 1.5, color: env.stroke });
  const ae = Math.PI * 0.85;
  poly(ctx, env, [
    [Math.cos(ae) * r * 0.62, Math.sin(ae) * r * 0.62],
    [Math.cos(ae - 0.22) * r * 0.46, Math.sin(ae - 0.22) * r * 0.46],
    [Math.cos(ae - 0.22) * r * 0.78, Math.sin(ae - 0.22) * r * 0.78],
  ], { fill: env.stroke, stroke: null });
}

function drawShelvingUnit(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.03);
  // Open bays with a shelf line through the middle.
  const bays = Math.max(2, Math.round(w / 1.4));
  ribs(ctx, env, -hw, -hh, w, h, bays, true, 1.2);
  line(ctx, env, -hw, 0, hw, 0, 0.9);
  // Boxed contents hinted in a couple of bays.
  for (let i = 0; i < bays; i += 2) {
    const x0 = -hw + (w * i) / bays + 0.1;
    outline(ctx, env, x0, -hh + 0.1, w / bays - 0.2, h * 0.36, 0.04, 0.8);
  }
}

export const DECOR_DRAWERS = {
  'plant': drawPlant,
  'rug': drawRug,
  'patio-table': drawPatioTable,
  'shelving-unit': drawShelvingUnit,
  'stairs': drawStairs,
  'stairs-l': drawStairsL,
  'stairs-spiral': drawStairsSpiral,
  'washer': drawWasher,
  'dryer': drawDryer,
  'stacked-laundry': drawStackedLaundry,
  'water-heater': drawWaterHeater,
  'hvac-unit': drawHvacUnit,
  'ironing-board': drawIroningBoard,
};

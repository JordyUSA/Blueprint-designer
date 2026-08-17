/**
 * Kitchen & dining plan symbols.
 *
 * Each function receives a context already translated to the item centre,
 * rotated, and scaled so 1 unit === 1 foot. Draw in local space spanning
 * [-w/2, w/2] x [-h/2, h/2]; by convention an item "faces" -y (up).
 */

import {
  arcSweep,
  body,
  chairRing,
  circle,
  dashRect,
  dial,
  line,
  outline,
  poly,
  ribs,
  rrect,
} from './primitives.js';

function drawDiningSet(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  const tableW = w * 0.68;
  const tableH = h * 0.56;

  // Chairs first so the table reads on top.
  const chairR = Math.min(0.62, Math.min(w, h) * 0.14);
  const perSide = Math.max(2, Math.round(tableW / 2.2));
  for (let i = 0; i < perSide; i += 1) {
    const x = -tableW / 2 + (tableW * (i + 0.5)) / perSide;
    circle(ctx, env, x, -hh + chairR, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });
    circle(ctx, env, x, hh - chairR, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });
  }
  circle(ctx, env, -hw + chairR, 0, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });
  circle(ctx, env, hw - chairR, 0, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });

  body(ctx, env, -tableW / 2, -tableH / 2, tableW, tableH, 0.2);
  outline(ctx, env, -tableW / 2 + 0.2, -tableH / 2 + 0.2, tableW - 0.4, tableH - 0.4, 0.14);
}

function drawKitchenCounter(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.04);
  // Counter lip toward the room.
  line(ctx, env, -hw, hh - 0.18, hw, hh - 0.18, 1);
  // Base cabinet divisions.
  ribs(ctx, env, -hw, -hh, w, h, Math.max(2, Math.round(w / 2)), true, 1);
}

function drawStove(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  const r = Math.min(w, h) * 0.17;
  const ox = w * 0.22;
  const oy = h * 0.2;
  for (const [bx, by] of [
    [-ox, -oy],
    [ox, -oy],
    [-ox, oy * 0.5],
    [ox, oy * 0.5],
  ]) {
    circle(ctx, env, bx, by, r, { stroke: env.stroke, width: 1.2 });
    circle(ctx, env, bx, by, r * 0.45, { stroke: env.detail, width: 0.9 });
  }
  // Control strip / oven door toward the room.
  line(ctx, env, -hw + 0.12, hh - 0.3, hw - 0.12, hh - 0.3, 1.1);
}

function drawRefrigerator(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.08);
  // French doors split down the middle.
  line(ctx, env, 0, -hh, 0, hh * 0.15, 1.3);
  line(ctx, env, -hw, hh * 0.15, hw, hh * 0.15, 1.3);
  // Handles.
  line(ctx, env, -0.16, -hh + 0.35, -0.16, hh * 0.15 - 0.35, 1.6, env.stroke);
  line(ctx, env, 0.16, -hh + 0.35, 0.16, hh * 0.15 - 0.35, 1.6, env.stroke);
  line(ctx, env, -w * 0.2, hh - 0.25, w * 0.2, hh - 0.25, 1.6, env.stroke);
}

function drawSinkIsland(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.1);
  outline(ctx, env, -hw + 0.16, -hh + 0.16, w - 0.32, h - 0.32, 0.08, 0.9);

  // Twin basins toward the top edge.
  const basinW = Math.min(1.15, w * 0.2);
  const basinH = Math.min(1.5, h * 0.45);
  const by = -hh + (h - basinH) * 0.34;
  outline(ctx, env, -basinW - 0.08, by, basinW, basinH, 0.1, 1.3);
  outline(ctx, env, 0.08, by, basinW, basinH, 0.1, 1.3);
  circle(ctx, env, -basinW / 2 - 0.08, by + basinH / 2, 0.09, { stroke: env.detail, width: 0.9 });
  circle(ctx, env, basinW / 2 + 0.08, by + basinH / 2, 0.09, { stroke: env.detail, width: 0.9 });
  // Faucet.
  line(ctx, env, 0, by - 0.05, 0, by - 0.4, 1.6, env.stroke);
}

function drawDishwasher(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Control fascia along the top of the door, then the door panel.
  const fascia = h * 0.2;
  line(ctx, env, -hw, hh - fascia, hw, hh - fascia, 1.1);
  dial(ctx, env, 0, hh - fascia / 2, 0.07, 3, 0.4);
  outline(ctx, env, -hw + 0.12, -hh + 0.12, w - 0.24, h - fascia - 0.2, 0.05, 1);
  line(ctx, env, -w * 0.22, hh - fascia - 0.22, w * 0.22, hh - fascia - 0.22, 1.6, env.stroke);
}

function drawMicrowave(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Door glass on the left, control column on the right.
  const ctrl = w * 0.24;
  line(ctx, env, hw - ctrl, -hh, hw - ctrl, hh, 1.1);
  outline(ctx, env, -hw + 0.1, -hh + 0.1, w - ctrl - 0.2, h - 0.2, 0.05, 1);
  dial(ctx, env, hw - ctrl / 2, 0, 0.06, 2, 0.26);
}

function drawRangeHood(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Overhead unit: dashed so it does not read as a floor obstruction.
  dashRect(ctx, env, -hw, -hh, w, h, 0.06, 5, 1.5);
  // Canopy taper and filter grille.
  poly(ctx, env, [
    [-hw + 0.25, hh],
    [hw - 0.25, hh],
    [hw, -hh],
    [-hw, -hh],
  ], { close: true, stroke: env.detail, width: 1 });
  ribs(ctx, env, -hw + 0.3, -hh + h * 0.4, w - 0.6, h * 0.5, 5, true, 0.8);
}

function drawWallCabinets(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Overhead cabinetry — dashed outline, door divisions inside.
  dashRect(ctx, env, -hw, -hh, w, h, 0.03, 5, 1.5);
  const doors = Math.max(2, Math.round(w / 1.5));
  for (let i = 1; i < doors; i += 1) {
    const x = -hw + (w * i) / doors;
    line(ctx, env, x, -hh, x, hh, 0.9);
  }
  for (let i = 0; i < doors; i += 1) {
    const x = -hw + (w * (i + 0.5)) / doors;
    line(ctx, env, x - 0.14, hh - 0.12, x + 0.14, hh - 0.12, 1.3, env.detail);
  }
}

function drawCornerCounter(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  const legW = Math.min(2, w * 0.5);
  const legH = Math.min(2, h * 0.5);
  // L-shaped worktop wrapping an inside corner.
  poly(ctx, env, [
    [-hw, -hh],
    [hw, -hh],
    [hw, -hh + legH],
    [-hw + legW, -hh + legH],
    [-hw + legW, hh],
    [-hw, hh],
  ], { fill: env.fill, stroke: env.stroke, width: 1.6 });
  // Counter lip along both room-facing edges.
  line(ctx, env, -hw + legW - 0.16, -hh + legH - 0.16, hw, -hh + legH - 0.16, 1);
  line(ctx, env, -hw + legW - 0.16, -hh + legH - 0.16, -hw + legW - 0.16, hh, 1);
  // Base cabinet divisions.
  ribs(ctx, env, -hw, -hh, legW, h, 2, false, 0.9);
  ribs(ctx, env, -hw + legW, -hh, w - legW, legH, 2, true, 0.9);
}

function drawPantry(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.04);
  // Shelves against the back, then the door swinging into the room.
  ribs(ctx, env, -hw, -hh, w, h * 0.5, 4, false, 0.9);
  line(ctx, env, -hw, hh - 0.06, hw, hh - 0.06, 1.4, env.stroke);
  arcSweep(ctx, env, -hw, hh, w * 0.85, -Math.PI / 2, 0, { width: 1, dashed: true });
}

function drawKitchenSink(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Single deep basin set toward the wall, with drainer grooves beside it.
  const bw = w * 0.52;
  const bh = h * 0.55;
  rrect(ctx, -bw / 2 - w * 0.1, -hh + h * 0.22, bw, bh, 0.1);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.4;
  ctx.stroke();
  circle(ctx, env, -w * 0.1, -hh + h * 0.22 + bh / 2, 0.09, { stroke: env.detail, width: 0.9 });
  ribs(ctx, env, w * 0.2, -hh + h * 0.25, w * 0.24, bh * 0.9, 4, true, 0.8);
  // Tap at the wall edge.
  line(ctx, env, -w * 0.1, -hh + 0.08, -w * 0.1, -hh + h * 0.2, 1.8, env.stroke);
}

function drawDoubleOven(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Two stacked doors, each with a full-width handle.
  line(ctx, env, -hw, 0, hw, 0, 1.2);
  for (const cy of [-h * 0.25, h * 0.25]) {
    outline(ctx, env, -hw + 0.12, cy - h * 0.19, w - 0.24, h * 0.34, 0.05, 1);
    line(ctx, env, -w * 0.3, cy + h * 0.13, w * 0.3, cy + h * 0.13, 1.6, env.stroke);
  }
  dial(ctx, env, 0, -hh + 0.14, 0.06, 3, 0.34);
}

function drawBreakfastBar(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Worktop occupies the back; stools tuck under the overhang at the front.
  const topH = h * 0.55;
  body(ctx, env, -hw, -hh, w, topH, 0.06);
  line(ctx, env, -hw, -hh + topH - 0.14, hw, -hh + topH - 0.14, 1);
  ribs(ctx, env, -hw, -hh, w, topH, Math.max(2, Math.round(w / 2.5)), true, 0.9);
  const stools = Math.max(2, Math.round(w / 2));
  const r = Math.min(0.62, (h - topH) * 0.42);
  for (let i = 0; i < stools; i += 1) {
    const x = -hw + (w * (i + 0.5)) / stools;
    circle(ctx, env, x, hh - r - 0.08, r, { fill: env.fill, stroke: env.stroke, width: 1.3 });
    circle(ctx, env, x, hh - r - 0.08, r * 0.35, { stroke: env.detail, width: 0.8 });
  }
}

function drawDiningRound(ctx, env) {
  const { w, h } = env;
  const r = Math.min(w, h) / 2;
  const chairR = r * 0.24;
  chairRing(ctx, env, 0, 0, r - chairR * 0.85, 4, chairR);
  circle(ctx, env, 0, 0, r * 0.62, { fill: env.fill, stroke: env.stroke, width: 1.6 });
  circle(ctx, env, 0, 0, r * 0.48, { stroke: env.detail, width: 1 });
}

function drawDining8(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  const tableW = w * 0.78;
  const tableH = h * 0.52;
  const chairR = Math.min(0.6, Math.min(w, h) * 0.13);
  // Three chairs per long side, one at each end.
  for (let i = 0; i < 3; i += 1) {
    const x = -tableW / 2 + (tableW * (i + 0.5)) / 3;
    circle(ctx, env, x, -hh + chairR, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });
    circle(ctx, env, x, hh - chairR, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });
  }
  circle(ctx, env, -hw + chairR, 0, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });
  circle(ctx, env, hw - chairR, 0, chairR, { fill: env.fill, stroke: env.stroke, width: 1.3 });
  body(ctx, env, -tableW / 2, -tableH / 2, tableW, tableH, 0.16);
  outline(ctx, env, -tableW / 2 + 0.18, -tableH / 2 + 0.18, tableW - 0.36, tableH - 0.36, 0.12);
}

function drawSideboard(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  const doors = Math.max(3, Math.round(w / 1.6));
  ribs(ctx, env, -hw, -hh, w, h, doors, true, 1.1);
  for (let i = 0; i < doors; i += 1) {
    const x = -hw + (w * (i + 0.5)) / doors;
    line(ctx, env, x, hh - 0.2, x, hh - 0.5, 1.5, env.stroke);
  }
}

function drawChinaCabinet(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Solid base with a dashed glazed hutch above it.
  body(ctx, env, -hw, -hh, w, h, 0.05);
  ribs(ctx, env, -hw, -hh, w, h, 2, true, 1.1);
  dashRect(ctx, env, -hw - 0.06, -hh - 0.06, w + 0.12, h * 0.6, 0.05, 4, 1.2);
  // Glazing bars in the hutch.
  ribs(ctx, env, -hw, -hh, w, h * 0.55, 4, true, 0.7);
  line(ctx, env, -hw, -hh + h * 0.28, hw, -hh + h * 0.28, 0.7);
}

export const KITCHEN_DRAWERS = {
  'kitchen-counter': drawKitchenCounter,
  'corner-counter': drawCornerCounter,
  'wall-cabinets': drawWallCabinets,
  'kitchen-sink': drawKitchenSink,
  'sink-island': drawSinkIsland,
  'stove': drawStove,
  'double-oven': drawDoubleOven,
  'range-hood': drawRangeHood,
  'microwave': drawMicrowave,
  'dishwasher': drawDishwasher,
  'refrigerator': drawRefrigerator,
  'pantry': drawPantry,
  'breakfast-bar': drawBreakfastBar,
  'dining-set': drawDiningSet,
  'dining-round': drawDiningRound,
  'dining-8': drawDining8,
  'sideboard': drawSideboard,
  'china-cabinet': drawChinaCabinet,
};

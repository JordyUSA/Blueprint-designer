/**
 * Living room plan symbols.
 *
 * Each function receives a context already translated to the item centre,
 * rotated, and scaled so 1 unit === 1 foot. Draw in local space spanning
 * [-w/2, w/2] x [-h/2, h/2]; by convention an item "faces" -y (up).
 */

import {
  body,
  circle,
  line,
  outline,
  ribs,
} from './primitives.js';

/** L-shaped sectional: long run along the top, short return down the right. */
function drawSectional(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  const armDepth = Math.min(3.2, h * 0.46);
  const returnW = Math.min(3.2, w * 0.36);

  // Outer L silhouette.
  ctx.beginPath();
  ctx.moveTo(-hw, -hh);
  ctx.lineTo(hw, -hh);
  ctx.lineTo(hw, hh);
  ctx.lineTo(hw - returnW, hh);
  ctx.lineTo(hw - returnW, -hh + armDepth);
  ctx.lineTo(-hw, -hh + armDepth);
  ctx.closePath();
  ctx.fillStyle = env.fill;
  ctx.fill();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.6;
  ctx.stroke();

  const backT = 0.55; // backrest thickness
  // Backrest along the top run and the right return.
  line(ctx, env, -hw, -hh + backT, hw - backT, -hh + backT, 1.2);
  line(ctx, env, hw - backT, -hh + backT, hw - backT, hh, 1.2);

  // Seat cushions on the long run.
  const seatY = -hh + backT;
  const seatH = armDepth - backT;
  const runW = w - returnW - 0.55;
  const cushions = Math.max(2, Math.round(runW / 2.4));
  for (let i = 1; i < cushions; i += 1) {
    const x = -hw + 0.5 + (runW - 0.5) * (i / cushions);
    line(ctx, env, x, seatY + 0.08, x, seatY + seatH - 0.08, 1);
  }
  // Cushions on the return.
  const retH = h - armDepth;
  const retCushions = Math.max(1, Math.round(retH / 2.4));
  for (let i = 1; i < retCushions; i += 1) {
    const y = -hh + armDepth + retH * (i / retCushions);
    line(ctx, env, hw - returnW + 0.08, y, hw - backT - 0.08, y, 1);
  }
  // Left arm.
  line(ctx, env, -hw + 0.5, -hh + backT, -hw + 0.5, -hh + armDepth, 1.2);
}

function drawSofa(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.3);

  const backT = Math.min(0.6, h * 0.28);
  const armW = Math.min(0.6, w * 0.12);
  line(ctx, env, -hw, -hh + backT, hw, -hh + backT, 1.2);
  line(ctx, env, -hw + armW, -hh + backT, -hw + armW, hh, 1.2);
  line(ctx, env, hw - armW, -hh + backT, hw - armW, hh, 1.2);

  const seatW = w - armW * 2;
  const cushions = Math.max(2, Math.round(seatW / 2.2));
  for (let i = 1; i < cushions; i += 1) {
    const x = -hw + armW + seatW * (i / cushions);
    line(ctx, env, x, -hh + backT + 0.08, x, hh - 0.08, 1);
  }
}

function drawArmchair(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.28);
  const backT = Math.min(0.5, h * 0.24);
  const armW = Math.min(0.5, w * 0.2);
  line(ctx, env, -hw, -hh + backT, hw, -hh + backT, 1.2);
  line(ctx, env, -hw + armW, -hh + backT, -hw + armW, hh, 1.2);
  line(ctx, env, hw - armW, -hh + backT, hw - armW, hh, 1.2);
  // Seat cushion.
  outline(ctx, env, -hw + armW + 0.1, -hh + backT + 0.1, w - armW * 2 - 0.2, h - backT - 0.25, 0.16);
}

function drawCoffeeTable(ctx, env) {
  const { w, h } = env;
  body(ctx, env, -w / 2, -h / 2, w, h, 0.2);
  outline(ctx, env, -w / 2 + 0.22, -h / 2 + 0.22, w - 0.44, h - 0.44, 0.14);
}

function drawMediaUnit(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.08);
  // Cabinet doors.
  ribs(ctx, env, -hw, -hh, w, h, Math.max(2, Math.round(w / 1.6)), true, 1);
  // Screen sitting on top, drawn as a thin bar toward the room.
  line(ctx, env, -w * 0.3, hh + 0.12, w * 0.3, hh + 0.12, 2.2, env.stroke);
}

function drawFloorLamp(ctx, env) {
  const { w, h } = env;
  const r = Math.min(w, h) / 2;
  circle(ctx, env, 0, 0, r, { fill: env.fill, stroke: env.stroke, width: 1.6 });
  circle(ctx, env, 0, 0, r * 0.42, { stroke: env.detail, width: 1 });
  // Cross braces read as the shade ribs.
  line(ctx, env, -r * 0.7, -r * 0.7, r * 0.7, r * 0.7, 0.9);
  line(ctx, env, r * 0.7, -r * 0.7, -r * 0.7, r * 0.7, 0.9);
}

export const LIVING_DRAWERS = {
  'sectional': drawSectional,
  'sofa': drawSofa,
  'armchair': drawArmchair,
  'coffee-table': drawCoffeeTable,
  'media-unit': drawMediaUnit,
  'floor-lamp': drawFloorLamp,
};

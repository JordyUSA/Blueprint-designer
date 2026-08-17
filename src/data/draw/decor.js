/**
 * Decor & utility plan symbols.
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

export const DECOR_DRAWERS = {
  'plant': drawPlant,
  'rug': drawRug,
  'stairs': drawStairs,
  'patio-table': drawPatioTable,
};

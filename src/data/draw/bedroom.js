/**
 * Bedroom plan symbols.
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

function drawBed(ctx, env, pillowCount) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.16);

  // Headboard at the top.
  const headH = Math.min(0.5, h * 0.09);
  rrect(ctx, -hw - 0.12, -hh - 0.12, w + 0.24, headH + 0.12, 0.1);
  ctx.fillStyle = env.stroke;
  ctx.fill();

  // Pillows.
  const pillowH = Math.min(1.5, h * 0.2);
  const gap = 0.18;
  const pw = (w - gap * (pillowCount + 1)) / pillowCount;
  for (let i = 0; i < pillowCount; i += 1) {
    const x = -hw + gap + i * (pw + gap);
    rrect(ctx, x, -hh + headH + 0.18, pw, pillowH, 0.18);
    ctx.strokeStyle = env.detail;
    ctx.lineWidth = env.lw * 1.2;
    ctx.stroke();
  }

  // Turned-down coverlet.
  const foldY = -hh + headH + pillowH + 0.5;
  line(ctx, env, -hw, foldY, hw, foldY, 1.3);
  line(ctx, env, -hw, foldY + 0.22, hw, foldY + 0.22, 0.9);
  // Foot blanket band.
  const bandY = hh - Math.min(1.6, h * 0.22);
  line(ctx, env, -hw, bandY, hw, bandY, 1.2);
}

const drawKingBed = (ctx, env) => drawBed(ctx, env, 2);
const drawQueenBed = (ctx, env) => drawBed(ctx, env, 2);

function drawNightstand(ctx, env) {
  const { w, h } = env;
  body(ctx, env, -w / 2, -h / 2, w, h, 0.08);
  line(ctx, env, -w / 2, 0, w / 2, 0, 1);
  circle(ctx, env, 0, -h * 0.25, Math.min(w, h) * 0.08, { stroke: env.detail, width: 1 });
  circle(ctx, env, 0, h * 0.25, Math.min(w, h) * 0.08, { stroke: env.detail, width: 1 });
}

function drawWardrobe(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  const doors = Math.max(2, Math.round(w / 2));
  ribs(ctx, env, -hw, -hh, w, h, doors, true, 1.1);
  // Hanging rail hinted along the back.
  line(ctx, env, -hw + 0.15, -hh + 0.2, hw - 0.15, -hh + 0.2, 0.9);
  // Handles.
  for (let i = 1; i < doors; i += 1) {
    const x = -hw + (w * i) / doors;
    line(ctx, env, x - 0.16, hh - 0.3, x - 0.16, hh - 0.7, 1.4, env.stroke);
    line(ctx, env, x + 0.16, hh - 0.3, x + 0.16, hh - 0.7, 1.4, env.stroke);
  }
}

function drawDesk(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.08);
  // Drawer pedestal on the right.
  const pedW = Math.min(1.5, w * 0.32);
  outline(ctx, env, hw - pedW - 0.1, -hh + 0.1, pedW, h - 0.2, 0.06);
  ribs(ctx, env, hw - pedW - 0.1, -hh + 0.1, pedW, h - 0.2, 3, false, 0.9);
  // Chair pull-in space hinted by an arc.
  ctx.beginPath();
  ctx.arc(-hw + (w - pedW) / 2, hh + 1.1, 0.95, Math.PI * 1.15, Math.PI * 1.85);
  ctx.strokeStyle = env.detail;
  ctx.lineWidth = env.lw;
  ctx.stroke();
}

export const BEDROOM_DRAWERS = {
  'bed-king': drawKingBed,
  'bed-queen': drawQueenBed,
  'nightstand': drawNightstand,
  'wardrobe': drawWardrobe,
  'desk': drawDesk,
};

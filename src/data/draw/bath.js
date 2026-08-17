/**
 * Bathroom plan symbols.
 *
 * Each function receives a context already translated to the item centre,
 * rotated, and scaled so 1 unit === 1 foot. Draw in local space spanning
 * [-w/2, w/2] x [-h/2, h/2]; by convention an item "faces" -y (up).
 */

import {
  body,
  circle,
  ellipse,
  line,
  ribs,
  rrect,
} from './primitives.js';

function drawVanity(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  ellipse(ctx, env, 0, 0.05, Math.min(w * 0.24, 0.95), Math.min(h * 0.3, 0.62), {
    stroke: env.stroke,
    width: 1.3,
  });
  circle(ctx, env, 0, 0.05, 0.08, { stroke: env.detail, width: 0.9 });
  line(ctx, env, 0, -hh + 0.14, 0, -hh + 0.42, 1.6, env.stroke);
  // Drawer bank on the left.
  ribs(ctx, env, -hw, -hh, w * 0.28, h, 3, false, 0.9);
}

function drawToilet(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  const tankH = Math.min(0.75, h * 0.3);
  // Tank at the wall side.
  body(ctx, env, -hw, -hh, w, tankH, 0.08);
  // Elongated bowl.
  ellipse(ctx, env, 0, -hh + tankH + (h - tankH) * 0.52, w * 0.42, (h - tankH) * 0.48, {
    fill: env.fill,
    stroke: env.stroke,
    width: 1.5,
  });
  ellipse(ctx, env, 0, -hh + tankH + (h - tankH) * 0.52, w * 0.26, (h - tankH) * 0.32, {
    stroke: env.detail,
    width: 1,
  });
  line(ctx, env, -w * 0.2, -hh + tankH, w * 0.2, -hh + tankH, 1);
}

function drawShower(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  // Glass enclosure on the two open sides.
  line(ctx, env, -hw, hh, hw, hh, 2, env.stroke);
  line(ctx, env, hw, -hh, hw, hh, 2, env.stroke);
  // Slope-to-drain lines.
  line(ctx, env, -hw, -hh, hw, hh, 0.9);
  line(ctx, env, hw, -hh, -hw, hh, 0.9);
  circle(ctx, env, 0, 0, Math.min(w, h) * 0.09, { stroke: env.stroke, width: 1.3 });
  // Shower head at the back corner.
  circle(ctx, env, -hw + 0.4, -hh + 0.4, 0.2, { stroke: env.detail, width: 1.1 });
}

function drawBathtub(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.12);
  // Inner basin, offset away from the tap end.
  const inset = 0.28;
  rrect(ctx, -hw + inset + 0.5, -hh + inset, w - inset * 2 - 0.5, h - inset * 2, 0.5);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.4;
  ctx.stroke();
  // Drain + tap at the left end.
  circle(ctx, env, -hw + 1.15, 0, 0.11, { stroke: env.detail, width: 1 });
  line(ctx, env, -hw + 0.14, -0.28, -hw + 0.14, 0.28, 1.8, env.stroke);
}

export const BATH_DRAWERS = {
  'vanity': drawVanity,
  'toilet': drawToilet,
  'shower': drawShower,
  'bathtub': drawBathtub,
};

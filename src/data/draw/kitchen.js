/**
 * Kitchen & dining plan symbols.
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

export const KITCHEN_DRAWERS = {
  'dining-set': drawDiningSet,
  'kitchen-counter': drawKitchenCounter,
  'stove': drawStove,
  'refrigerator': drawRefrigerator,
  'sink-island': drawSinkIsland,
};

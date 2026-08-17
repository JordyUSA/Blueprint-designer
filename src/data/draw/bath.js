/**
 * Bathroom plan symbols.
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
  drape,
  ellipse,
  hatch,
  line,
  poly,
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

/**
 * A standalone shower curtain: the rail, the drawn curtain hanging from it as
 * gathered fabric, and a dashed arc showing how far the curtain can travel.
 */
function drawShowerCurtain(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Rail: a single bold straight line, so it never reads as more fabric.
  const railY = -hh + h * 0.18;
  line(ctx, env, -hw, railY, hw, railY, 2.6, env.stroke);
  for (const sx of [-1, 1]) {
    line(ctx, env, sx * hw, railY - h * 0.16, sx * hw, railY + h * 0.16, 2, env.stroke);
  }
  // Hanging rings.
  const rings = Math.max(4, Math.round(w));
  for (let i = 0; i < rings; i += 1) {
    const x = -hw + 0.18 + ((w - 0.36) * i) / (rings - 1);
    circle(ctx, env, x, railY, Math.min(0.075, h * 0.16), { stroke: env.detail, width: 1 });
  }
  // Fabric below the rail: few, generous folds so they survive at plan scale.
  const folds = Math.max(3, Math.round(w * 0.9));
  drape(ctx, env, -hw, hh - h * 0.12, hw, hh - h * 0.12, h * 0.2, folds, 2);
  // Fold creases tying the hem back up to the rail.
  for (let i = 0; i <= folds * 2; i += 1) {
    const x = -hw + (w * i) / (folds * 2);
    line(ctx, env, x, railY + h * 0.1, x, hh - h * 0.16, 0.9);
  }
}

/** A bathtub with a shower over it: curtain rail plus the curtain drawn back. */
function drawTubShower(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Tub body with inner basin; tap and shower head at the left end.
  body(ctx, env, -hw, -hh, w, h, 0.12);
  const inset = 0.26;
  rrect(ctx, -hw + inset + 0.48, -hh + inset, w - inset * 2 - 0.48, h - inset * 2, 0.46);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.4;
  ctx.stroke();
  circle(ctx, env, -hw + 1.1, 0, 0.1, { stroke: env.detail, width: 1 });
  line(ctx, env, -hw + 0.13, -0.26, -hw + 0.13, 0.26, 1.8, env.stroke);
  circle(ctx, env, -hw + 0.42, -hh + 0.34, 0.17, { stroke: env.stroke, width: 1.2 });

  // Curtain rail spanning the full open side, drawn bold and straight.
  const railY = hh - 0.09;
  line(ctx, env, -hw, railY, hw, railY, 2.6, env.stroke);
  // Curtain drawn about two thirds across, with the rest bunched at the far end.
  const closedTo = hw - w * 0.34;
  drape(ctx, env, -hw + 0.05, railY + 0.16, closedTo, railY + 0.16, 0.13, 5, 1.8);
  drape(ctx, env, closedTo, railY + 0.16, hw - 0.05, railY + 0.16, 0.2, 4, 2);
  // Travel arc for the open remainder.
  arcSweep(ctx, env, -hw + 0.05, railY, w * 0.66, -0.1, 0.1, { width: 1, dashed: true });
}

function drawCornerShower(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Two straight walls at the back, curved glass front (quadrant tray).
  ctx.beginPath();
  ctx.moveTo(-hw, hh);
  ctx.lineTo(-hw, -hh);
  ctx.lineTo(hw, -hh);
  ctx.arc(-hw, -hh, w, 0, Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = env.fill;
  ctx.fill();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.6;
  ctx.stroke();
  // Slope-to-drain lines and the drain itself.
  line(ctx, env, -hw, -hh, hw * 0.5, hh * 0.5, 0.9);
  circle(ctx, env, -hw + w * 0.42, -hh + h * 0.42, Math.min(w, h) * 0.07, {
    stroke: env.stroke,
    width: 1.3,
  });
  // Shower head in the corner.
  circle(ctx, env, -hw + 0.34, -hh + 0.34, 0.16, { stroke: env.detail, width: 1.1 });
}

function drawDoubleVanity(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  // Two basins with taps, drawer bank between them.
  for (const sx of [-1, 1]) {
    const cx = sx * w * 0.26;
    ellipse(ctx, env, cx, 0.04, Math.min(w * 0.16, 0.85), Math.min(h * 0.3, 0.6), {
      stroke: env.stroke,
      width: 1.3,
    });
    circle(ctx, env, cx, 0.04, 0.075, { stroke: env.detail, width: 0.9 });
    line(ctx, env, cx, -hh + 0.12, cx, -hh + 0.4, 1.6, env.stroke);
  }
  ribs(ctx, env, -w * 0.1, -hh, w * 0.2, h, 3, false, 0.9);
}

function drawPedestalSink(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Oval bowl over a narrow pedestal foot.
  ellipse(ctx, env, 0, -hh + h * 0.42, hw * 0.92, h * 0.4, {
    fill: env.fill,
    stroke: env.stroke,
    width: 1.6,
  });
  ellipse(ctx, env, 0, -hh + h * 0.42, hw * 0.6, h * 0.26, { stroke: env.detail, width: 1 });
  circle(ctx, env, 0, -hh + h * 0.42, 0.075, { stroke: env.detail, width: 0.9 });
  line(ctx, env, 0, -hh + 0.06, 0, -hh + 0.24, 1.8, env.stroke);
  // Pedestal.
  poly(ctx, env, [
    [-hw * 0.32, -hh + h * 0.7],
    [hw * 0.32, -hh + h * 0.7],
    [hw * 0.42, hh],
    [-hw * 0.42, hh],
  ], { stroke: env.detail, width: 1.1 });
}

function drawBidet(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  const backH = Math.min(0.4, h * 0.2);
  body(ctx, env, -hw, -hh, w, backH, 0.06);
  ellipse(ctx, env, 0, -hh + backH + (h - backH) * 0.5, w * 0.44, (h - backH) * 0.48, {
    fill: env.fill,
    stroke: env.stroke,
    width: 1.5,
  });
  ellipse(ctx, env, 0, -hh + backH + (h - backH) * 0.5, w * 0.26, (h - backH) * 0.3, {
    stroke: env.detail,
    width: 1,
  });
  line(ctx, env, 0, -hh + backH, 0, -hh + backH + 0.16, 1.6, env.stroke);
}

function drawTowelRail(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Wall-mounted rail with a towel hanging over it.
  line(ctx, env, -hw, -hh + 0.05, hw, -hh + 0.05, 2, env.stroke);
  for (const sx of [-1, 1]) {
    line(ctx, env, sx * hw, -hh, sx * hw, -hh + 0.14, 1.6, env.stroke);
  }
  drape(ctx, env, -hw + 0.15, hh - 0.04, hw - 0.15, hh - 0.04, 0.06, 4, 1.2);
  const folds = 4;
  for (let i = 0; i <= folds; i += 1) {
    const x = -hw + 0.18 + ((w - 0.36) * i) / folds;
    line(ctx, env, x, -hh + 0.08, x, hh - 0.06, 0.7);
  }
}

function drawMedicineCabinet(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Wall unit above the basin — dashed, since it is not on the floor.
  dashRect(ctx, env, -hw, -hh, w, h, 0.04, 4, 1.5);
  line(ctx, env, 0, -hh, 0, hh, 0.9);
  // Mirrored doors: glint lines.
  for (const sx of [-1, 1]) {
    line(ctx, env, sx * w * 0.34, hh - 0.05, sx * w * 0.14, -hh + 0.05, 0.8);
  }
}

function drawJacuzzi(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.3);
  // Inner shell plus jet nozzles around it.
  const inset = Math.min(w, h) * 0.16;
  rrect(ctx, -hw + inset, -hh + inset, w - inset * 2, h - inset * 2, 0.5);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.4;
  ctx.stroke();
  const jets = 8;
  const rx = (w - inset * 2) / 2 - 0.12;
  const ry = (h - inset * 2) / 2 - 0.12;
  for (let i = 0; i < jets; i += 1) {
    const a = (i / jets) * Math.PI * 2 + Math.PI / 8;
    circle(ctx, env, Math.cos(a) * rx, Math.sin(a) * ry, 0.1, { stroke: env.detail, width: 1 });
  }
  circle(ctx, env, 0, 0, Math.min(w, h) * 0.07, { stroke: env.detail, width: 1 });
  // Seat step along one end.
  line(ctx, env, -hw + inset, hh - inset - 0.5, hw - inset, hh - inset - 0.5, 0.9);
}

function drawLinenCloset(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.04);
  // Stacked shelves plus a door swing.
  ribs(ctx, env, -hw, -hh, w, h * 0.62, 4, false, 0.9);
  line(ctx, env, -hw, hh - 0.06, hw, hh - 0.06, 1.4, env.stroke);
  arcSweep(ctx, env, hw, hh, w * 0.8, Math.PI, Math.PI * 1.5, { width: 1, dashed: true });
}

function drawBathMat(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  dashRect(ctx, env, -hw, -hh, w, h, 0.1, 4, 1.4);
  hatch(ctx, env, -hw + 0.06, -hh + 0.06, w - 0.12, h - 0.12, 0.2, Math.PI / 4, 0.7);
}

export const BATH_DRAWERS = {
  'vanity': drawVanity,
  'double-vanity': drawDoubleVanity,
  'pedestal-sink': drawPedestalSink,
  'toilet': drawToilet,
  'bidet': drawBidet,
  'shower': drawShower,
  'corner-shower': drawCornerShower,
  'shower-curtain': drawShowerCurtain,
  'bathtub': drawBathtub,
  'tub-shower': drawTubShower,
  'jacuzzi': drawJacuzzi,
  'towel-rail': drawTowelRail,
  'medicine-cabinet': drawMedicineCabinet,
  'linen-closet': drawLinenCloset,
  'bath-mat': drawBathMat,
};

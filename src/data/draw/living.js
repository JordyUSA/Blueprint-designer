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
  cushions,
  dashRect,
  hatch,
  line,
  outline,
  poly,
  ribs,
  rrect,
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

function drawLoveseat(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.28);
  const backT = Math.min(0.55, h * 0.26);
  const armW = Math.min(0.55, w * 0.13);
  line(ctx, env, -hw, -hh + backT, hw, -hh + backT, 1.2);
  line(ctx, env, -hw + armW, -hh + backT, -hw + armW, hh, 1.2);
  line(ctx, env, hw - armW, -hh + backT, hw - armW, hh, 1.2);
  cushions(ctx, env, -hw + armW, -hh + backT, w - armW * 2, h - backT, 2);
}

function drawRecliner(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Chair body occupies the back two-thirds; the footrest extends forward.
  const seatH = h * 0.66;
  body(ctx, env, -hw, -hh, w, seatH, 0.26);
  const backT = Math.min(0.5, seatH * 0.28);
  const armW = Math.min(0.5, w * 0.2);
  line(ctx, env, -hw, -hh + backT, hw, -hh + backT, 1.2);
  line(ctx, env, -hw + armW, -hh + backT, -hw + armW, -hh + seatH, 1.2);
  line(ctx, env, hw - armW, -hh + backT, hw - armW, -hh + seatH, 1.2);
  // Extended footrest, dashed because it only exists when reclined.
  dashRect(ctx, env, -hw + armW, -hh + seatH + 0.08, w - armW * 2, h - seatH - 0.16, 0.14, 4, 1.2);
}

function drawChaiseLounge(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.3);
  const backT = Math.min(0.5, h * 0.22);
  // Back runs along the top; one raised end acts as the headrest.
  line(ctx, env, -hw, -hh + backT, hw, -hh + backT, 1.2);
  const headW = w * 0.22;
  rrect(ctx, -hw + 0.06, -hh + 0.06, headW, h - 0.12, 0.24);
  ctx.strokeStyle = env.detail;
  ctx.lineWidth = env.lw * 1.2;
  ctx.stroke();
  cushions(ctx, env, -hw + headW, -hh + backT, w - headW, h - backT, 3);
}

function drawOttoman(ctx, env) {
  const { w, h } = env;
  body(ctx, env, -w / 2, -h / 2, w, h, 0.22);
  outline(ctx, env, -w / 2 + 0.18, -h / 2 + 0.18, w - 0.36, h - 0.36, 0.16);
  // Tufting.
  circle(ctx, env, 0, 0, Math.min(w, h) * 0.06, { stroke: env.detail, width: 0.9 });
}

function drawBookshelf(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Vertical bays, then a hint of book spines in each.
  const bays = Math.max(2, Math.round(w / 1.2));
  ribs(ctx, env, -hw, -hh, w, h, bays, true, 1.2);
  for (let i = 0; i < bays; i += 1) {
    const x0 = -hw + (w * i) / bays + 0.06;
    const bw = w / bays - 0.12;
    for (let s = 0; s < 4; s += 1) {
      const x = x0 + (bw * (s + 0.5)) / 4;
      line(ctx, env, x, -hh + 0.1, x, hh - 0.1, 0.7);
    }
  }
}

function drawConsoleTable(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  // Two shallow drawers across the top, then an open lower shelf.
  const drawerH = h * 0.42;
  line(ctx, env, -hw, -hh + drawerH, hw, -hh + drawerH, 1.2);
  line(ctx, env, 0, -hh, 0, -hh + drawerH, 1);
  for (const sx of [-1, 1]) {
    const cx = (sx * w) / 4;
    line(ctx, env, cx - 0.22, -hh + drawerH * 0.55, cx + 0.22, -hh + drawerH * 0.55, 1.5, env.stroke);
  }
  outline(ctx, env, -hw + 0.14, -hh + drawerH + 0.1, w - 0.28, h - drawerH - 0.24, 0.05, 1);
  // Legs at the four corners.
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      circle(ctx, env, sx * (hw - 0.14), sy * (hh - 0.14), 0.07, { stroke: env.detail, width: 0.9 });
    }
  }
}

function drawSideTable(ctx, env) {
  const { w, h } = env;
  const r = Math.min(w, h) / 2;
  circle(ctx, env, 0, 0, r, { fill: env.fill, stroke: env.stroke, width: 1.6 });
  circle(ctx, env, 0, 0, r * 0.55, { stroke: env.detail, width: 1 });
}

function drawTvWall(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // A wall-mounted screen: thin body against the wall plus a bracket stub.
  body(ctx, env, -hw, -hh, w, h, 0.04);
  line(ctx, env, -hw + 0.1, hh - 0.1, hw - 0.1, hh - 0.1, 1);
  poly(ctx, env, [
    [-w * 0.12, -hh],
    [w * 0.12, -hh],
    [w * 0.12, -hh - 0.22],
    [-w * 0.12, -hh - 0.22],
  ], { fill: env.stroke, stroke: null });
}

function drawFireplace(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Masonry surround, hatched, with the firebox opening toward the room.
  body(ctx, env, -hw, -hh, w, h, 0.04);
  hatch(ctx, env, -hw, -hh, w, h, 0.22, Math.PI / 4, 0.8);
  const fbW = w * 0.5;
  const fbH = h * 0.55;
  rrect(ctx, -fbW / 2, hh - fbH, fbW, fbH, 0.06);
  ctx.fillStyle = env.theme.wallFill;
  ctx.fill();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.5;
  ctx.stroke();
  // Hearth line on the room side.
  line(ctx, env, -fbW / 2 - 0.3, hh, fbW / 2 + 0.3, hh, 1.6, env.stroke);
}

function drawPianoUpright(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Keyboard band along the player side, with key ticks.
  const kbH = h * 0.3;
  const kbY = hh - kbH;
  rrect(ctx, -hw + 0.15, kbY, w - 0.3, kbH, 0.03);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.3;
  ctx.stroke();
  const keys = Math.max(8, Math.round(w * 4));
  for (let i = 1; i < keys; i += 1) {
    const x = -hw + 0.15 + ((w - 0.3) * i) / keys;
    line(ctx, env, x, kbY + 0.04, x, hh - 0.04, 0.6);
  }
  // Bench.
  dashRect(ctx, env, -w * 0.2, hh + 0.25, w * 0.4, 0.5, 0.06, 4, 1.2);
}

function drawGrandPiano(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Plan shape: keyboard across the near (bottom) end, a straight bass side up
  // the left, and one long curve sweeping round the tail back to the keyboard.
  ctx.beginPath();
  ctx.moveTo(-hw, hh);
  ctx.lineTo(-hw, -hh + h * 0.5);
  ctx.quadraticCurveTo(-hw, -hh, -hw + w * 0.42, -hh);
  ctx.bezierCurveTo(hw, -hh + h * 0.16, hw, hh - h * 0.42, hw * 0.42, hh);
  ctx.closePath();
  ctx.fillStyle = env.fill;
  ctx.fill();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.6;
  ctx.stroke();

  // Keyboard band along the straight near end.
  const kbW = w * 0.86;
  const kbH = Math.min(0.55, h * 0.12);
  rrect(ctx, -hw + 0.08, hh - kbH - 0.06, kbW, kbH, 0.03);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.3;
  ctx.stroke();
  const keys = Math.max(12, Math.round(kbW * 5));
  for (let i = 1; i < keys; i += 1) {
    const x = -hw + 0.08 + (kbW * i) / keys;
    line(ctx, env, x, hh - kbH - 0.02, x, hh - 0.1, 0.6);
  }
  // Lid hinge along the bass side and the three legs.
  line(ctx, env, -hw + 0.3, -hh + h * 0.28, -hw + 0.3, hh - kbH - 0.3, 0.9);
  circle(ctx, env, -hw + 0.4, hh - kbH - 0.35, 0.1, { stroke: env.detail, width: 0.9 });
  circle(ctx, env, hw * 0.3, hh - kbH - 0.35, 0.1, { stroke: env.detail, width: 0.9 });
  circle(ctx, env, -hw + w * 0.4, -hh + 0.4, 0.1, { stroke: env.detail, width: 0.9 });
}

function drawBarCart(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.08);
  // Lower shelf.
  outline(ctx, env, -hw + 0.12, -hh + 0.12, w - 0.24, h - 0.24, 0.06, 1);
  // Castors at the four corners.
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      circle(ctx, env, sx * (hw - 0.16), sy * (hh - 0.16), 0.08, { stroke: env.detail, width: 0.9 });
    }
  }
  // Handle.
  line(ctx, env, hw, -hh + 0.2, hw + 0.18, -hh + 0.2, 1.6, env.stroke);
  line(ctx, env, hw + 0.18, -hh + 0.2, hw + 0.18, hh - 0.2, 1.6, env.stroke);
  line(ctx, env, hw, hh - 0.2, hw + 0.18, hh - 0.2, 1.6, env.stroke);
}

export const LIVING_DRAWERS = {
  'sectional': drawSectional,
  'sofa': drawSofa,
  'loveseat': drawLoveseat,
  'chaise-lounge': drawChaiseLounge,
  'armchair': drawArmchair,
  'recliner': drawRecliner,
  'ottoman': drawOttoman,
  'coffee-table': drawCoffeeTable,
  'side-table': drawSideTable,
  'console-table': drawConsoleTable,
  'media-unit': drawMediaUnit,
  'tv-wall': drawTvWall,
  'bookshelf': drawBookshelf,
  'fireplace': drawFireplace,
  'piano-upright': drawPianoUpright,
  'grand-piano': drawGrandPiano,
  'bar-cart': drawBarCart,
  'floor-lamp': drawFloorLamp,
};

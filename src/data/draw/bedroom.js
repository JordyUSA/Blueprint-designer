/**
 * Bedroom plan symbols.
 *
 * Each function receives a context already translated to the item centre,
 * rotated, and scaled so 1 unit === 1 foot. Draw in local space spanning
 * [-w/2, w/2] x [-h/2, h/2]; by convention an item "faces" -y (up).
 */

import {
  arcSweep,
  body,
  circle,
  cushions,
  dashRect,
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

const drawTwinBed = (ctx, env) => drawBed(ctx, env, 1);
const drawFullBed = (ctx, env) => drawBed(ctx, env, 2);

function drawBunkBed(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // Lower bunk drawn solid, upper bunk dashed since it is overhead.
  drawBed(ctx, env, 1);
  dashRect(ctx, env, -hw - 0.1, -hh - 0.1, w + 0.2, h + 0.2, 0.12, 5, 1.2);
  // Ladder at the foot end.
  const lx = hw - 0.55;
  line(ctx, env, lx, hh - 1.5, lx, hh, 1.4, env.stroke);
  line(ctx, env, lx + 0.4, hh - 1.5, lx + 0.4, hh, 1.4, env.stroke);
  for (let i = 0; i < 4; i += 1) {
    const y = hh - 1.5 + (1.5 * i) / 3;
    line(ctx, env, lx, y, lx + 0.4, y, 1.1);
  }
}

function drawCrib(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.1);
  // Slatted side rails.
  const slats = Math.max(6, Math.round(h * 2.5));
  for (let i = 1; i < slats; i += 1) {
    const y = -hh + (h * i) / slats;
    line(ctx, env, -hw, y, -hw + 0.2, y, 0.8);
    line(ctx, env, hw - 0.2, y, hw, y, 0.8);
  }
  // Mattress.
  outline(ctx, env, -hw + 0.24, -hh + 0.24, w - 0.48, h - 0.48, 0.08, 1.1);
  // Pillow at the head.
  rrect(ctx, -hw + 0.45, -hh + 0.4, w - 0.9, h * 0.16, 0.14);
  ctx.strokeStyle = env.detail;
  ctx.lineWidth = env.lw;
  ctx.stroke();
}

function drawDresser(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  const banks = Math.max(2, Math.round(w / 1.7));
  ribs(ctx, env, -hw, -hh, w, h, banks, true, 1.2);
  // Three drawer courses per bank, with handles.
  for (let b = 0; b < banks; b += 1) {
    const x0 = -hw + (w * b) / banks;
    const bw = w / banks;
    for (let d = 1; d < 3; d += 1) {
      const y = -hh + (h * d) / 3;
      line(ctx, env, x0, y, x0 + bw, y, 0.9);
    }
    for (let d = 0; d < 3; d += 1) {
      const y = -hh + (h * (d + 0.5)) / 3;
      line(ctx, env, x0 + bw * 0.35, y, x0 + bw * 0.65, y, 1.5, env.stroke);
    }
  }
}

function drawChestDrawers(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  ribs(ctx, env, -hw, -hh, w, h, 4, false, 1);
  for (let d = 0; d < 4; d += 1) {
    const y = -hh + (h * (d + 0.5)) / 4;
    line(ctx, env, -w * 0.18, y, w * 0.18, y, 1.5, env.stroke);
  }
}

function drawDressingTable(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.06);
  // Mirror against the wall side.
  arcSweep(ctx, env, 0, -hh + 0.1, w * 0.3, Math.PI, Math.PI * 2, { width: 1.6, color: env.stroke });
  // Drawers either side of the knee space.
  const bw = w * 0.26;
  ribs(ctx, env, -hw, -hh, bw, h, 3, false, 0.9);
  ribs(ctx, env, hw - bw, -hh, bw, h, 3, false, 0.9);
  // Stool pulled out toward the room.
  circle(ctx, env, 0, hh + 0.55, 0.5, { fill: env.fill, stroke: env.stroke, width: 1.3 });
}

function drawChevalMirror(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.05);
  // Reflective face marked with diagonal glint lines.
  for (let i = 0; i < 3; i += 1) {
    const x = -hw + (w * (i + 1)) / 4;
    line(ctx, env, x - 0.12, hh - 0.06, x + 0.12, -hh + 0.06, 0.9);
  }
  // Tilting stand feet.
  line(ctx, env, -hw + 0.1, hh, -hw + 0.1, hh + 0.22, 1.3, env.stroke);
  line(ctx, env, hw - 0.1, hh, hw - 0.1, hh + 0.22, 1.3, env.stroke);
}

function drawBedBench(ctx, env) {
  const { w, h } = env;
  body(ctx, env, -w / 2, -h / 2, w, h, 0.14);
  cushions(ctx, env, -w / 2, -h / 2, w, h, 3);
}

function drawClosetSystem(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  // The carcass is real; the hanging zone is dashed because it is at rail height.
  body(ctx, env, -hw, -hh, w, h, 0.04);
  const shelfDepth = h * 0.45;
  line(ctx, env, -hw, -hh + shelfDepth, hw, -hh + shelfDepth, 1.2);
  // Shelf bays above the rail.
  ribs(ctx, env, -hw, -hh, w, shelfDepth, Math.max(3, Math.round(w / 1.6)), true, 0.9);
  // Hanging rail plus hanger ticks.
  const railY = -hh + shelfDepth + (h - shelfDepth) * 0.35;
  line(ctx, env, -hw + 0.12, railY, hw - 0.12, railY, 1.5, env.stroke);
  const hangers = Math.max(4, Math.round(w * 2));
  for (let i = 0; i < hangers; i += 1) {
    const x = -hw + 0.2 + ((w - 0.4) * i) / (hangers - 1);
    line(ctx, env, x, railY, x, railY + (h - shelfDepth) * 0.4, 0.7);
  }
}

function drawChangingTable(ctx, env) {
  const { w, h } = env;
  const hw = w / 2;
  const hh = h / 2;
  body(ctx, env, -hw, -hh, w, h, 0.07);
  // Contoured changing pad with raised sides.
  rrect(ctx, -hw + 0.18, -hh + 0.18, w - 0.36, h - 0.36, 0.2);
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.3;
  ctx.stroke();
  line(ctx, env, -hw + 0.18, 0, hw - 0.18, 0, 0.9);
  // Open storage shelf below.
  ribs(ctx, env, -hw, hh - 0.02, w, 0.02, 3, true, 0.8);
}

export const BEDROOM_DRAWERS = {
  'bed-king': drawKingBed,
  'bed-queen': drawQueenBed,
  'bed-full': drawFullBed,
  'bed-twin': drawTwinBed,
  'bunk-bed': drawBunkBed,
  'crib': drawCrib,
  'changing-table': drawChangingTable,
  'nightstand': drawNightstand,
  'dresser': drawDresser,
  'chest-drawers': drawChestDrawers,
  'wardrobe': drawWardrobe,
  'closet-system': drawClosetSystem,
  'dressing-table': drawDressingTable,
  'cheval-mirror': drawChevalMirror,
  'bed-bench': drawBedBench,
  'desk': drawDesk,
};

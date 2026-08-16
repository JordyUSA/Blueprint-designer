/**
 * Vector drawing routines for every furniture kind.
 *
 * Contract: each `draw(ctx, env)` is called with the canvas context already
 * translated to the item's center, rotated by its angle, and scaled so that
 * **1 unit === 1 foot**. Draw in local space spanning
 * [-w/2, w/2] x [-h/2, h/2]; by convention an item "faces" -y (up).
 *
 * `env` carries:
 *   w, h      item footprint in feet
 *   fill      body fill color
 *   stroke    outline color
 *   detail    secondary line color
 *   lw        world units per screen pixel — multiply for hairlines
 *   theme     full theme token object
 */

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

function rrect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}

function body(ctx, env, x, y, w, h, r = 0.15) {
  rrect(ctx, x, y, w, h, r);
  ctx.fillStyle = env.fill;
  ctx.fill();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.6;
  ctx.stroke();
}

function outline(ctx, env, x, y, w, h, r = 0.12, width = 1.1) {
  rrect(ctx, x, y, w, h, r);
  ctx.strokeStyle = env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
}

function line(ctx, env, x1, y1, x2, y2, width = 1.1, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color ?? env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
}

function circle(ctx, env, cx, cy, r, { fill, stroke, width = 1.2 } = {}) {
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(r, 0.001), 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = stroke ?? env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
}

function ellipse(ctx, env, cx, cy, rx, ry, { fill, stroke, width = 1.2 } = {}) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 0.001), Math.max(ry, 0.001), 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = stroke ?? env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
}

/** Evenly spaced parallel lines — cushions, treads, slats. */
function ribs(ctx, env, x, y, w, h, count, vertical = true, width = 1) {
  for (let i = 1; i < count; i += 1) {
    const f = i / count;
    if (vertical) line(ctx, env, x + w * f, y, x + w * f, y + h, width);
    else line(ctx, env, x, y + h * f, x + w, y + h * f, width);
  }
}

/* ------------------------------------------------------------------ *
 * Living room
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Bedroom
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Kitchen & dining
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Bathroom
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Decor & misc
 * ------------------------------------------------------------------ */

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

export const DRAWERS = {
  sectional: drawSectional,
  sofa: drawSofa,
  armchair: drawArmchair,
  'coffee-table': drawCoffeeTable,
  'media-unit': drawMediaUnit,
  'floor-lamp': drawFloorLamp,

  'bed-king': drawKingBed,
  'bed-queen': drawQueenBed,
  nightstand: drawNightstand,
  wardrobe: drawWardrobe,
  desk: drawDesk,

  'dining-set': drawDiningSet,
  'kitchen-counter': drawKitchenCounter,
  stove: drawStove,
  refrigerator: drawRefrigerator,
  'sink-island': drawSinkIsland,

  vanity: drawVanity,
  toilet: drawToilet,
  shower: drawShower,
  bathtub: drawBathtub,

  plant: drawPlant,
  rug: drawRug,
  stairs: drawStairs,
  'patio-table': drawPatioTable,
};

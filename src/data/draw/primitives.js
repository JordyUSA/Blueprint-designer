/**
 * Shared drawing primitives for furniture plan symbols.
 *
 * All coordinates are in FEET, in the item's local space: the canvas context
 * arrives already translated to the item centre, rotated by its angle, and
 * scaled so 1 unit === 1 foot. `env.lw` is one screen pixel expressed in world
 * units, so multiply by it for any stroke that should stay a constant on-screen
 * weight regardless of zoom.
 */

export function rrect(ctx, x, y, w, h, r) {
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

export function body(ctx, env, x, y, w, h, r = 0.15) {
  rrect(ctx, x, y, w, h, r);
  ctx.fillStyle = env.fill;
  ctx.fill();
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * 1.6;
  ctx.stroke();
}

export function outline(ctx, env, x, y, w, h, r = 0.12, width = 1.1) {
  rrect(ctx, x, y, w, h, r);
  ctx.strokeStyle = env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
}

export function line(ctx, env, x1, y1, x2, y2, width = 1.1, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color ?? env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
}

export function circle(ctx, env, cx, cy, r, { fill, stroke, width = 1.2 } = {}) {
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

export function ellipse(ctx, env, cx, cy, rx, ry, { fill, stroke, width = 1.2 } = {}) {
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
export function ribs(ctx, env, x, y, w, h, count, vertical = true, width = 1) {
  for (let i = 1; i < count; i += 1) {
    const f = i / count;
    if (vertical) line(ctx, env, x + w * f, y, x + w * f, y + h, width);
    else line(ctx, env, x, y + h * f, x + w, y + h * f, width);
  }
}

/* ------------------------------------------------------------------ *
 * Additional primitives for the wider symbol set
 * ------------------------------------------------------------------ */

/** Arbitrary polygon / polyline from a flat list of points. */
export function poly(ctx, env, pts, { close = true, fill, stroke, width = 1.6 } = {}) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke !== null) {
    ctx.strokeStyle = stroke ?? env.stroke;
    ctx.lineWidth = env.lw * width;
    ctx.stroke();
  }
}

/** A stroked arc, optionally dashed — cabinet door swings, curtain travel. */
export function arcSweep(ctx, env, cx, cy, r, a0, a1, { width = 1, dashed = false, color } = {}) {
  ctx.save();
  if (dashed) ctx.setLineDash([env.lw * 4, env.lw * 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(r, 0.001), a0, a1);
  ctx.strokeStyle = color ?? env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
  ctx.restore();
}

/**
 * Diagonal hatch clipped to a rectangle — masonry, louvres, firebox.
 * `angle` is in radians; `spacing` in feet.
 */
export function hatch(ctx, env, x, y, w, h, spacing = 0.25, angle = Math.PI / 4, width = 0.8) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const diag = Math.hypot(w, h);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  ctx.beginPath();
  // Sweep the band of parallel lines across the rect's diagonal extent.
  for (let t = -diag; t <= diag; t += spacing) {
    ctx.moveTo(x + w / 2 + dx * t - dy * diag, y + h / 2 + dy * t + dx * diag);
    ctx.lineTo(x + w / 2 + dx * t + dy * diag, y + h / 2 + dy * t - dx * diag);
  }
  ctx.strokeStyle = env.detail;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
  ctx.restore();
}

/** Dashed rounded rect — rugs, overhead units, anything not floor-mounted. */
export function dashRect(ctx, env, x, y, w, h, r = 0.08, dash = 4, width = 1.4, color) {
  ctx.save();
  ctx.setLineDash([env.lw * dash, env.lw * (dash * 0.7)]);
  rrect(ctx, x, y, w, h, r);
  ctx.strokeStyle = color ?? env.stroke;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
  ctx.restore();
}

/** A run of seat cushions as rounded rects inside a band. */
export function cushions(ctx, env, x, y, w, h, count, horizontal = true, gap = 0.08) {
  const n = Math.max(1, count);
  if (horizontal) {
    const cw = (w - gap * (n + 1)) / n;
    for (let i = 0; i < n; i += 1) {
      rrect(ctx, x + gap + i * (cw + gap), y + gap, cw, h - gap * 2, 0.12);
      ctx.strokeStyle = env.detail;
      ctx.lineWidth = env.lw;
      ctx.stroke();
    }
  } else {
    const ch = (h - gap * (n + 1)) / n;
    for (let i = 0; i < n; i += 1) {
      rrect(ctx, x + gap, y + gap + i * (ch + gap), w - gap * 2, ch, 0.12);
      ctx.strokeStyle = env.detail;
      ctx.lineWidth = env.lw;
      ctx.stroke();
    }
  }
}

/** Chairs evenly spaced around a circle — round tables, breakfast bars. */
export function chairRing(ctx, env, cx, cy, radius, count, chairR, startAngle = -Math.PI / 2) {
  for (let i = 0; i < count; i += 1) {
    const a = startAngle + (i / count) * Math.PI * 2;
    circle(ctx, env, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, chairR, {
      fill: env.fill,
      stroke: env.stroke,
      width: 1.3,
    });
  }
}

/** A row of small control dials — washer, dryer, oven, dishwasher fascias. */
export function dial(ctx, env, cx, cy, r, count = 3, spread) {
  const step = spread ?? r * 3;
  const x0 = cx - (step * (count - 1)) / 2;
  for (let i = 0; i < count; i += 1) {
    circle(ctx, env, x0 + i * step, cy, r, { stroke: env.detail, width: 1 });
  }
}

/**
 * A draped fabric run: a sine wave along the segment (x0,y0)->(x1,y1).
 * This is what makes a curtain read as cloth rather than a straight line.
 */
export function drape(ctx, env, x0, y0, x1, y1, amplitude = 0.16, folds = 7, width = 1.3) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const steps = Math.max(16, folds * 8);
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const off = Math.sin(t * Math.PI * folds) * amplitude;
    const px = x0 + ux * length * t + nx * off;
    const py = y0 + uy * length * t + ny * off;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = env.stroke;
  ctx.lineWidth = env.lw * width;
  ctx.stroke();
}

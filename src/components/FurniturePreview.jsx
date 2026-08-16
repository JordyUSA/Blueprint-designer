/**
 * A small canvas thumbnail of a furniture item, drawn with the very same
 * `draw` routine the main canvas uses. The library preview can therefore never
 * drift from what actually lands on the plan.
 */

import { useEffect, useRef } from 'react';
import { getTheme } from '../engine/theme.js';

export function FurniturePreview({ def, themeId, width = 64, height = 44 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !def?.draw) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    const theme = getTheme(themeId);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Fit the item's footprint into the thumbnail with a small margin.
    const pad = 5;
    const scale = Math.min((width - pad * 2) / def.w, (height - pad * 2) / def.h);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    def.draw(ctx, {
      w: def.w,
      h: def.h,
      theme,
      fill: theme.furnitureFill,
      stroke: theme.furnitureStroke,
      detail: theme.furnitureDetail,
      lw: 1 / scale, // one screen pixel, expressed in the item's local units
      item: { w: def.w, h: def.h, rot: 0 },
    });
    ctx.restore();
  }, [def, themeId, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-none"
      aria-hidden="true"
    />
  );
}

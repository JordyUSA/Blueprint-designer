/**
 * A small canvas thumbnail of a furniture item, drawn with the very same
 * `draw` routine the main canvas uses. The library preview can therefore never
 * drift from what actually lands on the plan.
 *
 * With 80 items in the library, drawing every card up front would mean 80
 * canvases painted on first render — and all of them repainting at once on a
 * theme switch. Instead a single shared IntersectionObserver defers each card's
 * paint until it is about to scroll into view, and a card that has already been
 * painted for the current theme is never repainted.
 */

import { memo, useEffect, useRef } from 'react';
import { getTheme } from '../engine/theme.js';

/**
 * One observer for every preview on the page. `rootMargin` starts the paint
 * slightly before a card appears, so scrolling never shows an empty tile.
 */
const drawCallbacks = new WeakMap();
let observer = null;

function getObserver() {
  if (observer) return observer;
  if (typeof IntersectionObserver === 'undefined') return null;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        drawCallbacks.get(entry.target)?.();
      }
    },
    { rootMargin: '200px 0px' },
  );
  return observer;
}

export const FurniturePreview = memo(function FurniturePreview({
  def,
  themeId,
  width = 64,
  height = 44,
}) {
  const canvasRef = useRef(null);
  // What is currently painted on this canvas, so a scroll-back is free.
  const paintedRef = useRef('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !def?.draw) return undefined;

    const key = `${def.kind}|${themeId}|${width}x${height}`;

    const paint = () => {
      if (paintedRef.current === key) return;
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
      paintedRef.current = key;
    };

    // A card already showing the right thing needs no observer round-trip.
    if (paintedRef.current === key) return undefined;

    const io = getObserver();
    if (!io) {
      // No IntersectionObserver (older browser, or a test environment) — just paint.
      paint();
      return undefined;
    }

    drawCallbacks.set(canvas, paint);
    io.observe(canvas);
    return () => {
      io.unobserve(canvas);
      drawCallbacks.delete(canvas);
    };
  }, [def, themeId, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-none"
      aria-hidden="true"
    />
  );
});

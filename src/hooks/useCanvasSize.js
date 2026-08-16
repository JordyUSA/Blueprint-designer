/**
 * Track a container's CSS size and the current device pixel ratio.
 *
 * The DPR listener matters when a window is dragged between monitors with
 * different scaling: `devicePixelRatio` changes with no resize event, and a
 * stale ratio makes every line blurry until the next resize.
 */

import { useEffect, useRef, useState } from 'react';

export function useCanvasSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0, dpr: 1 });
  const sizeRef = useRef(size);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let mediaQuery = null;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const rect = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const next = {
        width: Math.max(0, Math.round(rect.width)),
        height: Math.max(0, Math.round(rect.height)),
        dpr,
      };
      const prev = sizeRef.current;
      if (prev.width === next.width && prev.height === next.height && prev.dpr === next.dpr) {
        return;
      }
      sizeRef.current = next;
      setSize(next);
    };

    // Re-arm on every DPR change, since each media query only matches one ratio.
    const watchDpr = () => {
      mediaQuery?.removeEventListener('change', onDprChange);
      mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mediaQuery.addEventListener('change', onDprChange);
    };
    function onDprChange() {
      measure();
      watchDpr();
    }

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    watchDpr();
    measure();

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener('resize', measure);
      mediaQuery?.removeEventListener('change', onDprChange);
    };
  }, [ref]);

  return [size, sizeRef];
}

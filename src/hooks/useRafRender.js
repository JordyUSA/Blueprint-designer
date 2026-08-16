/**
 * On-demand animation frame scheduling.
 *
 * A free-running rAF loop would burn CPU while idle. Instead callers invoke
 * `requestRender()`, which coalesces any number of calls within a frame into a
 * single draw. During a drag every `pointermove` requests a render and the
 * browser naturally throttles us to one paint per frame.
 *
 * React 19 StrictMode double-invokes effects, so the pending handle is
 * cancelled *and* nulled on cleanup — otherwise two loops would run in dev.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

export function useRafRender(drawFn) {
  const handleRef = useRef(0);
  const drawRef = useRef(drawFn);

  // Keep the latest draw closure without re-creating `requestRender`.
  useLayoutEffect(() => {
    drawRef.current = drawFn;
  }, [drawFn]);

  const requestRender = useCallback(() => {
    if (handleRef.current) return;
    handleRef.current = requestAnimationFrame(() => {
      handleRef.current = 0;
      drawRef.current?.();
    });
  }, []);

  useEffect(
    () => () => {
      if (handleRef.current) cancelAnimationFrame(handleRef.current);
      handleRef.current = 0;
    },
    [],
  );

  return requestRender;
}

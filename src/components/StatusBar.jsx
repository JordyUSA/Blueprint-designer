/**
 * The bottom status bar.
 *
 * The X/Y readout is written imperatively by the canvas straight into the DOM
 * nodes registered here, so moving the mouse never re-renders React.
 */

import { memo } from 'react';
import { Crosshair, Frame, Layers, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { MAX_ZOOM, MIN_ZOOM } from '../engine/camera.js';
import { UNIT_IMPERIAL, UNIT_METRIC, formatArea } from '../engine/units.js';

const TOOL_HINTS = {
  select: 'Drag to move · handles scale · shift-click adds to selection · drag empty space to marquee',
  wall: 'Click and drag to draw a wall · Shift constrains to 45° · endpoints magnetise',
  door: 'Move over a wall, then click to drop a door',
  window: 'Move over a wall, then click to drop a window',
  room: 'Drag a rectangle to define a room · area is calculated automatically',
  pan: 'Drag to pan · scroll to zoom',
};

export const StatusBar = memo(function StatusBar({
  store,
  readoutRef,
  onZoomChange,
  onZoomFit,
}) {
  const { stats, units, zoomDisplay, tool } = store;
  const pct = Math.round(zoomDisplay * 100);

  return (
    <footer className="flex h-9 shrink-0 items-center gap-4 border-t border-slate-800 bg-slate-900/95 px-3 text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5 font-mono tabular-nums">
        <Crosshair size={12} className="text-slate-600" />
        <span className="text-slate-600">X</span>
        <span
          ref={(el) => {
            readoutRef.current.x = el;
          }}
          className="inline-block min-w-[54px] text-slate-300"
        >
          0′
        </span>
        <span className="text-slate-600">Y</span>
        <span
          ref={(el) => {
            readoutRef.current.y = el;
          }}
          className="inline-block min-w-[54px] text-slate-300"
        >
          0′
        </span>
      </span>

      <span className="h-4 w-px bg-slate-800" />

      <span className="flex items-center gap-1.5">
        <Frame size={12} className="text-slate-600" />
        <span className="font-mono tabular-nums text-slate-300">
          {formatArea(stats.area, units)}
        </span>
        <span className="hidden text-slate-600 sm:inline">total floor area</span>
      </span>

      <span className="flex items-center gap-1.5">
        <Layers size={12} className="text-slate-600" />
        <span className="font-mono tabular-nums text-slate-300">{stats.count}</span>
        <span className="hidden text-slate-600 sm:inline">objects</span>
      </span>

      <span className="hidden min-w-0 flex-1 truncate text-slate-600 lg:block">
        {TOOL_HINTS[tool]}
      </span>
      <span className="flex-1 lg:hidden" />

      {/* Units */}
      <div className="flex items-center gap-0.5 rounded-md bg-slate-800/70 p-0.5">
        {[
          { id: UNIT_IMPERIAL, label: 'ft-in' },
          { id: UNIT_METRIC, label: 'm' },
        ].map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => store.setUnits(u.id)}
            className={[
              'cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
              units === u.id ? 'bg-sky-500/25 text-sky-300' : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {u.label}
          </button>
        ))}
      </div>

      <span className="h-4 w-px bg-slate-800" />

      {/* Zoom */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title="Zoom out"
          onClick={() => onZoomChange(zoomDisplay / 1.25)}
          className="cursor-pointer rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          <ZoomOut size={13} />
        </button>
        <input
          type="range"
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          step={1}
          value={pct}
          onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
          className="w-24"
          title={`Zoom ${pct}%`}
          aria-label="Zoom level"
        />
        <button
          type="button"
          title="Zoom in"
          onClick={() => onZoomChange(zoomDisplay * 1.25)}
          className="cursor-pointer rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          <ZoomIn size={13} />
        </button>
        <button
          type="button"
          onClick={() => onZoomChange(1)}
          title="Reset to 100%"
          className="w-11 cursor-pointer rounded px-1 py-0.5 text-right font-mono tabular-nums text-slate-300 hover:bg-slate-800"
        >
          {pct}%
        </button>
        <button
          type="button"
          onClick={onZoomFit}
          title="Zoom to fit  (F)"
          className="cursor-pointer rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </footer>
  );
});

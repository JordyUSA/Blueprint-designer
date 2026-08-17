/**
 * Export options modal. Renders a live preview using the real renderer, so the
 * thumbnail is exactly what will be written to the file.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { EXPORT_SCALES, exportPng, renderToCanvas } from '../engine/exportImage.js';
import { THEME_LIST } from '../engine/theme.js';
import { ToggleRow } from './ui/widgets.jsx';
import { docBounds } from '../state/document.js';

export function ExportDialog({ store, onClose }) {
  const [scale, setScale] = useState(2);
  const [includeGrid, setIncludeGrid] = useState(false);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [themeId, setThemeId] = useState(store.themeId);
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef(null);

  const dimensions = useMemo(() => {
    const b = docBounds(store.doc);
    if (!b) return { w: 0, h: 0 };
    const wFeet = b.maxX - b.minX + 4;
    const hFeet = b.maxY - b.minY + 4;
    return {
      w: Math.ceil(wFeet * 20 * scale),
      h: Math.ceil(hFeet * 20 * scale),
    };
  }, [store.doc, scale]);

  // Draw the preview at a small fixed scale using the same render path.
  useEffect(() => {
    const host = previewRef.current;
    if (!host) return;
    const canvas = renderToCanvas(store.doc, {
      themeId,
      scale: 0.5,
      includeGrid,
      includeDimensions,
      units: store.units,
      transparent,
    });
    canvas.className = 'max-h-full max-w-full object-contain rounded';
    canvas.style.maxHeight = '210px';
    host.replaceChildren(canvas);
  }, [store.doc, store.units, themeId, includeGrid, includeDimensions, transparent]);

  const handleExport = async () => {
    setBusy(true);
    try {
      const result = await exportPng(store.doc, {
        themeId,
        scale,
        includeGrid,
        includeDimensions,
        units: store.units,
        transparent,
      });
      store.setNotice({
        kind: 'success',
        message: `Exported ${result.width} × ${result.height} px PNG.`,
      });
      onClose();
    } catch (err) {
      store.setNotice({ kind: 'error', message: err.message || 'Export failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-in w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
          <ImageIcon size={16} className="text-sky-400" />
          <h2 className="flex-1 text-sm font-semibold text-white">Export Blueprint Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X size={15} />
          </button>
        </header>

        <div className="grid h-[214px] place-items-center border-b border-slate-800 bg-slate-950/60 p-2">
          <div ref={previewRef} className="grid h-full w-full place-items-center" />
        </div>

        <div className="space-y-3 px-4 py-3">
          <div>
            <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Resolution
            </span>
            <div className="flex gap-1">
              {EXPORT_SCALES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setScale(s.value)}
                  className={[
                    'flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors',
                    scale === s.value
                      ? 'border-sky-500/60 bg-sky-500/15 text-sky-200'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-slate-600">
              ≈ {dimensions.w.toLocaleString()} × {dimensions.h.toLocaleString()} px
            </p>
          </div>

          <div>
            <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Theme
            </span>
            <div className="flex gap-1">
              {THEME_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={[
                    'flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors',
                    themeId === t.id
                      ? 'border-sky-500/60 bg-sky-500/15 text-sky-200'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white',
                  ].join(' ')}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-sm border border-slate-600"
                    style={{ background: t.bg }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-0.5 border-t border-slate-800 pt-2">
            <ToggleRow
              label="Show dimensions"
              hint="Wall lengths and room areas"
              checked={includeDimensions}
              onChange={setIncludeDimensions}
            />
            <ToggleRow
              label="Include grid"
              hint="Keeps the measurement grid in the image"
              checked={includeGrid}
              onChange={setIncludeGrid}
            />
            <ToggleRow
              label="Transparent background"
              hint="Drops the ground fill — useful for overlays"
              checked={transparent}
              onChange={setTransparent}
            />
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400 disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            Download PNG
          </button>
        </footer>
      </div>
    </div>
  );
}

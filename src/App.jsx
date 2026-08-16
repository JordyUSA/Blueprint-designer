/**
 * Application shell.
 *
 * Layout: toolbar / [sidebar | canvas | inspector] / status bar.
 * Owns the store and wires the panels together; all heavy interaction lives in
 * `CanvasStage`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, PanelLeftOpen, PanelRightOpen, X } from 'lucide-react';
import { CanvasStage } from './components/CanvasStage.jsx';
import { TopToolbar } from './components/TopToolbar.jsx';
import { LeftSidebar } from './components/LeftSidebar.jsx';
import { Inspector } from './components/Inspector.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { ExportDialog } from './components/ExportDialog.jsx';
import { useBlueprintStore } from './state/useBlueprintStore.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { exportJson, pickJsonFile } from './engine/exportImage.js';
import { fitToBounds, zoomAtCenter } from './engine/camera.js';
import { docBounds, makeFurniture } from './state/document.js';
import { ACTIONS } from './state/reducer.js';
import { screenToWorld } from './engine/camera.js';
import { snapPoint } from './engine/geometry.js';

export default function App() {
  const store = useBlueprintStore();
  const readoutRef = useRef({ x: null, y: null });
  const stageRef = useRef(null);

  const [showSidebar, setShowSidebar] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const { viewRef, repaint, setNotice, notice } = store;

  /** Current viewport size in CSS pixels. */
  const viewportSize = useCallback(() => {
    const el = stageRef.current;
    if (!el) return { width: 0, height: 0 };
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }, []);

  const handleZoomChange = useCallback(
    (nextZoom) => {
      viewRef.current = zoomAtCenter(viewRef.current, viewportSize(), nextZoom);
      repaint();
    },
    [repaint, viewRef, viewportSize],
  );

  const handleZoomFit = useCallback(() => {
    viewRef.current = fitToBounds(docBounds(store.docRef.current), viewportSize(), 72);
    repaint();
  }, [repaint, store.docRef, viewRef, viewportSize]);

  const handleZoomReset = useCallback(() => handleZoomChange(1), [handleZoomChange]);

  /** Click-to-spawn from the sidebar: place at the center of the viewport. */
  const handleSpawn = useCallback(
    (kind) => {
      const size = viewportSize();
      const world = screenToWorld(viewRef.current, {
        x: size.width / 2,
        y: size.height / 2,
      });
      const at = store.snapEnabled ? snapPoint(world, store.snapSize) : world;
      const item = makeFurniture(kind, at.x, at.y);
      store.dispatch({ type: ACTIONS.ADD, entities: item });
      store.selectOnly([item.id]);
    },
    [store, viewRef, viewportSize],
  );

  const handleSave = useCallback(() => {
    const name = exportJson(store.toJson(), store.doc.name);
    setNotice({ kind: 'success', message: `Saved ${name}.` });
  }, [setNotice, store]);

  const handleLoad = useCallback(async () => {
    const text = await pickJsonFile();
    if (text == null) return;
    if (store.loadJson(text)) {
      // Frame whatever was just loaded.
      requestAnimationFrame(() => handleZoomFit());
    }
  }, [handleZoomFit, store]);

  const handleExport = useCallback(() => setShowExport(true), []);

  useKeyboardShortcuts(store, {
    onSave: handleSave,
    onExport: handleExport,
    onZoomFit: handleZoomFit,
    onZoomReset: handleZoomReset,
  });

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 3600);
    return () => clearTimeout(id);
  }, [notice, setNotice]);

  return (
    <div className="no-select flex h-full w-full flex-col bg-slate-950 text-slate-200">
      <TopToolbar
        store={store}
        onExport={handleExport}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      <div className="relative flex min-h-0 flex-1">
        {showSidebar ? (
          <LeftSidebar
            store={store}
            onSpawn={handleSpawn}
            onCollapse={() => setShowSidebar(false)}
          />
        ) : (
          <EdgeToggle
            side="left"
            icon={PanelLeftOpen}
            label="Show asset library"
            onClick={() => setShowSidebar(true)}
          />
        )}

        <main ref={stageRef} className="relative min-w-0 flex-1">
          <CanvasStage store={store} readoutRef={readoutRef} />
        </main>

        {showInspector ? (
          <Inspector store={store} onCollapse={() => setShowInspector(false)} />
        ) : (
          <EdgeToggle
            side="right"
            icon={PanelRightOpen}
            label="Show inspector"
            onClick={() => setShowInspector(true)}
          />
        )}

        {notice ? (
          <div
            className={[
              'animate-fade-in pointer-events-auto absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2',
              'items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium shadow-2xl backdrop-blur',
              notice.kind === 'error'
                ? 'border-rose-500/50 bg-rose-950/90 text-rose-200'
                : 'border-sky-500/40 bg-slate-900/95 text-slate-200',
            ].join(' ')}
          >
            {notice.kind === 'error' ? (
              <AlertTriangle size={14} className="text-rose-400" />
            ) : (
              <Check size={14} className="text-sky-400" />
            )}
            {notice.message}
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="cursor-pointer rounded p-0.5 text-slate-500 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        ) : null}
      </div>

      <StatusBar
        store={store}
        readoutRef={readoutRef}
        onZoomChange={handleZoomChange}
        onZoomFit={handleZoomFit}
      />

      {showExport ? (
        <ExportDialog store={store} onClose={() => setShowExport(false)} />
      ) : null}
    </div>
  );
}

function EdgeToggle({ side, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        'absolute top-3 z-20 cursor-pointer rounded-lg border border-slate-700 bg-slate-900/90 p-2',
        'text-slate-400 shadow-lg backdrop-blur transition-colors hover:text-white',
        side === 'left' ? 'left-3' : 'right-3',
      ].join(' ')}
    >
      <Icon size={16} />
    </button>
  );
}

/**
 * The asset drawer: an Architecture tab (tools, room presets, wall/opening
 * settings) and a Furniture tab (searchable, collapsible categories with
 * drag-and-drop or click-to-spawn).
 */

import { memo, useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeftClose, Search, Sparkles, X } from 'lucide-react';
import { Panel } from './ui/widgets.jsx';
import { FurniturePreview } from './FurniturePreview.jsx';
import { CATEGORIES, groupByCategory, searchFurniture } from '../data/furniture.js';
import { ROOM_PRESETS } from '../data/roomPresets.js';
import { TOOLS } from './TopToolbar.jsx';
import { TOOL_ROOM } from '../state/useBlueprintStore.js';
import { DRAG_MIME } from './CanvasStage.jsx';
import { formatFeetInches } from '../engine/units.js';

const TABS = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'furniture', label: 'Furniture' },
];

export const LeftSidebar = memo(function LeftSidebar({ store, onSpawn, onCollapse }) {
  const [tab, setTab] = useState('furniture');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggleCategory = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const groups = useMemo(() => groupByCategory(searchFurniture(query)), [query]);

  const filteredPresets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || tab !== 'architecture') return ROOM_PRESETS;
    return ROOM_PRESETS.filter((p) => p.label.toLowerCase().includes(q));
  }, [query, tab]);

  const onDragStart = useCallback(
    (e, kind) => {
      // Firefox refuses to start a drag unless setData is called, and some
      // browsers block reading dataTransfer during dragover — hence the ref.
      e.dataTransfer.setData(DRAG_MIME, kind);
      e.dataTransfer.setData('text/plain', kind);
      e.dataTransfer.effectAllowed = 'copy';
      store.dragKindRef.current = kind;
    },
    [store],
  );

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900/80">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 px-2 pt-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'cursor-pointer rounded-t-lg px-3 py-2 text-xs font-medium transition-colors',
              tab === t.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCollapse}
          title="Hide sidebar"
          className="mb-1 cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="relative px-3 py-2.5">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'furniture' ? 'Search furniture…' : 'Search rooms…'}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-1.5 pr-7 pl-7 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-slate-200"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto pb-4">
        {tab === 'architecture' ? (
          <ArchitecturePanel
            store={store}
            presets={filteredPresets}
          />
        ) : (
          <>
            {groups.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">
                Nothing matches “{query}”.
              </p>
            ) : null}
            {groups.map((group) => {
              const isOpen = !collapsed.has(group.id);
              return (
                <div key={group.id} className="border-b border-slate-800/60 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-2.5 text-left hover:bg-slate-800/40"
                  >
                    {isOpen ? (
                      <ChevronDown size={14} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-500" />
                    )}
                    <span className="text-[11px] font-semibold tracking-wide text-slate-300">
                      {group.label}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-600">
                      {group.items.length}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                      {group.items.map((def) => (
                        <button
                          key={def.kind}
                          type="button"
                          draggable
                          onDragStart={(e) => onDragStart(e, def.kind)}
                          onDragEnd={() => {
                            store.dragKindRef.current = null;
                          }}
                          onClick={() => onSpawn(def.kind)}
                          title={`${def.label} — drag onto the plan, or click to place at center`}
                          className="group flex cursor-grab flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/40 p-2 transition-colors hover:border-sky-500/60 hover:bg-slate-800 active:cursor-grabbing"
                        >
                          <FurniturePreview def={def} themeId={store.themeId} />
                          <span className="line-clamp-1 text-[10px] font-medium text-slate-300 group-hover:text-white">
                            {def.label}
                          </span>
                          <span className="font-mono text-[9px] text-slate-600">
                            {formatFeetInches(def.w, { compact: true })} ×{' '}
                            {formatFeetInches(def.h, { compact: true })}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
});

function ArchitecturePanel({ store, presets }) {
  return (
    <>
      <Panel title="Drafting Tools">
        <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => store.setTool(t.id)}
              className={[
                'flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition-colors',
                store.tool === t.id
                  ? 'border-sky-500/60 bg-sky-500/15 text-sky-200'
                  : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800',
              ].join(' ')}
            >
              <t.icon size={15} strokeWidth={1.9} />
              <span className="flex-1 text-[11px] font-medium">{t.label}</span>
              <kbd className="rounded bg-slate-900/80 px-1 font-mono text-[9px] text-slate-500">
                {t.key}
              </kbd>
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Room Presets"
        action={
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <Sparkles size={11} /> drag on canvas
          </span>
        }
      >
        <div className="flex flex-col gap-1 px-3 pb-3">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                store.setRoomPreset(p.id);
                store.setTool(TOOL_ROOM);
              }}
              className={[
                'flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors',
                store.roomPreset === p.id
                  ? 'border-sky-500/60 bg-sky-500/15'
                  : 'border-slate-800 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800',
              ].join(' ')}
            >
              <span
                className="h-5 w-5 shrink-0 rounded border border-slate-600"
                style={{ background: p.tint ?? 'transparent' }}
              />
              <span className="flex-1 text-[11px] font-medium text-slate-200">{p.label}</span>
              <span className="font-mono text-[9px] text-slate-600">
                {p.w}′ × {p.h}′
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Reset">
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={store.loadTemplate}
            className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-[11px] font-medium text-slate-300 transition-colors hover:border-sky-500/60 hover:text-white"
          >
            Load 1-Bedroom Template
          </button>
        </div>
      </Panel>

      <div className="px-4 pt-1">
        <p className="text-[10px] leading-relaxed text-slate-600">
          Draw walls with click-and-drag. Hold <kbd className="text-slate-500">Shift</kbd> to
          constrain to 45°, and endpoints magnetise to existing walls so corners stay
          watertight. Doors and windows snap onto the nearest wall.
        </p>
      </div>
    </>
  );
}

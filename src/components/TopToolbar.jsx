/**
 * The top toolbar: tool selection, canvas toggles, history, and file actions.
 */

import { useCallback, useState } from 'react';
import {
  Blocks,
  Columns2,
  DoorOpen,
  Hand,
  Image as ImageIcon,
  Magnet,
  Minus,
  MousePointer2,
  Moon,
  Redo2,
  Ruler,
  Save,
  Sun,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { Divider, IconButton, TextButton } from './ui/widgets.jsx';
import {
  TOOL_DOOR,
  TOOL_PAN,
  TOOL_ROOM,
  TOOL_SELECT,
  TOOL_WALL,
  TOOL_WINDOW,
} from '../state/useBlueprintStore.js';
import { SNAP_SIZES } from '../engine/units.js';
import { THEME_BLUEPRINT, THEME_CAD } from '../engine/theme.js';

export const TOOLS = [
  { id: TOOL_SELECT, icon: MousePointer2, label: 'Select / Move', key: 'V' },
  { id: TOOL_WALL, icon: Minus, label: 'Draw Wall', key: 'W' },
  { id: TOOL_DOOR, icon: DoorOpen, label: 'Add Door', key: 'D' },
  { id: TOOL_WINDOW, icon: Columns2, label: 'Add Window', key: 'N' },
  { id: TOOL_ROOM, icon: Blocks, label: 'Add Room', key: 'M' },
  { id: TOOL_PAN, icon: Hand, label: 'Pan Canvas', key: 'H' },
];

export function TopToolbar({ store, onExport, onSave, onLoad }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = useCallback(() => {
    if (confirmClear) {
      store.clearCanvas();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  }, [confirmClear, store]);

  const isBlueprint = store.themeId === THEME_BLUEPRINT;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900/95 px-3 backdrop-blur">
      <div className="flex items-center gap-2 pr-1">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20">
          <Ruler size={17} strokeWidth={2.1} className="text-white" />
        </div>
        <div className="hidden leading-tight lg:block">
          <div className="text-[13px] font-semibold text-white">Blueprint Designer</div>
          <div className="text-[10px] text-slate-500">{store.doc.name}</div>
        </div>
      </div>

      <Divider />

      {/* Tools */}
      <div className="flex items-center gap-0.5 rounded-xl bg-slate-800/60 p-1 ring-1 ring-slate-700/60">
        {TOOLS.map((t) => (
          <IconButton
            key={t.id}
            icon={t.icon}
            label={`${t.label}  (${t.key})`}
            active={store.tool === t.id}
            onClick={() => store.setTool(t.id)}
          />
        ))}
      </div>

      <Divider />

      {/* Canvas toggles */}
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={Magnet}
          label={`Snap to grid  (G) — ${store.snapEnabled ? 'on' : 'off'}`}
          active={store.snapEnabled}
          onClick={() => store.setSnapEnabled(!store.snapEnabled)}
        />
        <select
          value={store.snapSize}
          onChange={(e) => store.setSnapSize(Number(e.target.value))}
          title="Snap increment"
          className="h-8 cursor-pointer rounded-lg border border-slate-700 bg-slate-800/60 px-1.5 text-[11px] text-slate-300 outline-none focus:border-sky-500"
        >
          {SNAP_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <IconButton
          icon={Ruler}
          label="Show wall dimensions"
          active={store.showDimensions}
          onClick={() => store.setShowDimensions(!store.showDimensions)}
        />
        <IconButton
          icon={isBlueprint ? Moon : Sun}
          label={`Theme: ${isBlueprint ? 'Classic Blueprint' : 'Modern CAD'}  (T)`}
          onClick={() => store.setThemeId(isBlueprint ? THEME_CAD : THEME_BLUEPRINT)}
        />
      </div>

      <Divider />

      {/* History */}
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={Undo2}
          label="Undo  (Ctrl+Z)"
          disabled={!store.canUndo}
          onClick={store.undo}
        />
        <IconButton
          icon={Redo2}
          label="Redo  (Ctrl+Shift+Z)"
          disabled={!store.canRedo}
          onClick={store.redo}
        />
        <IconButton
          icon={Trash2}
          label={confirmClear ? 'Click again to clear everything' : 'Clear canvas'}
          active={confirmClear}
          onClick={handleClear}
          className={confirmClear ? 'text-rose-300 ring-1 ring-rose-500/60' : ''}
        />
      </div>

      <div className="flex-1" />

      {/* File actions */}
      <div className="flex items-center gap-1">
        <TextButton icon={Upload} onClick={onLoad}>
          <span className="hidden xl:inline">Load</span>
        </TextButton>
        <TextButton icon={Save} onClick={onSave}>
          <span className="hidden xl:inline">Save JSON</span>
        </TextButton>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none"
        >
          <ImageIcon size={14} strokeWidth={2} />
          Export PNG
        </button>
      </div>
    </header>
  );
}

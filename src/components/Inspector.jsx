/**
 * The right-hand inspector.
 *
 * Fields are two-way bound to the selection and commit on blur/Enter, so a
 * typed edit produces exactly one history entry. With several items selected,
 * shared fields show "mixed" and edits are applied as deltas where that is the
 * only meaningful interpretation (position), or absolutely where it is not
 * (rotation, tint, label).
 */

import { memo, useCallback, useMemo } from 'react';
import { PanelRightClose, RotateCw, Trash2, Copy, FlipHorizontal2 } from 'lucide-react';
import { NumberField, Panel, SelectField, TextButton, TextField } from './ui/widgets.jsx';
import { ACTIONS } from '../state/reducer.js';
import { ROOM_PRESETS, TINT_SWATCHES, getRoomPreset } from '../data/roomPresets.js';
import { getFurniture } from '../data/furniture.js';
import { openingSpan, wallLength } from '../state/document.js';
import {
  METERS_PER_FOOT,
  UNIT_METRIC,
  formatArea,
  formatFeetInches,
  unitSuffix,
} from '../engine/units.js';

/** Convert stored feet to the number shown, and back, for the active unit. */
const toDisplay = (feet, units) =>
  units === UNIT_METRIC ? Math.round(feet * METERS_PER_FOOT * 1000) / 1000 : feet;
const fromDisplay = (value, units) =>
  units === UNIT_METRIC ? value / METERS_PER_FOOT : value;

export const Inspector = memo(function Inspector({ store, onCollapse }) {
  const { selectedEntities: items, units, dispatch } = store;
  const single = items.length === 1 ? items[0] : null;

  const patch = useCallback(
    (id, changes) => dispatch({ type: ACTIONS.UPDATE, id, patch: changes }),
    [dispatch],
  );

  const patchAll = useCallback(
    (build) => {
      const patches = new Map();
      for (const item of items) {
        const p = build(item);
        if (p) patches.set(item.id, p);
      }
      if (patches.size) dispatch({ type: ACTIONS.UPDATE_MANY, patches });
    },
    [dispatch, items],
  );

  /* Aggregate values across the selection: a number when every item agrees. */
  const agg = useMemo(() => {
    const read = (fn) => {
      const values = items.map(fn).filter((v) => v !== undefined);
      if (!values.length) return { value: 0, mixed: false, absent: true };
      const first = values[0];
      const mixed = values.some((v) => Math.abs(v - first) > 1e-6);
      return { value: first, mixed, absent: false };
    };
    return {
      x: read((i) => (i.entity === 'wall' ? i.a.x : i.entity === 'opening' ? undefined : i.x)),
      y: read((i) => (i.entity === 'wall' ? i.a.y : i.entity === 'opening' ? undefined : i.y)),
      w: read((i) => (i.entity === 'furniture' || i.entity === 'room' ? i.w : undefined)),
      h: read((i) => (i.entity === 'furniture' || i.entity === 'room' ? i.h : undefined)),
      rot: read((i) => (i.entity === 'furniture' ? i.rot : undefined)),
    };
  }, [items]);

  if (!items.length) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-slate-800 bg-slate-900/80">
        <InspectorHeader title="Inspector" onCollapse={onCollapse} />
        <div className="thin-scroll flex-1 overflow-y-auto px-4 py-6">
          <p className="text-xs leading-relaxed text-slate-500">
            Select an object on the plan to edit its exact position, size, angle, tint and
            label.
          </p>
          <h4 className="mt-6 mb-2 text-[10px] font-semibold tracking-[0.12em] text-slate-600 uppercase">
            Shortcuts
          </h4>
          <dl className="space-y-1.5">
            {[
              ['R', 'Rotate 45°'],
              ['Del', 'Delete selection'],
              ['Ctrl + D', 'Duplicate'],
              ['Ctrl + C / V', 'Copy / paste'],
              ['Ctrl + A', 'Select all'],
              ['Esc', 'Deselect'],
              ['Arrows', 'Nudge'],
              ['Space + drag', 'Pan'],
              ['Shift + drag', 'Constrain 45°'],
              ['Alt + drag', 'Ignore snapping'],
              ['0 / F', 'Zoom 100% / fit'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <dt>
                  <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    {k}
                  </kbd>
                </dt>
                <dd className="text-[11px] text-slate-500">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    );
  }

  const suffix = unitSuffix(units);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-slate-800 bg-slate-900/80">
      <InspectorHeader
        title={
          single
            ? titleFor(single)
            : `${items.length} objects selected`
        }
        subtitle={single ? single.id : undefined}
        onCollapse={onCollapse}
      />

      <div className="thin-scroll flex-1 overflow-y-auto pb-6">
        {/* Position */}
        {!agg.x.absent ? (
          <Panel title="Position">
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
              <NumberField
                label="X"
                suffix={suffix}
                mixed={agg.x.mixed}
                value={toDisplay(agg.x.value, units)}
                onCommit={(v) => {
                  const target = fromDisplay(v, units);
                  const delta = target - agg.x.value;
                  patchAll((i) =>
                    i.entity === 'wall'
                      ? { a: { ...i.a, x: i.a.x + delta }, b: { ...i.b, x: i.b.x + delta } }
                      : i.entity === 'opening'
                        ? null
                        : { x: i.x + delta },
                  );
                }}
              />
              <NumberField
                label="Y"
                suffix={suffix}
                mixed={agg.y.mixed}
                value={toDisplay(agg.y.value, units)}
                onCommit={(v) => {
                  const target = fromDisplay(v, units);
                  const delta = target - agg.y.value;
                  patchAll((i) =>
                    i.entity === 'wall'
                      ? { a: { ...i.a, y: i.a.y + delta }, b: { ...i.b, y: i.b.y + delta } }
                      : i.entity === 'opening'
                        ? null
                        : { y: i.y + delta },
                  );
                }}
              />
            </div>
          </Panel>
        ) : null}

        {/* Size */}
        {!agg.w.absent ? (
          <Panel title="Dimensions">
            <div className="grid grid-cols-2 gap-2 px-3 pb-1">
              <NumberField
                label="Width"
                suffix={suffix}
                min={0.25}
                mixed={agg.w.mixed}
                value={toDisplay(agg.w.value, units)}
                onCommit={(v) =>
                  patchAll((i) =>
                    i.entity === 'furniture' || i.entity === 'room'
                      ? { w: Math.max(0.25, fromDisplay(v, units)) }
                      : null,
                  )
                }
              />
              <NumberField
                label="Height"
                suffix={suffix}
                min={0.25}
                mixed={agg.h.mixed}
                value={toDisplay(agg.h.value, units)}
                onCommit={(v) =>
                  patchAll((i) =>
                    i.entity === 'furniture' || i.entity === 'room'
                      ? { h: Math.max(0.25, fromDisplay(v, units)) }
                      : null,
                  )
                }
              />
            </div>
            {single && single.entity === 'room' ? (
              <p className="px-3 pb-3 font-mono text-[10px] text-slate-500">
                Area {formatArea(Math.abs(single.w * single.h), units)}
              </p>
            ) : (
              <div className="pb-2" />
            )}
          </Panel>
        ) : null}

        {/* Rotation */}
        {!agg.rot.absent ? (
          <Panel title="Rotation">
            <div className="flex items-end gap-2 px-3 pb-3">
              <div className="flex-1">
                <NumberField
                  label="Angle"
                  suffix="°"
                  step={1}
                  mixed={agg.rot.mixed}
                  value={Math.round(agg.rot.value * 10) / 10}
                  onCommit={(v) =>
                    patchAll((i) => (i.entity === 'furniture' ? { rot: v } : null))
                  }
                />
              </div>
              <button
                type="button"
                title="Rotate 45°"
                onClick={() =>
                  patchAll((i) => (i.entity === 'furniture' ? { rot: i.rot + 45 } : null))
                }
                className="mb-px inline-flex h-[26px] cursor-pointer items-center gap-1 rounded-md border border-slate-700 bg-slate-800/70 px-2 text-[11px] text-slate-300 hover:border-sky-500/60 hover:text-white"
              >
                <RotateCw size={12} /> 45°
              </button>
            </div>
            <div className="flex gap-1 px-3 pb-3">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() =>
                    patchAll((i) => (i.entity === 'furniture' ? { rot: deg } : null))
                  }
                  className="flex-1 cursor-pointer rounded-md border border-slate-700 bg-slate-800/50 py-1 font-mono text-[10px] text-slate-400 hover:border-sky-500/60 hover:text-white"
                >
                  {deg}°
                </button>
              ))}
            </div>
          </Panel>
        ) : null}

        {/* Type-specific */}
        {single?.entity === 'wall' ? (
          <Panel title="Wall">
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
              <NumberField
                label="Thickness"
                suffix={suffix}
                step={0.083}
                min={0.08}
                value={toDisplay(single.thickness, units)}
                onCommit={(v) =>
                  patch(single.id, { thickness: Math.max(0.08, fromDisplay(v, units)) })
                }
              />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium tracking-wide text-slate-500">
                  Length
                </span>
                <div className="rounded-md border border-slate-800 bg-slate-950/50 px-2 py-1 font-mono text-xs text-slate-400">
                  {formatFeetInches(wallLength(single), { compact: true })}
                </div>
              </div>
            </div>
            <div className="flex gap-1 px-3 pb-3">
              {[
                { label: 'Interior 5"', value: 0.42 },
                { label: 'Standard 6"', value: 0.5 },
                { label: 'Exterior 8"', value: 0.67 },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => patch(single.id, { thickness: p.value })}
                  className="flex-1 cursor-pointer rounded-md border border-slate-700 bg-slate-800/50 py-1 text-[10px] text-slate-400 hover:border-sky-500/60 hover:text-white"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Panel>
        ) : null}

        {single?.entity === 'opening' ? (
          <OpeningFields single={single} store={store} patch={patch} />
        ) : null}

        {single?.entity === 'room' ? (
          <Panel title="Room">
            <div className="px-3 pb-3">
              <SelectField
                label="Preset"
                value={single.preset}
                options={ROOM_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
                onChange={(id) => {
                  const preset = getRoomPreset(id);
                  patch(single.id, {
                    preset: id,
                    label: preset.label,
                    tint: preset.tint,
                  });
                }}
              />
            </div>
          </Panel>
        ) : null}

        {/* Label */}
        {single && single.entity !== 'wall' ? (
          <Panel title="Label">
            <div className="px-3 pb-3">
              <TextField
                label={single.entity === 'room' ? 'Room name' : 'Caption'}
                value={single.label ?? ''}
                placeholder={
                  single.entity === 'furniture' ? getFurniture(single.kind).label : 'Room'
                }
                onCommit={(v) => patch(single.id, { label: v })}
              />
            </div>
          </Panel>
        ) : null}

        {/* Tint */}
        {items.some((i) => i.entity === 'room' || i.entity === 'furniture') ? (
          <Panel title="Color Tint">
            <div className="grid grid-cols-9 gap-1 px-3 pb-3">
              {TINT_SWATCHES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  title={s.label}
                  onClick={() =>
                    patchAll((i) =>
                      i.entity === 'room' || i.entity === 'furniture'
                        ? { tint: s.value }
                        : null,
                    )
                  }
                  className="aspect-square cursor-pointer rounded border border-slate-700 transition-transform hover:scale-110 hover:border-sky-400"
                  style={{
                    background:
                      s.value ??
                      'repeating-linear-gradient(45deg,#334155 0 3px,#1e293b 3px 6px)',
                  }}
                />
              ))}
            </div>
          </Panel>
        ) : null}

        {/* Actions */}
        <Panel title="Actions">
          <div className="flex flex-wrap gap-1 px-3">
            <TextButton icon={Copy} onClick={() => store.duplicateSelection()}>
              Duplicate
            </TextButton>
            <TextButton
              icon={Trash2}
              onClick={store.deleteSelection}
              className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              Delete
            </TextButton>
          </div>
        </Panel>
      </div>
    </aside>
  );
});

function OpeningFields({ single, store, patch }) {
  const wall = store.doc.walls.find((w) => w.id === single.wallId);
  const span = wall ? openingSpan(wall, single) : null;
  const { units } = store;

  return (
    <Panel title={single.kind === 'door' ? 'Door' : 'Window'}>
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        <NumberField
          label="Width"
          suffix={unitSuffix(units)}
          min={0.5}
          value={toDisplay(single.width, units)}
          onCommit={(v) => patch(single.id, { width: Math.max(0.5, fromDisplay(v, units)) })}
        />
        <NumberField
          label="Along wall"
          suffix="%"
          step={1}
          min={0}
          max={100}
          value={Math.round(single.t * 1000) / 10}
          onCommit={(v) => patch(single.id, { t: Math.min(1, Math.max(0, v / 100)) })}
        />
      </div>
      {span && wall ? (
        <p className="px-3 pb-3 font-mono text-[10px] text-slate-500">
          {formatFeetInches(span.center, { compact: true })} from wall start ·{' '}
          {formatFeetInches(span.length, { compact: true })} wall
        </p>
      ) : null}
      {single.kind === 'door' ? (
        <div className="px-3 pb-3">
          <SelectField
            label="Style"
            value={single.style ?? 'swing'}
            options={[
              { value: 'swing', label: 'Swing door (leaf + arc)' },
              { value: 'cased', label: 'Cased opening (no door)' },
            ]}
            onChange={(v) => patch(single.id, { style: v })}
          />
        </div>
      ) : null}
      {single.kind === 'door' && (single.style ?? 'swing') === 'swing' ? (
        <div className="flex gap-1 px-3 pb-3">
          <button
            type="button"
            onClick={() => patch(single.id, { hinge: single.hinge === 'a' ? 'b' : 'a' })}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800/50 py-1.5 text-[10px] text-slate-400 hover:border-sky-500/60 hover:text-white"
          >
            <FlipHorizontal2 size={11} /> Flip hinge
          </button>
          <button
            type="button"
            onClick={() => patch(single.id, { swing: single.swing === 'in' ? 'out' : 'in' })}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800/50 py-1.5 text-[10px] text-slate-400 hover:border-sky-500/60 hover:text-white"
          >
            <RotateCw size={11} /> Flip swing
          </button>
        </div>
      ) : null}
    </Panel>
  );
}

function InspectorHeader({ title, subtitle, onCollapse }) {
  return (
    <div className="flex items-start gap-2 border-b border-slate-800 px-3 py-3">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xs font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="truncate font-mono text-[10px] text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCollapse}
        title="Hide inspector"
        className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
      >
        <PanelRightClose size={15} />
      </button>
    </div>
  );
}

function titleFor(entity) {
  switch (entity.entity) {
    case 'wall':
      return 'Wall';
    case 'room':
      return entity.label || 'Room';
    case 'opening':
      return entity.kind === 'door' ? 'Door' : 'Window';
    case 'furniture':
      return entity.label || getFurniture(entity.kind).label;
    default:
      return 'Object';
  }
}

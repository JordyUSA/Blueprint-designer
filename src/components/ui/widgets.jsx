/**
 * Shared UI primitives.
 *
 * Note for Tailwind v4: `border` no longer implies a gray border color
 * (the default is `currentColor`), and Preflight sets `button { cursor: default }`.
 * Every border and every button here therefore states its color and cursor.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export function IconButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
  badge,
  className = '',
  size = 16,
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        'relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg',
        'transition-colors duration-100 outline-none',
        'focus-visible:ring-2 focus-visible:ring-sky-400/70',
        disabled
          ? 'cursor-not-allowed text-slate-600'
          : active
            ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50'
            : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-100',
        className,
      ].join(' ')}
    >
      <Icon size={size} strokeWidth={1.9} />
      {badge ? (
        <span className="absolute -right-0.5 -bottom-0.5 rounded bg-sky-500 px-1 text-[9px] leading-[13px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function TextButton({ icon: Icon, children, onClick, disabled, active, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
        'transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70',
        disabled
          ? 'cursor-not-allowed text-slate-600'
          : active
            ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50'
            : 'text-slate-300 hover:bg-slate-700/60 hover:text-white',
        className,
      ].join(' ')}
    >
      {Icon ? <Icon size={14} strokeWidth={1.9} /> : null}
      {children}
    </button>
  );
}

export const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-slate-700/80" />;

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={className}>
      {title ? (
        <header className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <h3 className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
            {title}
          </h3>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/**
 * A numeric field that commits on Enter/blur (never per keystroke, so one edit
 * is one undo step) and supports drag-scrubbing its label.
 */
export function NumberField({
  label,
  value,
  onCommit,
  step = 0.25,
  min = -100000,
  max = 100000,
  suffix,
  disabled = false,
  mixed = false,
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const scrubRef = useRef(null);

  const shown = editing ? draft : mixed ? '' : formatNumber(value);

  const commit = useCallback(
    (raw) => {
      setEditing(false);
      const next = Number.parseFloat(raw);
      if (!Number.isFinite(next)) return;
      onCommit(clampNumber(next, min, max));
    },
    [max, min, onCommit],
  );

  // Drag-scrub on the label: a pointer drag adjusts the value continuously.
  const onScrubDown = useCallback(
    (e) => {
      if (disabled || mixed) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      scrubRef.current = { x: e.clientX, start: value, pointerId: e.pointerId };
    },
    [disabled, mixed, value],
  );

  const onScrubMove = useCallback(
    (e) => {
      const s = scrubRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      const delta = (e.clientX - s.x) * step;
      onCommit(clampNumber(roundTo(s.start + delta, step), min, max));
    },
    [max, min, onCommit, step],
  );

  const onScrubUp = useCallback((e) => {
    const s = scrubRef.current;
    if (s && e.currentTarget.hasPointerCapture?.(s.pointerId)) {
      e.currentTarget.releasePointerCapture(s.pointerId);
    }
    scrubRef.current = null;
  }, []);

  return (
    <label className="flex flex-col gap-1">
      <span
        onPointerDown={onScrubDown}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubUp}
        onPointerCancel={onScrubUp}
        className={[
          'text-[10px] font-medium tracking-wide text-slate-500 select-none',
          disabled || mixed ? '' : 'cursor-ew-resize hover:text-sky-400',
        ].join(' ')}
      >
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          disabled={disabled}
          value={shown}
          placeholder={mixed ? 'mixed' : undefined}
          onFocus={(e) => {
            setEditing(true);
            setDraft(mixed ? '' : formatNumber(value));
            e.currentTarget.select();
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setEditing(false);
              e.currentTarget.blur();
            }
            e.stopPropagation();
          }}
          className={[
            'w-full rounded-md border border-slate-700 bg-slate-900/70 py-1 pr-6 pl-2',
            'font-mono text-xs text-slate-100 tabular-nums',
            'outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40',
            'disabled:cursor-not-allowed disabled:text-slate-600',
          ].join(' ')}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

export function TextField({ label, value, onCommit, placeholder, disabled }) {
  const [draft, setDraft] = useState(value ?? '');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-wide text-slate-500">{label}</span>
      <input
        type="text"
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setEditing(true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== value) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          e.stopPropagation();
        }}
        className={[
          'w-full rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-100',
          'outline-none placeholder:text-slate-600',
          'focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40',
          'disabled:cursor-not-allowed disabled:text-slate-600',
        ].join(' ')}
      />
    </label>
  );
}

export function SelectField({ label, value, options, onChange, disabled }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'w-full cursor-pointer rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1',
          'text-xs text-slate-100 outline-none',
          'focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40',
        ].join(' ')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleRow({ label, checked, onChange, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between rounded-md px-1 py-1.5 text-left hover:bg-slate-700/40"
    >
      <span className="flex flex-col">
        <span className="text-xs text-slate-300">{label}</span>
        {hint ? <span className="text-[10px] text-slate-500">{hint}</span> : null}
      </span>
      <span
        className={[
          'relative h-4 w-7 shrink-0 rounded-full transition-colors',
          checked ? 'bg-sky-500' : 'bg-slate-700',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all',
            checked ? 'left-3.5' : 'left-0.5',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

/* --------------------------- helpers --------------------------- */

const clampNumber = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const roundTo = (v, step) => (step > 0 ? Math.round(v / step) * step : v);

function formatNumber(v) {
  if (!Number.isFinite(v)) return '';
  return String(Math.round(v * 1000) / 1000);
}

/**
 * Unit handling.
 *
 * The document model is stored in FEET as floating point numbers, always.
 * Metric is purely a *display* concern handled by the formatters below, so
 * switching units never mutates or rounds the underlying geometry.
 */

/** Pixels per foot at zoom === 1. Fixed reference scale for the whole app. */
export const PPF = 20;

export const METERS_PER_FOOT = 0.3048;
export const SQM_PER_SQFT = 0.09290304;

export const UNIT_IMPERIAL = 'imperial';
export const UNIT_METRIC = 'metric';

/** Snap increments offered in the toolbar, in feet. */
export const SNAP_SIZES = [
  { value: 1, label: '1 ft' },
  { value: 0.5, label: '6 in' },
  { value: 0.25, label: '3 in' },
];

/**
 * Format a length in feet as feet + inches, e.g. 12.5 -> `12' 6"`.
 * Inches are rounded to the nearest 1/2" and carried into feet when they
 * round up to 12.
 */
export function formatFeetInches(feet, { compact = false } = {}) {
  const sign = feet < 0 ? '-' : '';
  const abs = Math.abs(feet);
  let ft = Math.floor(abs);
  let inches = Math.round((abs - ft) * 12 * 2) / 2;
  if (inches >= 12) {
    ft += 1;
    inches -= 12;
  }
  const inchText = Number.isInteger(inches) ? String(inches) : inches.toFixed(1);
  if (inches === 0) return `${sign}${ft}'`;
  if (ft === 0) return `${sign}${inchText}"`;
  return compact ? `${sign}${ft}'${inchText}"` : `${sign}${ft}' ${inchText}"`;
}

/** Format a length in feet as metric text, e.g. 12.5 -> `3.81 m`. */
export function formatMeters(feet) {
  const meters = feet * METERS_PER_FOOT;
  if (Math.abs(meters) < 1) return `${Math.round(meters * 100)} cm`;
  return `${meters.toFixed(2)} m`;
}

/** Format a length in feet using the active unit system. */
export function formatLength(feet, units, opts) {
  return units === UNIT_METRIC
    ? formatMeters(feet)
    : formatFeetInches(feet, opts);
}

/** Format an area given in square feet using the active unit system. */
export function formatArea(squareFeet, units) {
  if (units === UNIT_METRIC) {
    return `${(squareFeet * SQM_PER_SQFT).toFixed(1)} m²`;
  }
  return `${Math.round(squareFeet).toLocaleString()} sq ft`;
}

/**
 * Short coordinate readout for the status bar. Keeps a fixed width so the
 * numbers do not jitter as the cursor moves.
 */
export function formatCoord(feet, units) {
  if (units === UNIT_METRIC) return `${(feet * METERS_PER_FOOT).toFixed(2)} m`;
  return formatFeetInches(feet, { compact: true });
}

/** Suffix shown next to numeric inputs in the inspector. */
export function unitSuffix(units) {
  return units === UNIT_METRIC ? 'm' : 'ft';
}

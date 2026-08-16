/**
 * Canvas theme tokens.
 *
 * Both themes expose exactly the same key set so the renderer can be written
 * once with zero hard-coded colors. Anything drawn on the canvas must pull its
 * color from here.
 */

export const THEME_BLUEPRINT = 'blueprint';
export const THEME_CAD = 'cad';

const blueprint = {
  id: THEME_BLUEPRINT,
  name: 'Classic Blueprint',
  dark: true,

  bg: '#0d2040',
  bgVignette: 'rgba(4, 12, 28, 0.55)',
  gridMinor: 'rgba(125, 211, 252, 0.09)',
  gridMajor: 'rgba(148, 220, 255, 0.20)',
  gridDecade: 'rgba(186, 235, 255, 0.34)',
  axis: 'rgba(56, 189, 248, 0.55)',

  wallFill: '#0d2040',
  wallStroke: '#e8f6ff',
  wallHatch: 'rgba(232, 246, 255, 0.16)',

  roomFill: 'rgba(56, 189, 248, 0.07)',
  roomStroke: 'rgba(125, 211, 252, 0.34)',
  roomLabel: '#e6f6ff',
  roomArea: 'rgba(190, 230, 255, 0.72)',

  furnitureFill: 'rgba(148, 214, 255, 0.13)',
  furnitureStroke: '#cbeaff',
  furnitureDetail: 'rgba(203, 234, 255, 0.55)',

  openingFill: '#0d2040',
  openingStroke: '#e8f6ff',
  doorArc: 'rgba(232, 246, 255, 0.5)',
  glazing: '#7dd3fc',

  text: '#e8f6ff',
  textMuted: 'rgba(200, 232, 255, 0.65)',
  labelBg: 'rgba(8, 22, 46, 0.86)',
  labelBorder: 'rgba(125, 211, 252, 0.35)',

  accent: '#38bdf8',
  selection: '#38bdf8',
  selectionFill: 'rgba(56, 189, 248, 0.12)',
  handle: '#f8fafc',
  handleStroke: '#0ea5e9',
  ghost: 'rgba(56, 189, 248, 0.9)',
  ghostFill: 'rgba(56, 189, 248, 0.14)',
  snapMarker: '#fbbf24',
  marqueeFill: 'rgba(56, 189, 248, 0.10)',
  marqueeStroke: 'rgba(125, 211, 252, 0.8)',
};

const cad = {
  id: THEME_CAD,
  name: 'Modern CAD',
  dark: false,

  bg: '#f6f7f9',
  bgVignette: 'rgba(15, 23, 42, 0.03)',
  gridMinor: 'rgba(15, 23, 42, 0.055)',
  gridMajor: 'rgba(15, 23, 42, 0.13)',
  gridDecade: 'rgba(15, 23, 42, 0.24)',
  axis: 'rgba(37, 99, 235, 0.4)',

  wallFill: '#ffffff',
  wallStroke: '#111827',
  wallHatch: 'rgba(17, 24, 39, 0.14)',

  roomFill: 'rgba(37, 99, 235, 0.05)',
  roomStroke: 'rgba(30, 64, 175, 0.22)',
  roomLabel: '#111827',
  roomArea: 'rgba(51, 65, 85, 0.72)',

  furnitureFill: 'rgba(15, 23, 42, 0.05)',
  furnitureStroke: '#1f2937',
  furnitureDetail: 'rgba(31, 41, 55, 0.5)',

  openingFill: '#ffffff',
  openingStroke: '#111827',
  doorArc: 'rgba(17, 24, 39, 0.42)',
  glazing: '#2563eb',

  text: '#0f172a',
  textMuted: 'rgba(51, 65, 85, 0.75)',
  labelBg: 'rgba(255, 255, 255, 0.92)',
  labelBorder: 'rgba(15, 23, 42, 0.14)',

  accent: '#2563eb',
  selection: '#2563eb',
  selectionFill: 'rgba(37, 99, 235, 0.09)',
  handle: '#ffffff',
  handleStroke: '#1d4ed8',
  ghost: 'rgba(37, 99, 235, 0.9)',
  ghostFill: 'rgba(37, 99, 235, 0.12)',
  snapMarker: '#ea580c',
  marqueeFill: 'rgba(37, 99, 235, 0.08)',
  marqueeStroke: 'rgba(37, 99, 235, 0.7)',
};

export const THEMES = {
  [THEME_BLUEPRINT]: blueprint,
  [THEME_CAD]: cad,
};

export const getTheme = (id) => THEMES[id] ?? blueprint;

export const THEME_LIST = [blueprint, cad];

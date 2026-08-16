/**
 * PNG export.
 *
 * The exporter builds an offscreen canvas sized to the document bounds and
 * calls the *same* `renderScene` used on screen, with a synthesized camera.
 * There is no duplicated drawing code, so the exported image cannot drift from
 * what the user sees.
 */

import { PPF } from './units.js';
import { renderScene } from './renderer.js';
import { getTheme } from './theme.js';
import { docBounds } from '../state/document.js';

/** Hard cap on either output dimension, to stay inside browser canvas limits. */
export const MAX_EXPORT_PX = 8000;

export const EXPORT_SCALES = [
  { value: 1, label: '1× — Draft' },
  { value: 2, label: '2× — Standard' },
  { value: 4, label: '4× — Print' },
];

/**
 * Render the document to a canvas at `scale` times the base resolution.
 * @returns {HTMLCanvasElement}
 */
export function renderToCanvas(doc, {
  themeId,
  scale = 2,
  includeGrid = false,
  paddingFeet = 2,
  units = 'imperial',
  transparent = false,
} = {}) {
  const bounds = docBounds(doc) ?? { minX: 0, minY: 0, maxX: 20, maxY: 20 };
  const minX = bounds.minX - paddingFeet;
  const minY = bounds.minY - paddingFeet;
  const wFeet = Math.max(bounds.maxX - bounds.minX + paddingFeet * 2, 1);
  const hFeet = Math.max(bounds.maxY - bounds.minY + paddingFeet * 2, 1);

  // Clamp so neither dimension exceeds the canvas limit.
  let pxPerFoot = PPF * scale;
  const longest = Math.max(wFeet, hFeet) * pxPerFoot;
  if (longest > MAX_EXPORT_PX) pxPerFoot *= MAX_EXPORT_PX / longest;

  const width = Math.max(1, Math.ceil(wFeet * pxPerFoot));
  const height = Math.max(1, Math.ceil(hFeet * pxPerFoot));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const theme = getTheme(themeId);
  // dpr === 1 and CSS size === pixel size keeps the transform math identical
  // to the on-screen path while producing a higher-resolution image.
  const view = {
    zoom: pxPerFoot / PPF,
    panX: -minX * pxPerFoot,
    panY: -minY * pxPerFoot,
  };

  renderScene(ctx, {
    doc,
    view,
    theme: transparent ? { ...theme, bg: 'rgba(0,0,0,0)' } : theme,
    size: { width, height, dpr: 1 },
    selection: new Set(),
    draft: null,
    units,
    options: {
      grid: includeGrid,
      labels: true,
      dimensions: true,
      chrome: false, // never bake selection handles into an export
      vignette: false,
    },
  });

  return canvas;
}

/** Trigger a browser download for a blob. */
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a beat to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export the document as a PNG download.
 * @returns {Promise<{ width:number, height:number }>}
 */
export function exportPng(doc, opts = {}) {
  const canvas = renderToCanvas(doc, opts);
  const filename =
    opts.filename ?? `${(doc.name || 'blueprint').replace(/[^\w-]+/g, '-').toLowerCase()}.png`;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not encode the image.'));
        return;
      }
      download(blob, filename);
      resolve({ width: canvas.width, height: canvas.height });
    }, 'image/png');
  });
}

/** Export the document as a .json blueprint download. */
export function exportJson(json, name) {
  const filename = `${(name || 'blueprint').replace(/[^\w-]+/g, '-').toLowerCase()}.json`;
  download(new Blob([json], { type: 'application/json' }), filename);
  return filename;
}

/** Open a file picker and resolve the chosen file's text, or null if cancelled. */
export function pickJsonFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
    // Cancelling a file dialog fires no event in most browsers; the element is
    // harmless if left behind, and is replaced on the next call.
    input.click();
  });
}

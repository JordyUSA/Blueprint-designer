/**
 * The furniture catalog: metadata plus a reference to each kind's vector
 * drawing routine. Default footprints are in feet and reflect real furniture
 * dimensions so a plan drawn with them is spatially honest.
 */

import { DRAWERS } from './furnitureDraw.js';

export const CATEGORIES = [
  { id: 'living', label: 'Living Room' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen & Dining' },
  { id: 'bath', label: 'Bathroom' },
  { id: 'decor', label: 'Decor & Misc' },
];

const CATALOG = [
  // Living room
  { kind: 'sectional', label: 'Sectional Sofa', category: 'living', w: 9, h: 7, keywords: 'couch l-shape lounge' },
  { kind: 'sofa', label: 'Sofa', category: 'living', w: 7, h: 3, keywords: 'couch settee loveseat' },
  { kind: 'coffee-table', label: 'Coffee Table', category: 'living', w: 4, h: 2, keywords: 'center table' },
  { kind: 'media-unit', label: 'Media Unit', category: 'living', w: 5, h: 1.5, keywords: 'tv console entertainment' },
  { kind: 'armchair', label: 'Armchair', category: 'living', w: 3, h: 3, keywords: 'accent chair seat' },
  { kind: 'floor-lamp', label: 'Floor Lamp', category: 'living', w: 1.5, h: 1.5, keywords: 'light lighting' },

  // Bedroom
  { kind: 'bed-king', label: 'King Bed', category: 'bedroom', w: 6.3, h: 6.6, keywords: 'mattress sleep' },
  { kind: 'bed-queen', label: 'Queen Bed', category: 'bedroom', w: 5, h: 6.6, keywords: 'mattress sleep' },
  { kind: 'nightstand', label: 'Nightstand', category: 'bedroom', w: 1.8, h: 1.5, keywords: 'bedside table' },
  { kind: 'wardrobe', label: 'Wardrobe', category: 'bedroom', w: 4, h: 2, keywords: 'closet armoire storage' },
  { kind: 'desk', label: 'Desk', category: 'bedroom', w: 4, h: 2, keywords: 'workstation office study' },

  // Kitchen & dining
  { kind: 'dining-set', label: 'Dining Table Set', category: 'kitchen', w: 6, h: 3.5, keywords: 'table chairs eat' },
  { kind: 'kitchen-counter', label: 'Kitchen Counter', category: 'kitchen', w: 8, h: 2, keywords: 'cabinet worktop base' },
  { kind: 'stove', label: 'Stove', category: 'kitchen', w: 2.5, h: 2.2, keywords: 'range oven cooktop hob' },
  { kind: 'refrigerator', label: 'Refrigerator', category: 'kitchen', w: 3, h: 2.5, keywords: 'fridge freezer cold' },
  { kind: 'sink-island', label: 'Sink Island', category: 'kitchen', w: 6, h: 3, keywords: 'basin worktop bar' },

  // Bathroom
  { kind: 'vanity', label: 'Vanity Sink', category: 'bath', w: 3, h: 1.8, keywords: 'basin washbasin lavatory' },
  { kind: 'toilet', label: 'Toilet', category: 'bath', w: 1.6, h: 2.5, keywords: 'wc lavatory commode' },
  { kind: 'shower', label: 'Walk-in Shower', category: 'bath', w: 3.5, h: 3.5, keywords: 'stall cubicle wet' },
  { kind: 'bathtub', label: 'Bathtub', category: 'bath', w: 5, h: 2.6, keywords: 'tub soak bath' },

  // Decor & misc
  { kind: 'plant', label: 'Houseplant', category: 'decor', w: 2, h: 2, keywords: 'greenery pot tree' },
  { kind: 'rug', label: 'Area Rug', category: 'decor', w: 8, h: 5, keywords: 'carpet mat floor' },
  { kind: 'stairs', label: 'Stairs', category: 'decor', w: 3.5, h: 10, keywords: 'staircase steps flight' },
  { kind: 'patio-table', label: 'Patio Table', category: 'decor', w: 4, h: 4, keywords: 'outdoor garden terrace' },
];

export const FURNITURE = CATALOG.map((item) => ({
  ...item,
  draw: DRAWERS[item.kind],
}));

const BY_KIND = new Map(FURNITURE.map((f) => [f.kind, f]));

/** Fallback definition so an unknown kind renders as a labelled box, not a crash. */
const FALLBACK = {
  kind: 'unknown',
  label: 'Object',
  category: 'decor',
  w: 3,
  h: 3,
  keywords: '',
  draw: (ctx, env) => {
    ctx.beginPath();
    ctx.rect(-env.w / 2, -env.h / 2, env.w, env.h);
    ctx.fillStyle = env.fill;
    ctx.fill();
    ctx.strokeStyle = env.stroke;
    ctx.lineWidth = env.lw * 1.6;
    ctx.stroke();
  },
};

export function getFurniture(kind) {
  return BY_KIND.get(kind) ?? { ...FALLBACK, kind: kind || 'unknown' };
}

/** Case-insensitive search across label, category label, and keywords. */
export function searchFurniture(query) {
  const q = query.trim().toLowerCase();
  if (!q) return FURNITURE;
  return FURNITURE.filter((f) => {
    const cat = CATEGORIES.find((c) => c.id === f.category)?.label ?? '';
    return `${f.label} ${cat} ${f.keywords}`.toLowerCase().includes(q);
  });
}

/** Group a furniture list into ordered category buckets, dropping empties. */
export function groupByCategory(items) {
  return CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((f) => f.category === cat.id),
  })).filter((g) => g.items.length > 0);
}

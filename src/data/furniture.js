/**
 * The furniture catalog: metadata plus a reference to each kind's vector
 * drawing routine. Default footprints are in feet and reflect real furniture
 * dimensions so a plan drawn with them is spatially honest.
 *
 * `keywords` exists so search finds an item by the words people actually type
 * ("laundry" for the washer, "ac" for the HVAC unit). With 80 items, that is
 * the difference between a usable library and an unusable one.
 */

import { DRAWERS } from './furnitureDraw.js';

export const CATEGORIES = [
  { id: 'living', label: 'Living Room' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen & Dining' },
  { id: 'bath', label: 'Bathroom' },
  { id: 'decor', label: 'Decor & Utility' },
];

const CATALOG = [
  /* ---------------- Living Room ---------------- */
  { kind: 'sectional', label: 'Sectional Sofa', category: 'living', w: 9, h: 7, keywords: 'couch l-shape lounge corner' },
  { kind: 'sofa', label: 'Sofa', category: 'living', w: 7, h: 3, keywords: 'couch settee three seater' },
  { kind: 'loveseat', label: 'Loveseat', category: 'living', w: 5, h: 3, keywords: 'couch two seater small sofa' },
  { kind: 'chaise-lounge', label: 'Chaise Lounge', category: 'living', w: 5.5, h: 2.8, keywords: 'daybed recliner lounger couch' },
  { kind: 'armchair', label: 'Armchair', category: 'living', w: 3, h: 3, keywords: 'accent chair seat' },
  { kind: 'recliner', label: 'Recliner', category: 'living', w: 3.2, h: 3.4, keywords: 'armchair lazy footrest' },
  { kind: 'ottoman', label: 'Ottoman', category: 'living', w: 2.5, h: 2.5, keywords: 'footstool pouf pouffe' },
  { kind: 'coffee-table', label: 'Coffee Table', category: 'living', w: 4, h: 2, keywords: 'center table low' },
  { kind: 'side-table', label: 'Side Table', category: 'living', w: 1.8, h: 1.8, keywords: 'end table accent round' },
  { kind: 'console-table', label: 'Console Table', category: 'living', w: 4, h: 1.4, keywords: 'hall sofa table narrow' },
  { kind: 'media-unit', label: 'Media Unit', category: 'living', w: 5, h: 1.5, keywords: 'tv console entertainment sideboard' },
  { kind: 'tv-wall', label: 'Wall-Mounted TV', category: 'living', w: 4, h: 0.6, keywords: 'television screen bracket flat' },
  { kind: 'bookshelf', label: 'Bookshelf', category: 'living', w: 3, h: 1, keywords: 'bookcase shelves library storage' },
  { kind: 'fireplace', label: 'Fireplace', category: 'living', w: 5, h: 1.8, keywords: 'hearth chimney firebox stove' },
  { kind: 'piano-upright', label: 'Upright Piano', category: 'living', w: 5, h: 2.2, keywords: 'music keyboard instrument' },
  { kind: 'grand-piano', label: 'Grand Piano', category: 'living', w: 5, h: 6, keywords: 'music keyboard baby grand instrument' },
  { kind: 'bar-cart', label: 'Bar Cart', category: 'living', w: 2.5, h: 1.5, keywords: 'trolley drinks serving' },
  { kind: 'floor-lamp', label: 'Floor Lamp', category: 'living', w: 1.5, h: 1.5, keywords: 'light lighting standard uplighter' },

  /* ---------------- Bedroom ---------------- */
  { kind: 'bed-king', label: 'King Bed', category: 'bedroom', w: 6.3, h: 6.6, keywords: 'mattress sleep double master' },
  { kind: 'bed-queen', label: 'Queen Bed', category: 'bedroom', w: 5, h: 6.6, keywords: 'mattress sleep double' },
  { kind: 'bed-full', label: 'Full / Double Bed', category: 'bedroom', w: 4.5, h: 6.4, keywords: 'mattress sleep double' },
  { kind: 'bed-twin', label: 'Twin / Single Bed', category: 'bedroom', w: 3.2, h: 6.4, keywords: 'mattress sleep single child' },
  { kind: 'bunk-bed', label: 'Bunk Bed', category: 'bedroom', w: 3.2, h: 6.4, keywords: 'kids children double decker ladder' },
  { kind: 'crib', label: 'Crib / Cot', category: 'bedroom', w: 2.5, h: 4.5, keywords: 'baby nursery infant bassinet' },
  { kind: 'changing-table', label: 'Changing Table', category: 'bedroom', w: 3, h: 1.8, keywords: 'baby nursery diaper infant' },
  { kind: 'nightstand', label: 'Nightstand', category: 'bedroom', w: 1.8, h: 1.5, keywords: 'bedside table cabinet' },
  { kind: 'dresser', label: 'Dresser', category: 'bedroom', w: 5, h: 1.8, keywords: 'drawers chest storage bureau' },
  { kind: 'chest-drawers', label: 'Chest of Drawers', category: 'bedroom', w: 3, h: 1.6, keywords: 'tallboy storage dresser' },
  { kind: 'wardrobe', label: 'Wardrobe', category: 'bedroom', w: 4, h: 2, keywords: 'closet armoire storage hanging' },
  { kind: 'closet-system', label: 'Walk-in Closet', category: 'bedroom', w: 6, h: 2, keywords: 'wardrobe shelving hanging rail storage' },
  { kind: 'dressing-table', label: 'Dressing Table', category: 'bedroom', w: 3.5, h: 1.6, keywords: 'vanity makeup mirror stool' },
  { kind: 'cheval-mirror', label: 'Cheval Mirror', category: 'bedroom', w: 1.8, h: 0.6, keywords: 'full length standing mirror' },
  { kind: 'bed-bench', label: 'Bed Bench', category: 'bedroom', w: 4, h: 1.5, keywords: 'ottoman seat end of bed' },
  { kind: 'desk', label: 'Desk', category: 'bedroom', w: 4, h: 2, keywords: 'workstation office study writing' },

  /* ---------------- Kitchen & Dining ---------------- */
  { kind: 'kitchen-counter', label: 'Counter Run', category: 'kitchen', w: 8, h: 2, keywords: 'cabinet worktop base units' },
  { kind: 'corner-counter', label: 'Corner Counter', category: 'kitchen', w: 4, h: 4, keywords: 'l-shape worktop cabinet base' },
  { kind: 'wall-cabinets', label: 'Wall Cabinets', category: 'kitchen', w: 6, h: 1.1, keywords: 'overhead upper cupboard storage' },
  { kind: 'kitchen-sink', label: 'Kitchen Sink', category: 'kitchen', w: 2.5, h: 2, keywords: 'basin tap faucet drainer' },
  { kind: 'sink-island', label: 'Sink Island', category: 'kitchen', w: 6, h: 3, keywords: 'basin worktop bar peninsula' },
  { kind: 'stove', label: 'Stove / Range', category: 'kitchen', w: 2.5, h: 2.2, keywords: 'oven cooktop hob burners cooker' },
  { kind: 'double-oven', label: 'Double Oven', category: 'kitchen', w: 2.5, h: 2.2, keywords: 'built in cooker stacked range' },
  { kind: 'range-hood', label: 'Range Hood', category: 'kitchen', w: 2.5, h: 1.6, keywords: 'extractor vent cooker canopy overhead' },
  { kind: 'microwave', label: 'Microwave', category: 'kitchen', w: 2, h: 1.4, keywords: 'oven appliance counter' },
  { kind: 'dishwasher', label: 'Dishwasher', category: 'kitchen', w: 2, h: 2.2, keywords: 'appliance washing dishes' },
  { kind: 'refrigerator', label: 'Refrigerator', category: 'kitchen', w: 3, h: 2.5, keywords: 'fridge freezer cold appliance' },
  { kind: 'pantry', label: 'Pantry', category: 'kitchen', w: 3, h: 2, keywords: 'larder cupboard food storage shelves' },
  { kind: 'breakfast-bar', label: 'Breakfast Bar', category: 'kitchen', w: 6, h: 2.5, keywords: 'island stools peninsula counter' },
  { kind: 'dining-set', label: 'Dining Table Set', category: 'kitchen', w: 6, h: 3.5, keywords: 'table chairs eat six' },
  { kind: 'dining-round', label: 'Round Dining Table', category: 'kitchen', w: 4.5, h: 4.5, keywords: 'table chairs circular four eat' },
  { kind: 'dining-8', label: 'Dining Table (8)', category: 'kitchen', w: 8, h: 3.5, keywords: 'table chairs eight long eat banquet' },
  { kind: 'sideboard', label: 'Sideboard', category: 'kitchen', w: 5, h: 1.6, keywords: 'buffet credenza server storage' },
  { kind: 'china-cabinet', label: 'China Cabinet', category: 'kitchen', w: 4, h: 1.6, keywords: 'dresser hutch display glazed' },

  /* ---------------- Bathroom ---------------- */
  { kind: 'vanity', label: 'Vanity Sink', category: 'bath', w: 3, h: 1.8, keywords: 'basin washbasin lavatory sink' },
  { kind: 'double-vanity', label: 'Double Vanity', category: 'bath', w: 5.5, h: 1.8, keywords: 'twin basin sink washbasin his hers' },
  { kind: 'pedestal-sink', label: 'Pedestal Sink', category: 'bath', w: 2, h: 1.8, keywords: 'basin washbasin lavatory freestanding' },
  { kind: 'toilet', label: 'Toilet', category: 'bath', w: 1.6, h: 2.5, keywords: 'wc lavatory commode loo' },
  { kind: 'bidet', label: 'Bidet', category: 'bath', w: 1.5, h: 2.2, keywords: 'wc washlet lavatory' },
  { kind: 'shower', label: 'Walk-in Shower', category: 'bath', w: 3.5, h: 3.5, keywords: 'stall cubicle wet room enclosure' },
  { kind: 'corner-shower', label: 'Corner Shower', category: 'bath', w: 3.5, h: 3.5, keywords: 'quadrant cubicle stall enclosure tray' },
  { kind: 'shower-curtain', label: 'Shower Curtain', category: 'bath', w: 3.5, h: 0.5, keywords: 'curtain rail drape screen shower' },
  { kind: 'bathtub', label: 'Bathtub', category: 'bath', w: 5, h: 2.6, keywords: 'tub soak bath' },
  { kind: 'tub-shower', label: 'Tub with Curtain', category: 'bath', w: 5, h: 2.6, keywords: 'bathtub shower curtain rail over bath combo' },
  { kind: 'jacuzzi', label: 'Jacuzzi / Spa', category: 'bath', w: 6, h: 6, keywords: 'whirlpool hot tub jets bath spa' },
  { kind: 'towel-rail', label: 'Towel Rail', category: 'bath', w: 2, h: 0.4, keywords: 'radiator warmer bar towel hanging' },
  { kind: 'medicine-cabinet', label: 'Medicine Cabinet', category: 'bath', w: 2.5, h: 0.6, keywords: 'mirror wall cupboard overhead storage' },
  { kind: 'linen-closet', label: 'Linen Closet', category: 'bath', w: 2.5, h: 2, keywords: 'airing cupboard shelves towels storage' },
  { kind: 'bath-mat', label: 'Bath Mat', category: 'bath', w: 3, h: 2, keywords: 'rug floor mat towel' },

  /* ---------------- Decor & Utility ---------------- */
  { kind: 'plant', label: 'Houseplant', category: 'decor', w: 2, h: 2, keywords: 'greenery pot tree foliage' },
  { kind: 'rug', label: 'Area Rug', category: 'decor', w: 8, h: 5, keywords: 'carpet mat floor covering' },
  { kind: 'patio-table', label: 'Patio Table', category: 'decor', w: 4, h: 4, keywords: 'outdoor garden terrace parasol' },
  { kind: 'shelving-unit', label: 'Shelving Unit', category: 'decor', w: 4, h: 1.5, keywords: 'storage racking garage shelves' },
  { kind: 'stairs', label: 'Straight Stairs', category: 'decor', w: 3.5, h: 10, keywords: 'staircase steps flight stair' },
  { kind: 'stairs-l', label: 'L-Shaped Stairs', category: 'decor', w: 6, h: 6, keywords: 'staircase steps landing quarter turn stair' },
  { kind: 'stairs-spiral', label: 'Spiral Stairs', category: 'decor', w: 6, h: 6, keywords: 'staircase steps helical circular stair' },
  { kind: 'washer', label: 'Washing Machine', category: 'decor', w: 2.3, h: 2.3, keywords: 'laundry washer utility appliance' },
  { kind: 'dryer', label: 'Tumble Dryer', category: 'decor', w: 2.3, h: 2.3, keywords: 'laundry drier utility appliance vent' },
  { kind: 'stacked-laundry', label: 'Stacked Laundry', category: 'decor', w: 2.3, h: 2.5, keywords: 'washer dryer laundry column utility' },
  { kind: 'water-heater', label: 'Water Heater', category: 'decor', w: 2, h: 2, keywords: 'boiler cylinder tank hot water utility' },
  { kind: 'hvac-unit', label: 'HVAC Unit', category: 'decor', w: 3, h: 2.5, keywords: 'furnace air conditioning ac heating plant utility' },
  { kind: 'ironing-board', label: 'Ironing Board', category: 'decor', w: 4.5, h: 1.5, keywords: 'laundry utility press' },
];

/**
 * Fallback definition so an unknown kind renders as a plain box rather than
 * crashing the renderer.
 */
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

/**
 * `draw` falls back rather than being left undefined: the renderer calls
 * `def.draw(...)` unguarded once per item per frame, so a single mistyped kind
 * would otherwise take down the whole canvas.
 */
export const FURNITURE = CATALOG.map((item) => ({
  ...item,
  draw: DRAWERS[item.kind] ?? FALLBACK.draw,
}));

const BY_KIND = new Map(FURNITURE.map((f) => [f.kind, f]));

// Surface catalog/drawer mismatches loudly in development, in both directions —
// a catalog entry with no symbol, and a symbol nothing can reach.
if (import.meta.env?.DEV) {
  const kinds = new Set(CATALOG.map((i) => i.kind));
  const missing = CATALOG.filter((i) => !DRAWERS[i.kind]).map((i) => i.kind);
  const orphans = Object.keys(DRAWERS).filter((k) => !kinds.has(k));
  if (missing.length) {
    console.error('[furniture] catalog kinds with no draw function:', missing);
  }
  if (orphans.length) {
    console.warn('[furniture] draw functions with no catalog entry:', orphans);
  }
}

/**
 * Unknown kinds get a *cached* fallback. The renderer calls this per item per
 * frame, so allocating a fresh object here would churn the heap during a drag.
 */
const FALLBACK_CACHE = new Map();

export function getFurniture(kind) {
  const hit = BY_KIND.get(kind);
  if (hit) return hit;
  const key = kind || 'unknown';
  if (!FALLBACK_CACHE.has(key)) FALLBACK_CACHE.set(key, { ...FALLBACK, kind: key });
  return FALLBACK_CACHE.get(key);
}

/** Total number of items in the library, for the search placeholder. */
export const FURNITURE_COUNT = FURNITURE.length;

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

/**
 * Index of every furniture plan symbol.
 *
 * The actual drawing routines live in `./draw/<category>.js`, one module per
 * sidebar category, sharing the helpers in `./draw/primitives.js`. This file
 * only assembles them, so `src/data/furniture.js` keeps a single import.
 *
 * Draw contract: `draw(ctx, env)` is called with the canvas context already
 * translated to the item's centre, rotated by its angle, and scaled so that
 * **1 unit === 1 foot**. Draw in local space spanning [-w/2, w/2] x [-h/2, h/2];
 * by convention an item "faces" -y (up).
 *
 * `env` carries:
 *   w, h      item footprint in feet
 *   fill      body fill color
 *   stroke    outline color
 *   detail    secondary line color
 *   lw        world units per screen pixel — multiply for hairlines
 *   theme     full theme token object
 *   item      the document entity being drawn
 */

import { LIVING_DRAWERS } from './draw/living.js';
import { BEDROOM_DRAWERS } from './draw/bedroom.js';
import { KITCHEN_DRAWERS } from './draw/kitchen.js';
import { BATH_DRAWERS } from './draw/bath.js';
import { DECOR_DRAWERS } from './draw/decor.js';

export const DRAWERS = {
  ...LIVING_DRAWERS,
  ...BEDROOM_DRAWERS,
  ...KITCHEN_DRAWERS,
  ...BATH_DRAWERS,
  ...DECOR_DRAWERS,
};

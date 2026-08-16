/**
 * The pre-loaded 1-bedroom modern apartment.
 *
 * A 34' x 24' shell (816 sq ft gross). Exterior walls are 8", interior
 * partitions 5". All coordinates are wall CENTERLINES in feet, with the
 * origin at the outside top-left corner of the shell.
 *
 * Layout: private wing west of the spine wall (bedroom north, bath south),
 * open-plan public wing east (dining north-west, kitchen north-east, living
 * across the south).
 */

import {
  createEmptyDoc,
  makeFurniture,
  makeOpening,
  makeRoom,
  makeWall,
} from '../state/document.js';
import { getRoomPreset } from './roomPresets.js';

const EXT = 0.67; // 8" exterior
const INT = 0.42; // 5" interior

export function createTemplateDoc() {
  const doc = createEmptyDoc('Modern 1-Bedroom Apartment');

  /* ---------------- Walls ---------------- */
  const W = {};
  const wall = (key, a, b, thickness) => {
    const w = makeWall(a, b, { thickness });
    W[key] = w;
    doc.walls.push(w);
    return w;
  };

  // Exterior shell, drawn as a closed loop so every corner shares a node.
  wall('extN', { x: 0, y: 0 }, { x: 34, y: 0 }, EXT);
  wall('extE', { x: 34, y: 0 }, { x: 34, y: 24 }, EXT);
  wall('extS', { x: 34, y: 24 }, { x: 0, y: 24 }, EXT);
  wall('extW', { x: 0, y: 24 }, { x: 0, y: 0 }, EXT);

  // Interior partitions.
  wall('spine', { x: 13, y: 0 }, { x: 13, y: 24 }, INT); // private / public divider
  wall('bedS', { x: 0, y: 12 }, { x: 13, y: 12 }, INT); // bedroom / bath+hall
  wall('bathE', { x: 8, y: 12 }, { x: 8, y: 24 }, INT); // bath / hall
  wall('kitS', { x: 24, y: 9 }, { x: 34, y: 9 }, INT); // kitchen back wall

  /* ---------------- Doors & windows ---------------- */
  const opening = (kind, host, t, overrides) =>
    doc.openings.push(makeOpening(kind, host.id, t, overrides));

  // Entry door on the south wall. extS runs from x=34 to x=0, so t is measured
  // backwards along +x: t = (34 - x) / 34.
  opening('door', W.extS, (34 - 11) / 34, { width: 3, hinge: 'a', swing: 'in' });
  // Bedroom door off the hall.
  opening('door', W.bedS, 11 / 13, { width: 2.83, hinge: 'b', swing: 'in' });
  // Bathroom door off the hall.
  opening('door', W.bathE, 4 / 12, { width: 2.5, hinge: 'a', swing: 'in' });
  // Hall opening into the living space — a cased opening, no leaf.
  opening('door', W.spine, 18 / 24, { width: 4, style: 'cased' });
  // Kitchen pass-through — also cased.
  opening('door', W.kitS, 0.45, { width: 5, style: 'cased' });

  // Windows: north wall (bedroom, dining, kitchen).
  opening('window', W.extN, 6 / 34, { width: 5 });
  opening('window', W.extN, 18 / 34, { width: 5 });
  opening('window', W.extN, 29 / 34, { width: 4 });
  // East wall (living).
  opening('window', W.extE, 16 / 24, { width: 6 });
  // West wall (bedroom, bath).
  opening('window', W.extW, (24 - 6) / 24, { width: 4 });
  opening('window', W.extW, (24 - 17) / 24, { width: 2.5 });
  // South wall (living).
  opening('window', W.extS, (34 - 26) / 34, { width: 6 });

  /* ---------------- Rooms (inner faces) ---------------- */
  const room = (presetId, x, y, w, h, label) => {
    const preset = getRoomPreset(presetId);
    doc.rooms.push(
      makeRoom(x, y, w, h, {
        label: label ?? preset.label,
        preset: presetId,
        tint: preset.tint,
      }),
    );
  };

  room('master-bed', 0.33, 0.33, 12.46, 11.46, 'Master Bedroom');
  room('bath', 0.33, 12.21, 7.46, 11.46, 'Bathroom');
  room('custom', 8.21, 12.21, 4.58, 11.46, 'Hall');
  room('dining', 13.21, 0.33, 10.58, 8.46, 'Dining');
  room('kitchen', 24.21, 0.33, 9.46, 8.46, 'Kitchen');
  room('living', 13.21, 9.21, 20.46, 14.46, 'Living Room');

  /* ---------------- Furniture ---------------- */
  // Array order is paint order, so the rug goes first and sits under everything.
  const place = (kind, x, y, rot = 0, overrides = {}) =>
    doc.furniture.push(makeFurniture(kind, x, y, { rot, ...overrides }));

  // Living room: rug anchors the seating group, sectional to the north,
  // coffee table centred on it, media unit against the south wall.
  place('rug', 21.5, 17.6, 0, { w: 13, h: 10 });
  place('sectional', 19.5, 14.2, 0);
  place('coffee-table', 21.5, 18.4, 0);
  place('media-unit', 21.5, 22.7, 180);
  place('armchair', 29.5, 17.5, -90);
  place('floor-lamp', 14.6, 11.2, 0);
  place('plant', 32.2, 22, 0);

  // Dining.
  place('dining-set', 18.5, 4.6, 0);
  place('plant', 14.4, 1.7, 0);

  // Kitchen.
  place('kitchen-counter', 32.6, 4.6, 90, { w: 8, h: 2 });
  place('refrigerator', 25.9, 1.7, 0);
  place('stove', 29.4, 1.6, 0);
  place('sink-island', 27.8, 6.9, 0);

  // Bedroom.
  place('bed-queen', 6.4, 4.1, 0);
  place('nightstand', 3, 1.4, 0);
  place('nightstand', 9.8, 1.4, 0);
  place('wardrobe', 1.5, 8.6, 90);
  place('desk', 10.6, 9.4, 0);

  // Bathroom.
  place('vanity', 4.4, 13.3, 0);
  place('shower', 5.7, 16.6, 0);
  place('bathtub', 3.4, 21.4, 0);
  place('toilet', 6.9, 21.2, 180);

  return doc;
}

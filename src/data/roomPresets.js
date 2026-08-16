/**
 * Room presets. `tint` is an rgba fill applied over the theme's base room fill,
 * chosen to stay legible on both the blueprint and CAD backgrounds.
 */

// Tints are deliberately LIGHT colors at low alpha. A saturated mid-tone at
// low alpha turns muddy over the dark blueprint ground; a light tint lifts the
// room on dark backgrounds and still reads as a soft wash on the CAD theme.
export const ROOM_PRESETS = [
  { id: 'master-bed', label: 'Master Bedroom', tint: 'rgba(165, 180, 252, 0.14)', w: 14, h: 12 },
  { id: 'guest-bed', label: 'Guest Bedroom', tint: 'rgba(196, 181, 253, 0.14)', w: 11, h: 11 },
  { id: 'bath', label: 'Bathroom', tint: 'rgba(94, 234, 212, 0.13)', w: 8, h: 6 },
  { id: 'kitchen', label: 'Kitchen', tint: 'rgba(253, 224, 71, 0.12)', w: 12, h: 10 },
  { id: 'living', label: 'Living Room', tint: 'rgba(125, 211, 252, 0.13)', w: 16, h: 14 },
  { id: 'dining', label: 'Dining Room', tint: 'rgba(249, 168, 212, 0.13)', w: 12, h: 10 },
  { id: 'garage', label: 'Garage', tint: 'rgba(203, 213, 225, 0.13)', w: 20, h: 20 },
  { id: 'patio', label: 'Patio', tint: 'rgba(134, 239, 172, 0.13)', w: 14, h: 10 },
  { id: 'custom', label: 'Custom Room', tint: null, w: 12, h: 10 },
];

const BY_ID = new Map(ROOM_PRESETS.map((p) => [p.id, p]));

export const getRoomPreset = (id) => BY_ID.get(id) ?? BY_ID.get('custom');

/** Tints offered in the inspector's color row. */
export const TINT_SWATCHES = [
  { label: 'None', value: null },
  { label: 'Sky', value: 'rgba(125, 211, 252, 0.18)' },
  { label: 'Indigo', value: 'rgba(165, 180, 252, 0.18)' },
  { label: 'Violet', value: 'rgba(196, 181, 253, 0.18)' },
  { label: 'Teal', value: 'rgba(94, 234, 212, 0.17)' },
  { label: 'Green', value: 'rgba(134, 239, 172, 0.17)' },
  { label: 'Amber', value: 'rgba(253, 224, 71, 0.16)' },
  { label: 'Rose', value: 'rgba(249, 168, 212, 0.17)' },
  { label: 'Slate', value: 'rgba(203, 213, 225, 0.17)' },
];

# Blueprint Designer

An interactive 2D home blueprint and floor plan designer that runs entirely in the
browser. Draft walls, drop doors and windows that snap onto them, lay out rooms with
automatic square footage, and furnish the plan from a searchable library — on a
pannable, zoomable, snapping grid in either a classic blueprint or a modern CAD
drafting style.

Built with React 19, Tailwind CSS v4, `lucide-react`, and the raw HTML5 2D Canvas
API. There is no canvas or geometry library — all rendering, hit-testing, and
transform maths is implemented here.

## Getting started

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production build
```

The app opens on a pre-loaded, fully furnished 34′ × 24′ one-bedroom apartment, so
it is immediately interactive.

## Features

**Canvas & grid** — 1-foot grid with level-of-detail thinning, toggleable snapping
(3″/6″/1′), pan (drag with the Pan tool, middle mouse, or hold <kbd>Space</kbd>),
and zoom from 25 % to 300 % via wheel-at-cursor or the status-bar slider.
Rendering is `devicePixelRatio`-aware, so lines stay crisp on retina displays.

**Architecture tools** — Click-and-drag wall drafting with a live length and angle
readout, 45° constraint on <kbd>Shift</kbd>, and endpoint magnetism so chained
walls form watertight corners. Doors and windows project onto the nearest wall and
are stored *parametrically* on it, so they travel with the wall when it moves.
Doors render standard 90° swing arcs (with flippable hinge and swing) or as cased
openings. Rooms are drag-drawn from eight presets and report their area live.

**Furniture library** — 24 items across five categories, each drawn as a real
vector plan symbol rather than a placeholder box. Drag from the sidebar onto the
canvas or click a card to place it at the viewport centre. Sidebar thumbnails are
rendered by the same draw routines used on the plan, so they can never drift.

**Editing** — Selection with an 8-handle scale box and a rotation anchor,
marquee multi-select, shift-click to extend, and an inspector for exact X/Y,
width/height, angle, colour tint, and labels. Full undo/redo, JSON save/load, and
PNG export at 1×/2×/4× with optional grid and a choice of theme.

**Units** — The document is always stored in feet; the status-bar toggle switches
every readout between feet-inches and metres without touching the geometry.

## Keyboard shortcuts

| Key | Action | Key | Action |
| --- | --- | --- | --- |
| <kbd>V</kbd> | Select / move | <kbd>Ctrl</kbd>+<kbd>Z</kbd> | Undo |
| <kbd>W</kbd> | Draw wall | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> | Redo |
| <kbd>D</kbd> | Add door | <kbd>Ctrl</kbd>+<kbd>D</kbd> | Duplicate |
| <kbd>N</kbd> | Add window | <kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>V</kbd> | Copy / paste |
| <kbd>M</kbd> | Add room | <kbd>Ctrl</kbd>+<kbd>A</kbd> | Select all |
| <kbd>H</kbd> | Pan | <kbd>Ctrl</kbd>+<kbd>S</kbd> | Save JSON |
| <kbd>R</kbd> | Rotate 45° (<kbd>Shift</kbd> reverses) | <kbd>Ctrl</kbd>+<kbd>E</kbd> | Export PNG |
| <kbd>Del</kbd> | Delete selection | <kbd>G</kbd> | Toggle snapping |
| <kbd>Esc</kbd> | Deselect / cancel | <kbd>T</kbd> | Switch theme |
| Arrows | Nudge by the snap step | <kbd>0</kbd> / <kbd>F</kbd> | Zoom 100 % / fit |

Hold <kbd>Shift</kbd> while dragging to constrain to 45° or preserve aspect ratio,
and <kbd>Alt</kbd> to ignore snapping.

## Architecture

```
src/
├── engine/           pure modules — no React, no DOM state
│   ├── units.js          feet <-> feet-inches/metric formatting
│   ├── geometry.js       vectors, segments, rotated rects, convex hull
│   ├── camera.js         the single definition of the screen <-> world transform
│   ├── theme.js          two token sets with identical keys
│   ├── wallGeometry.js   node graph, opening subtraction, mitred corner joins
│   ├── hittest.js        z-ordered picking, handles, marquee
│   ├── renderer.js       renderScene() — the only drawing entry point
│   └── exportImage.js    PNG/JSON export, reusing renderScene verbatim
├── state/
│   ├── document.js       schema, entity factories, (de)serialization
│   ├── reducer.js        document actions + undo/redo history
│   └── useBlueprintStore.js  the store: what is React state vs. a ref
├── data/                 furniture catalog + draw routines, room presets, template
├── hooks/                canvas sizing, rAF scheduling, keyboard shortcuts
└── components/           toolbar, sidebar, inspector, status bar, canvas stage
```

Three decisions shape the rest of the code:

**The document is stored in feet, and only formatted at the edges.** Metric is a
display concern, so switching units can never round or drift the geometry.

**Openings are parametric on their host wall** (`wallId` + `t` along it) rather
than positioned absolutely. A door therefore follows its wall automatically when
the wall is moved or re-lengthed, and `openingSpan()` is the single source of
truth that rendering, hit-testing, and wall subtraction all derive from — so they
cannot disagree.

**React never renders during a drag.** Pointer handlers mutate refs and request an
animation frame; the reducer is dispatched exactly once on `pointerup`. That keeps
the canvas at 60 fps and collapses a drag into a single undo step. The renderer
reads `docRef`, `viewRef`, and `draftRef`, never props.

### How walls are drawn

Walls are centreline segments with a thickness. Painting them as proper drafted
line-work takes three steps: subtract each wall's openings to get its solid
intervals, patch every node where walls meet with the convex hull of the incident
wall faces *plus their face-line intersections* (the intersections are what make a
corner mitre square instead of chamfered), then fill the union twice — once in the
outline colour while also stroking it, which grows the shape outward, and once in
the body colour, which covers every interior seam. The result is a uniform double
line around the true outer boundary of the wall network, with no polygon offsetting
and no offscreen compositing.

### Blueprint JSON schema

`version: "bp-1"`, with four typed arrays:

```jsonc
{
  "version": "bp-1",
  "name": "Modern 1-Bedroom Apartment",
  "walls":     [{ "id", "a": {"x","y"}, "b": {"x","y"}, "thickness" }],
  "openings":  [{ "id", "kind": "door|window", "wallId", "t", "width",
                  "hinge": "a|b", "swing": "in|out", "style": "swing|cased" }],
  "rooms":     [{ "id", "x", "y", "w", "h", "label", "preset", "tint" }],
  "furniture": [{ "id", "kind", "x", "y", "w", "h", "rot", "tint", "label" }]
}
```

Array order within `furniture` is paint order. Loading is defensive: numbers are
coerced, unknown keys dropped, unknown furniture kinds fall back to a labelled box,
and openings whose host wall is missing are discarded rather than crashing the
renderer.

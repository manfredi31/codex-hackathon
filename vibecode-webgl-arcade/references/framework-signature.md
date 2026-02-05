# Framework Signature

Use this file as the architecture contract for all outputs built with `vibecode-webgl-arcade`.

## Core Shared Pattern

1. Build one browser-playable entrypoint (`index.html` by default).
2. Use a WebGL engine, defaulting to Three.js ESM import.
3. Keep CSS and JS inline for one-shot outputs unless the user asks for split files.
4. Layer DOM UI over the rendering canvas for start, HUD, and game-over flows.
5. Organize JS in explicit sections:
- utilities/input/helpers
- base entity
- entities
- game manager
- bootstrap
6. Run simulation via `requestAnimationFrame`.
7. Cap `dt` (or run fixed-step updates) to avoid unstable physics.
8. Mark entities for deletion and clean collections every frame.

## Layout Contract

1. Use a full-viewport body with centered game shell.
2. Render WebGL canvas as the base layer.
3. Use absolute positioned overlay for HUD.
4. Keep start/restart controls interactive (`pointer-events: auto`), HUD passive (`pointer-events: none`).
5. Use a `.hidden` class for overlay visibility toggles.

## Game Manager Contract

`Game` should own:
- renderer, scene, camera
- input manager
- entity arrays
- score/health/lives metrics
- spawn timers and difficulty curve
- UI references
- start/reset/game-over flow
- main loop (`update` then `render`)

Recommended update flow:
1. Exit early if game is not active.
2. Process input and player actions.
3. Update world motion and spawn systems.
4. Update entities.
5. Resolve collisions and scoring.
6. Remove entities marked for deletion.
7. Refresh UI text.

## State Management

Use explicit transitions with one of:
1. Enum state machine (`START`, `PLAYING`, `GAMEOVER`)
2. Equivalent booleans with clearly separated transitions

Required transitions:
- start action -> reset -> playing
- lose condition -> game over overlay
- restart action -> reset -> playing

## Rendering Style

1. Prefer low-poly primitives and procedural materials over heavy assets.
2. Add basic depth cues: directional light, ambient light, fog, sky gradient.
3. Keep draw order and visibility deterministic.
4. Use lightweight VFX (small particles, hit flashes, subtle camera shake).

## Performance Guardrails

1. Reuse vectors/objects in tight loops when practical.
2. Dispose of off-screen entities quickly.
3. Keep geometry/material count bounded.
4. Keep shadow usage conservative for browser performance.
5. Avoid per-frame allocations in hot paths where easy to eliminate.

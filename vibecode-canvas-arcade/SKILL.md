---
name: vibecode-canvas-arcade
description: Build complete single-file HTML5 Canvas arcade games in the same house framework used by flappybird.html, zombieshooter.html, and subwaysurfer.html (canvas + DOM overlays, class-based entities, Game manager, requestAnimationFrame loop). Use when the user asks to vibecode a playable browser game in one shot for a Roblox-style game platform, create arcade game variants, or keep new games stylistically consistent with those reference files.
---

# Vibecode Canvas Arcade

## Overview

Generate polished, playable arcade games as one `.html` file with embedded CSS and JavaScript.
Preserve the shared architecture and style from the reference games so outputs feel like one coherent framework.

## Quick Start

1. Read `references/framework-signature.md` before writing code.
2. Pick the closest recipe from `references/genre-recipes.md`.
3. Start from `assets/templates/arcade-single-file-template.html`.
4. Replace placeholders and complete all TODO blocks in one pass.
5. Validate with the checklist in `references/quality-gates.md` before returning.

## Output Contract (One Shot)

1. Return one complete HTML document that runs directly in a browser.
2. Keep CSS and JS inline unless the user explicitly asks for split files.
3. Include a start screen, HUD, and game-over/restart flow.
4. Use class-based JS sections in this order:
- Utility classes (`InputManager`, helpers like `Vector2` or `Projection`)
- Base game object class
- Game entities
- `Game` manager
- Initialization
5. Use `requestAnimationFrame` with capped `dt` to keep behavior stable.
6. Implement cleanup for entities marked for deletion each frame.
7. Implement restart without requiring page reload.

## House Style Rules

1. Use `640x480` canvas by default unless the user asks otherwise.
2. Place canvas inside a centered container with a HUD overlay layer.
3. Use simple geometric rendering (rects, arcs, ellipses, gradients, shadows) instead of external art assets.
4. Keep controls visible on the start screen.
5. Keep code readable with compact section comments and explicit game-state variables.
6. Favor deterministic, tunable constants over magic numbers scattered across methods.
7. Support keyboard and touch/click when sensible for the game type.

## Build Procedure

1. Define the gameplay loop in one sentence: objective, lose condition, scoring.
2. Define state model early (`START`, `PLAYING`, `GAMEOVER` or equivalent booleans).
3. Implement controls first and verify edge-trigger actions (`justPressed` behavior) where needed.
4. Implement player movement/physics.
5. Implement spawn system and difficulty ramp.
6. Implement collisions and scoring.
7. Implement UI updates (`updateUI`/`updateScoreUI`) and restart path.
8. Run the quality gates and return final code.

## References

- Architecture contract: `references/framework-signature.md`
- Genre-specific mechanics and formulas: `references/genre-recipes.md`
- Final validation checklist: `references/quality-gates.md`
- Starter scaffold: `assets/templates/arcade-single-file-template.html`

## Non-Goals

1. Do not introduce build tools, npm, or framework dependencies for default outputs.
2. Do not rely on external textures/sounds unless the user explicitly asks for them.
3. Do not return partial snippets when asked to build a full game.

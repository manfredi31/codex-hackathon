---
name: vibecode-canvas-arcade
description: Build complete single-file HTML5 Canvas arcade games in the same house framework used by flappybird.html, zombieshooter.html, and subwaysurfer.html (canvas + DOM overlays, class-based entities, Game manager, requestAnimationFrame loop). Use when the user asks to vibecode a playable browser game in one shot for a Roblox-style game platform, create arcade game variants, or keep new games stylistically consistent with those reference files.
---

# Vibecode Canvas Arcade

## Overview

Generate polished, playable arcade games as one `.html` file with embedded CSS and JavaScript.
Preserve the shared architecture from the reference games so outputs feel like one coherent framework.
Before every build, select one visual style label from the mandatory random style bank and apply it consistently.

## Quick Start

1. Read `references/framework-signature.md` before writing code.
2. Sample one style label from `Random Style Sampling (Mandatory)` in this file (unless the user explicitly picked a style).
3. Pick the closest recipe from `references/genre-recipes.md`.
4. Start from `assets/templates/arcade-single-file-template.html`.
5. Replace placeholders and complete all TODO blocks in one pass.
6. Validate with the checklist in `references/quality-gates.md` before returning.

## Random Style Sampling (Mandatory)

Use this bank for every build unless the user explicitly requests a specific style.

Sampling rules:
1. If the user specifies a style, use it and skip random selection.
2. Otherwise, randomly choose exactly one style label from the bank below.
3. Keep game mode/architecture unchanged; style labels only control presentation.
4. Surface the chosen style in the response as `Sampled Style: <label>`.
5. Apply the style consistently across palette, typography, HUD treatment, entity shapes, and effects.

Style bank:

2D & Retro
- 2D Arcade Retro
- Pixel Art
- 8-bit Style
- 16-bit Style
- Sprite-Based 2D
- Classic Arcade
- Old-School / Retro
- Hand-Drawn 2D
- Flat 2D

Arcade / Action-Oriented
- Arcade-Style
- Score-Attack
- Bullet Hell
- Twin-Stick Shooter (2D)
- Run and Gun
- Stylized 2D
- Cartoon 2D
- Stylized 2D
- Comic-Book Style
- Anime-Style 2D
- Cel-Shaded 2D
- Minimalist 2D
- Silhouette Style
- Retro-Inspired Modern
- Neo-Retro
- Modern Pixel Art
- HD Pixel Art
- CRT-Inspired
- Retro-Futuristic
- Vaporwave

Other Common Visual Labels
- Low-Resolution
- High-Contrast
- Monochrome
- Limited Color Palette
- Isometric 2D

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
8. Include `Sampled Style: <label>` in the build response (or `Chosen Style` when user-specified).

## House Style Rules

1. Use `640x480` canvas by default unless the user asks otherwise.
2. Place canvas inside a centered container with a HUD overlay layer.
3. Use simple geometric rendering (rects, arcs, ellipses, gradients, shadows) instead of external art assets.
4. Keep controls visible on the start screen.
5. Keep code readable with compact section comments and explicit game-state variables.
6. Favor deterministic, tunable constants over magic numbers scattered across methods.
7. Support keyboard and touch/click when sensible for the game type.
8. Interpret the sampled style label into concrete visual choices: color palette, line weight, typography, FX density, and HUD framing.

## Build Procedure

1. Select the style label (random unless user-specified) and write down 3-5 concrete visual cues.
2. Define the gameplay loop in one sentence: objective, lose condition, scoring.
3. Define state model early (`START`, `PLAYING`, `GAMEOVER` or equivalent booleans).
4. Implement controls first and verify edge-trigger actions (`justPressed` behavior) where needed.
5. Implement player movement/physics.
6. Implement spawn system and difficulty ramp.
7. Implement collisions and scoring.
8. Implement UI updates (`updateUI`/`updateScoreUI`) and restart path.
9. Run the quality gates and return final code.

## References

- Architecture contract: `references/framework-signature.md`
- Genre-specific mechanics and formulas: `references/genre-recipes.md`
- Final validation checklist: `references/quality-gates.md`
- Starter scaffold: `assets/templates/arcade-single-file-template.html`

## Non-Goals

1. Do not introduce build tools, npm, or framework dependencies for default outputs.
2. Do not rely on external textures/sounds unless the user explicitly asks for them.
3. Do not return partial snippets when asked to build a full game.
4. Do not ignore the selected style label when styling the output.

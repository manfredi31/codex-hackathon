---
name: vibecode-webgl-arcade
description: 'Build complete browser-playable 3D arcade games using WebGL (default Three.js) with a consistent house framework (renderer + scene + camera + lights + entities + DOM HUD overlays). Use when the user asks for a fast 3D game prototype/MVP in the browser with start/play/game-over/restart flow, or asks for a close clone/remake in HTML + Three.js (for example: "Make a XXXGAME clone in HTML using Three JS, be as detailed as possible, it should be the closest clone you can make").'
---

# Vibecode WebGL Arcade

## Overview

Generate polished 3D arcade games that run directly in the browser and preserve a predictable architecture across outputs.
Default to one standalone `index.html` using Three.js module import from CDN unless the user asks for split files.
Before every build, select one visual style label from the mandatory random style bank and apply it consistently.
When the request is clone-oriented, switch to `Clone Mode (Closest Clone Requests)` below.

## Quick Start

1. Read `references/framework-signature.md` before coding.
2. If the prompt asks for a clone/remake, run `Clone Mode (Closest Clone Requests)` first.
3. Sample one style label from `Random Style Sampling (Mandatory)` in this file (unless the user explicitly picked a style).
4. Pick the closest pattern from `references/genre-recipes.md`.
5. Start from `assets/templates/webgl-single-file-template.html`.
6. Replace placeholders and complete TODO markers in one pass.
7. Validate with `references/quality-gates.md` before returning.

## Clone Mode (Closest Clone Requests)

Use this mode when the prompt includes clone/remake language, including variants like:
- "Make a XXXGAME clone in HTML using Three JS"
- "closest clone you can make"
- "recreate [game] in Three.js"
- "be as detailed as possible"

Clone mode rules:
1. Keep engine locked to Three.js unless the user explicitly asks for another engine.
2. Extract and restate the clone target as `Clone Target: <game name>`.
3. Build a fidelity checklist before coding and mirror it in implementation:
- camera behavior
- movement feel and acceleration/deceleration tuning
- core loop and objective
- scoring/combo/progression rules
- enemies/obstacles/pattern cadence
- failure states and restart loop
- HUD information architecture
- level/arena structure and pacing ramp
- VFX/SFX feedback rhythm (visual emphasis if audio assets are unavailable)
4. Prioritize gameplay feel parity over ornamental visuals.
5. Use explicit gameplay constants for tunable parity (`speed`, `gravity`, `spawnInterval`, `fireCooldown`, etc.).
6. If exact source behavior is unknown, make the closest practical assumption and call it out.
7. Do not copy proprietary logos, names, characters, music, or trademarked art assets verbatim; use neutral replacements while preserving gameplay structure.
8. Deliver a complete playable build, not a partial prototype.
9. End the response with `Clone Fidelity Notes` summarizing:
- what was matched closely
- what was approximated and why
- the top constants to tweak for even closer parity

## Random Style Sampling (Mandatory)

Use this bank for every build unless the user explicitly requests a specific style.

Sampling rules:
1. If the user specifies a style, use it and skip random selection.
2. Otherwise, randomly choose exactly one style label from the bank below.
3. Keep 3D mode, engine choice, and architecture unchanged; style labels only control visual direction.
4. Surface the chosen style in the response as `Sampled Style: <label>`.
5. Apply the style consistently across palette, lighting, materials, HUD treatment, and effects.
6. When a label is 2D-oriented, reinterpret it as a 3D equivalent mood (for example palette, contrast, shader/material treatment), not as a mode switch.

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

## Output Contract

1. Return one complete playable browser game entrypoint.
2. Keep CSS and JS inline unless the user asks for a multi-file structure.
3. Include start screen, HUD, and game-over/restart flow.
4. Use class-based JavaScript sections in this order:
- Utility classes (`InputManager`, math helpers, camera helpers)
- Base entity class
- Game entities
- `Game` manager (state, loop, spawn, collision, UI)
- Initialization/bootstrap
5. Use `requestAnimationFrame` and cap `dt` (`<= 0.1`) or use fixed-step simulation.
6. Remove entities flagged for deletion each update cycle.
7. Implement restart without page reload.
8. Keep `index.html` as the playable entrypoint.
9. Include `Sampled Style: <label>` in the build response (or `Chosen Style` when user-specified).
10. In clone mode, include `Clone Target: <name>` and `Clone Fidelity Notes`.

## Engine Policy

1. Default engine: Three.js (ES module import from CDN).
2. If the user explicitly asks for PlayCanvas or Babylon.js, use that engine instead.
3. Keep output browser-native and local-preview friendly.
4. Reject hard requirements that imply native engine export pipelines (Unity/Godot build automation) unless the user requests a scoped browser MVP instead.

## House Style Rules

1. Center the game viewport and layer DOM overlays above WebGL canvas.
2. Prefer simple stylized visuals (low-poly primitives, emissive accents, fog, gradients) over photorealism.
3. Keep a stable camera strategy per genre (follow, chase, top-down, cockpit) and avoid disorienting jumps.
4. Keep controls visible on the start screen.
5. Keep gameplay constants explicit and tunable in one place.
6. Support keyboard first; add touch/click fallback when sensible.
7. Keep visual effects lightweight (particle bursts, camera shake, post-hit flash) and deterministic enough for smoke tests.
8. Interpret the sampled style label into concrete visual choices: palette, lighting model, material look, FX density, and UI framing.

## Build Procedure

1. Select the style label (random unless user-specified) and write down 3-5 concrete visual cues.
2. If clone mode is active, define a short fidelity checklist with concrete target behaviors and tuning anchors.
3. Define loop in one sentence: objective, lose condition, score signal.
4. Define state model early (`START`, `PLAYING`, `GAMEOVER`).
5. Implement controls and camera first; verify edge-trigger inputs.
6. Implement player movement and world motion.
7. Implement spawns and difficulty ramp.
8. Implement collisions, health/lives, and scoring.
9. Implement UI updates and restart path.
10. Add minimal test seam when useful:
- `window.__TEST__ = { ready, state: () => ({ ... }) }`
11. Run the quality gates and return final code.

## References

- Architecture contract: `references/framework-signature.md`
- Genre mechanics recipes: `references/genre-recipes.md`
- Validation checklist: `references/quality-gates.md`
- Starter scaffold: `assets/templates/webgl-single-file-template.html`

## Non-Goals

1. Do not set up Unity/Godot export toolchains.
2. Do not introduce backend networking for core gameplay by default.
3. Do not promise photorealistic rendering or open-world streaming.
4. Do not return partial snippets when the request asks for a complete playable game.
5. Do not ignore the selected style label when styling the output.

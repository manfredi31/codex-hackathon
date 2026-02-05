# Quality Gates

Run this checklist before returning output.

## Must Pass

1. Output is a complete playable browser entrypoint.
2. Game initializes without uncaught console errors.
3. Start screen appears with clear controls.
4. Start action enters active play state.
5. HUD updates during gameplay (score/health/lives).
6. Lose condition is reachable and game-over UI appears.
7. Restart fully resets state without page reload.
8. Main loop uses `requestAnimationFrame` with capped `dt` or fixed-step update.
9. Entity cleanup runs every frame for removable objects.
10. Code is organized into the contracted class sections.
11. A style label is selected from the skill style bank (unless user-specified style overrides random sampling).
12. Build response states the selected style label as `Sampled Style` or `Chosen Style`.
13. Style selection does not change mode/engine requirements (remain 3D WebGL unless user asks otherwise).

## Style Match Gates

1. DOM overlays + WebGL canvas layering is present.
2. `.hidden` class controls overlay visibility.
3. Visual direction is cohesive and reflects the selected style label.
4. At least one feedback effect exists (flash, shake, particles, trail).
5. Controls in UI copy match implemented bindings.
6. Style cues are consistent across palette, lighting, materials, HUD framing, and effects.

## Robustness Gates

1. Player position is clamped to valid play bounds.
2. Spawn systems are bounded (no unbounded array growth).
3. Critical timers and counters are clamped/sanitized.
4. Dispose geometry/materials when removing long-lived dynamic meshes.
5. Gracefully show a message when WebGL is unavailable.

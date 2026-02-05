# Quality Gates

Run this checklist before delivering code.

## Must Pass

1. Output is a complete, valid HTML document.
2. Canvas game runs with no external dependencies.
3. Start screen is visible on load with control instructions.
4. Game enters active state via key/button/click.
5. HUD updates during play (score, health, coins, etc.).
6. Lose condition is reachable and game-over UI appears.
7. Restart action fully resets state and starts a fresh run.
8. Main loop uses `requestAnimationFrame` and capped `dt`.
9. Entities marked for deletion are removed each frame.
10. Code is organized into classes with clear section headers.
11. A style label is selected from the skill style bank (unless user-specified style overrides random sampling).
12. Build response states the selected style label as `Sampled Style` or `Chosen Style`.

## Style Match Gates

1. DOM overlay + canvas layering is present.
2. `.hidden` class toggles overlay visibility.
3. Colors, typography, and HUD styling reflect the selected style label.
4. Visual effects exist (at least one: particles, trail, flash, shake).
5. Controls are mirrored in both implementation and UI copy.
6. Style cues are consistent across palette, shapes, UI framing, and effects.

## Robustness Gates

1. Clamp player bounds where relevant.
2. Prevent unbounded arrays (cleanup always runs).
3. Cap extreme frame delta (`dt`) to avoid simulation spikes.
4. Avoid NaN sources (division by zero checks for vector normalize/projection).

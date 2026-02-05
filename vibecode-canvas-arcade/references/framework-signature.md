# Framework Signature

Use this as the compatibility contract with:
- `/Users/vittoriogaravelli/GitHub/GitHub/codex-hackathon/games-inspo/flappybird.html`
- `/Users/vittoriogaravelli/GitHub/GitHub/codex-hackathon/games-inspo/zombieshooter.html`
- `/Users/vittoriogaravelli/GitHub/GitHub/codex-hackathon/games-inspo/subwaysurfer.html`

## Core Shared Pattern

1. Build one standalone HTML file.
2. Embed CSS in `<style>` and gameplay code in `<script>`.
3. Center a fixed-size canvas (`640x480`) in a `#game-container` wrapper.
4. Layer DOM UI on top of canvas for HUD/start/game-over.
5. Implement class-oriented game code with explicit sections:
- Utilities (`InputManager`, `Vector2`, `Projection`, etc.)
- Base object
- Entities
- Game manager
- Initialization
6. Drive simulation with `requestAnimationFrame`.
7. Cap delta time (`dt`) to avoid huge jumps when tab focus changes.
8. Mark entities for deletion and clean arrays every frame.

## Layout Contract

1. Use a full-viewport body that centers the game container.
2. Use an absolutely positioned overlay for HUD (`pointer-events: none`).
3. Keep interactive start/restart buttons in start/game-over overlays (`pointer-events: auto`).
4. Use a `.hidden` class that toggles overlays with `display: none !important`.

## Game Manager Contract

`Game` owns:
- Canvas and 2D context
- Input manager
- Core entity arrays
- Score/lives/health metrics
- Spawn timers and difficulty scaling
- UI element references
- Start/reset/game-over flow
- Main loop (`update` then `render`)

Recommended update flow:
1. Exit early when not running (if applicable).
2. Update player and input-dependent actions.
3. Handle spawning and difficulty updates.
4. Update entities.
5. Check collisions.
6. Cleanup deleted entities.
7. Refresh UI text.

## State Management Variants

All three reference games use one of these:
1. Enum state object (`START`, `PLAYING`, `GAMEOVER`)
2. Boolean flags (`isRunning`, `isGameOver`)

Choose one and keep transitions explicit:
- Start button -> reset -> running
- Lose condition -> game over screen
- Restart button/key -> start again

## Input Patterns

Use both continuous and edge-trigger input where appropriate:
- Continuous: `isKeyDown`, `isMouseDown`
- Edge trigger: `isPressed` / `justPressed` for jump, lane swap, menu transitions

If supporting touch:
1. Bind to canvas `touchstart`/`touchend`.
2. Call `preventDefault()` with non-passive listener where needed.

## Rendering Style

1. Draw all visuals with Canvas 2D primitives.
2. Keep a strong color palette per game.
3. Use simple effects (particles, trails, shadows, screen flash/shake).
4. Layer render order intentionally (background -> world -> player -> fx).

## Performance Guardrails

1. Avoid allocations in tight loops when easy to reuse values.
2. Remove off-screen entities quickly.
3. Keep physics lightweight and arcade-like.
4. Cap `dt` at `0.1` or similar.


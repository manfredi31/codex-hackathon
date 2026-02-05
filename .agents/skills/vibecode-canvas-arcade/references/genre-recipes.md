# Genre Recipes

Pick the closest recipe, then adapt constants and visuals.

## Side-Scroller Flap/Jump (Flappy-like)

Use when:
- One-button timing game
- Vertical control with gravity
- Horizontal obstacle streams

Mechanics:
1. Player has `velocity`, `gravity`, `jumpStrength`.
2. Obstacles spawn at fixed interval with random gap/height.
3. Score increments when player passes obstacle.
4. Lose on obstacle hit, ground hit, or optional ceiling rule.

Useful defaults:
- Gravity: `900` to `1400`
- Jump strength: `-300` to `-450`
- Spawn interval: `1.2` to `1.8` seconds
- Horizontal speed: `140` to `220`

## Top-Down Survival Shooter (Zombie-like)

Use when:
- WASD movement
- Mouse aim + click fire
- Enemy swarms and survival scoring

Mechanics:
1. Implement `Vector2` helper for movement and aiming.
2. Update player rotation from mouse vector.
3. Apply fire-rate cooldown before spawning bullets.
4. Spawn enemies at map edges with difficulty ramp.
5. Resolve bullet-enemy and enemy-player collisions.
6. Reduce health and trigger game over when health <= 0.

Useful defaults:
- Player speed: `180` to `260`
- Bullet speed: `500` to `700`
- Fire rate: `0.1` to `0.2` seconds
- Spawn interval start: `1.5` to `2.5` seconds

## Pseudo-3D Runner (Subway-like)

Use when:
- Lane switching
- Forward speed escalation
- Jump/roll obstacle interactions

Mechanics:
1. Use lane indices (`0,1,2`) with smooth interpolation for render X.
2. Keep world depth `z` and move entities toward camera each frame.
3. Project 3D-ish coordinates with focal-length perspective utility.
4. Spawn obstacles/coins at far `z` and remove when behind camera.
5. Handle collision by lane + z window + stance logic (jump/roll).

Useful defaults:
- Base speed: `350` to `550`
- Speed ramp: `3` to `8` units/sec^2
- Spawn timer: dynamic floor around `0.6` seconds
- Jump duration: around `0.6` to `1.0` seconds

## Shared Difficulty Ramps

Apply one:
1. Decrease spawn interval over time.
2. Increase movement speed over time.
3. Increase enemy durability/count waves.
4. Combine mild versions of the above.

Keep ramp bounded so runs remain readable and playable.


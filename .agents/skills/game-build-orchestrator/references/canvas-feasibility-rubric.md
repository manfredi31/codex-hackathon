# Canvas Feasibility Rubric

Use this file to decide if a request is feasible with `$vibecode-canvas-arcade`.

## Pass Conditions

Approve as feasible only when all conditions are true:

1. Game is 2D and can run in one browser tab.
2. Deliverable can be one standalone `.html` with inline CSS/JS.
3. Mechanics fit an arcade loop (`start -> play -> game over -> restart`).
4. Input fits keyboard/mouse/touch patterns in a browser.
5. Rendering can use Canvas 2D primitives or simple local assets.
6. No required backend for core gameplay.
7. Performance target is realistic for `requestAnimationFrame` browser play.

## Blockers (Any One Means Not Feasible)

1. Mandatory online multiplayer networking or authoritative server simulation.
2. Persistent accounts, cloud saves, economy, or matchmaking as core requirements.
3. Photorealistic 3D, large open world streaming, or advanced engine features.
4. Hard dependency on external services for moment-to-moment gameplay.
5. Scope requiring multi-file app architecture when user requires single-shot output.

## Borderline Handling

If requirements are mixed, attempt scope reduction first:

1. Suggest a local single-player MVP.
2. Suggest replacing online features with local simulation.
3. Suggest simplified visuals and mechanics.

If the user keeps blocker requirements, reject with:
`For now it's too complicated to build such a game.`

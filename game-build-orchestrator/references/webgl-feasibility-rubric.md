# WebGL Feasibility Rubric

Use this file to decide if a request is feasible with `$vibecode-webgl-arcade`.

## Pass Conditions

Approve as feasible only when all conditions are true:

1. Game can run in one browser tab with WebGL.
2. Deliverable can be one standalone `.html` or a small local browser bundle.
3. Mechanics fit an arcade loop (`start -> play -> game over -> restart`).
4. Input fits keyboard/mouse/touch patterns in a browser.
5. Visual target is stylized/arcade scope (not photorealistic AAA fidelity).
6. No required backend for core gameplay.
7. Performance target is realistic for browser hardware and `requestAnimationFrame`.

## Blockers (Any One Means Not Feasible)

1. Mandatory authoritative online multiplayer or cloud simulation for core play.
2. Persistent accounts, economy, matchmaking, or cloud-save systems as core requirements.
3. Photorealistic rendering, large open-world streaming, or advanced native-engine features as hard requirements.
4. Hard dependency on external services for frame-to-frame gameplay decisions.
5. Mandatory native engine export/build pipeline (Unity/Godot/Unreal) when browser delivery is not acceptable.

## Borderline Handling

If requirements are mixed, attempt scope reduction first:

1. Suggest a local single-player MVP.
2. Suggest stylized low-poly visual scope.
3. Suggest shorter session loops and reduced world size.

If the user keeps blocker requirements, reject with:
`For now it's too complicated to build such a game.`

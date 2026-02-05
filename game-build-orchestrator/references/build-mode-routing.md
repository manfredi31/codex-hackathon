# Build Mode Routing

Use this file after the user confirms the game plan.

## Route to 2D (`$vibecode-canvas-arcade`) When

1. The request explicitly says `2D`, `canvas`, `top-down`, `platformer`, or similar.
2. The user asks for one-shot arcade HTML in the existing 2D house style.
3. The user explicitly asks to avoid 3D.

## Route to 3D (`$vibecode-webgl-arcade`) When

1. The request explicitly says `3D`, `WebGL`, `Three.js`, `third-person`, `first-person`, or equivalent.
2. The user asks for a 3D version of an existing arcade concept.
3. The game needs camera depth/parallax as a core mechanic.
4. The user does not specify a mode (default to 3D).

## Ambiguous Mode Handling

If user intent is unclear but not contradictory, default to 3D and continue.
Ask one question only when the request contains conflicting mode signals.

## Non-Browser Engine Handling

1. If the user requires native engine export pipelines (Unity/Godot/Unreal), ask if a browser MVP is acceptable.
2. If browser MVP is accepted, continue with 3D WebGL routing.
3. If browser MVP is not accepted, reject with:
`For now it's too complicated to build such a game.`

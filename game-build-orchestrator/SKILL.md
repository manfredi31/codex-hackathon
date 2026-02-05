---
name: game-build-orchestrator
description: Orchestrate game delivery from an initial game idea through confirmation, mode routing, feasibility gating, and build routing. Use when Codex must (1) restate and validate understanding with the user in a loop, (2) choose 2D or 3D build path by routing between $vibecode-canvas-arcade and $vibecode-webgl-arcade, and (3) decide whether to invoke $vibecode-opponent-ai for a deterministic opponent.
---

# Game Build Orchestrator

## Overview

Run a strict 4-gate flow before building: confirmation loop, mode routing (2D or 3D), mode-specific feasibility check, and opponent-AI routing. Only build after the user confirms the plan.
When implementation starts, always create game output files in the `games/` folder unless the user explicitly asks for a different path.

## Quick Start

1. Read the user's game request.
2. Run the confirmation loop until the user explicitly confirms it works.
3. Select build mode with `references/build-mode-routing.md`.
4. Check feasibility using the rubric for that mode.
5. If not feasible, stop with the required fallback message.
6. If feasible, decide opponent routing with `references/opponent-ai-routing.md`.
7. Build with the selected base skill and optionally `$vibecode-opponent-ai`.
8. Save deliverables in `games/` using a clear slug-based filename.

## Workflow

### Step 1: Confirmation Loop (Mandatory)

1. Summarize the game plan in 5 fields:
- Core loop
- Win/lose conditions
- Controls/platform
- Scope boundaries (what is explicitly out)
- Expected deliverables (HTML only, plus optional `ai.js`, both under `games/`)
2. Ask a direct confirmation question: `Did I understand this correctly?`.
3. If the user does not confirm, ask only the minimum follow-up questions needed, update the summary, and ask again.
4. Repeat until the user explicitly confirms with clear intent (`yes`, `correct`, `works`, `go ahead`, equivalent).
5. Do not evaluate feasibility or build before confirmation.

### Step 2: Build Mode Routing

1. Evaluate requested mode using `references/build-mode-routing.md`.
2. Route to exactly one base builder:
- 2D mode -> `$vibecode-canvas-arcade`
- 3D mode -> `$vibecode-webgl-arcade`
3. If mode is unspecified or simply ambiguous, default to 3D (`$vibecode-webgl-arcade`).
4. Ask one focused question only if the request contains conflicting mode signals:
`Do you want a 2D canvas game or a 3D WebGL game?`
5. Decide and lock mode before feasibility evaluation.

### Step 3: Feasibility Gate (Mode-Specific)

1. If mode is 2D, evaluate against `references/canvas-feasibility-rubric.md`.
2. If mode is 3D, evaluate against `references/webgl-feasibility-rubric.md`.
3. If any blocker is present, stop and return exactly:
`For now it's too complicated to build such a game.`
4. Do not attempt partial implementation when blocked.

### Step 4: Opponent AI Routing

1. Evaluate opponent needs using `references/opponent-ai-routing.md`.
2. If the game needs strategic/adaptive opponent decisions, route to `$vibecode-opponent-ai`.
3. If opponent behavior is simple scripted patterns, keep it inside the selected base builder skill.
4. If unclear, ask one clarifying question focused on opponent behavior and then decide.

### Step 5: Build Routing

1. If feasible and no opponent AI module is needed:
- Build directly with the selected base builder skill.
2. If feasible and opponent AI module is needed:
- Build the base game with the selected base builder skill.
- Produce a drop-in `ai.js` via `$vibecode-opponent-ai`.
- Integrate with a stable contract (`decideAction(state) => action`) and keep behavior deterministic.
3. Before writing files, pick an output slug (from game title or request).
4. Write the main game file to `games/<slug>.html`.
5. If an opponent module is used, write it to `games/<slug>-ai.js`.
6. Do not place new game deliverables at repo root unless the user explicitly asks.

## Output Contract

1. Always show the confirmed understanding before any build begins.
2. Always show the mode routing verdict (`2D` or `3D`) and selected base skill.
3. Always show the feasibility verdict (`Feasible` or fallback message) for the selected mode.
4. Always show the opponent routing verdict (`Use $vibecode-opponent-ai: Yes/No`).
5. Always state the intended output file path(s) in `games/` before implementation.
6. Only after those verdicts, begin implementation.

## Response Templates

Use these templates to keep behavior consistent.

### Confirmation Prompt

`Here is my understanding of the game build plan:
- Core loop: ...
- Win/Lose: ...
- Controls/Platform: ...
- Scope boundaries: ...
- Deliverables: games/<slug>.html (and optional games/<slug>-ai.js)
Did I understand this correctly?`

### Feasibility Rejection

`For now it's too complicated to build such a game.`

### Routing Summary

`Build mode: <2D Canvas|3D WebGL> (<$selected-base-skill>)
Feasibility with <$selected-base-skill>: Feasible
Use $vibecode-opponent-ai: <Yes|No>
Output path(s): games/<slug>.html (and optional games/<slug>-ai.js)
Next step: <start build path>`

## References

1. Mode routing guide: `references/build-mode-routing.md`
2. 2D feasibility rubric: `references/canvas-feasibility-rubric.md`
3. 3D feasibility rubric: `references/webgl-feasibility-rubric.md`
4. Opponent routing matrix: `references/opponent-ai-routing.md`

## Guardrails

1. Keep the loop strict: no build before explicit confirmation.
2. Prefer one targeted clarification question at a time.
3. Keep decisions deterministic and explainable from the rubric/matrix.
4. Do not invent unsupported capabilities for the selected base builder skill.
5. Default all generated game deliverables to the `games/` folder.

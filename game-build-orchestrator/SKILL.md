---
name: game-build-orchestrator
description: Orchestrate game delivery from an initial game idea through confirmation, feasibility gating, and build routing. Use when Codex must (1) restate and validate understanding with the user in a loop, (2) decide whether the game is feasible with $vibecode-canvas-arcade, and (3) decide whether to invoke $vibecode-opponent-ai for a deterministic opponent.
---

# Game Build Orchestrator

## Overview

Run a strict 3-gate flow before building: confirmation loop, canvas-feasibility check, and opponent-AI routing. Only build after the user confirms the plan.

## Quick Start

1. Read the user's game request.
2. Run the confirmation loop until the user explicitly confirms it works.
3. Check feasibility with `references/canvas-feasibility-rubric.md`.
4. If not feasible, stop with the required fallback message.
5. If feasible, decide opponent routing with `references/opponent-ai-routing.md`.
6. Build with `$vibecode-canvas-arcade` and optionally `$vibecode-opponent-ai`.

## Workflow

### Step 1: Confirmation Loop (Mandatory)

1. Summarize the game plan in 5 fields:
- Core loop
- Win/lose conditions
- Controls/platform
- Scope boundaries (what is explicitly out)
- Expected deliverables (HTML only, plus optional `ai.js`)
2. Ask a direct confirmation question: `Did I understand this correctly?`.
3. If the user does not confirm, ask only the minimum follow-up questions needed, update the summary, and ask again.
4. Repeat until the user explicitly confirms with clear intent (`yes`, `correct`, `works`, `go ahead`, equivalent).
5. Do not evaluate feasibility or build before confirmation.

### Step 2: Canvas Feasibility Gate

1. Evaluate against `references/canvas-feasibility-rubric.md`.
2. If any blocker is present, stop and return exactly:
`For now it's too complicated to build such a game.`
3. Do not attempt partial implementation when blocked.

### Step 3: Opponent AI Routing

1. Evaluate opponent needs using `references/opponent-ai-routing.md`.
2. If the game needs strategic/adaptive opponent decisions, route to `$vibecode-opponent-ai`.
3. If opponent behavior is simple scripted patterns, keep it inside `$vibecode-canvas-arcade`.
4. If unclear, ask one clarifying question focused on opponent behavior and then decide.

### Step 4: Build Routing

1. If feasible and no opponent AI module is needed:
- Build directly with `$vibecode-canvas-arcade`.
2. If feasible and opponent AI module is needed:
- Build the base game with `$vibecode-canvas-arcade`.
- Produce a drop-in `ai.js` via `$vibecode-opponent-ai`.
- Integrate with a stable contract (`decideAction(state) => action`) and keep behavior deterministic.

## Output Contract

1. Always show the confirmed understanding before any build begins.
2. Always show the feasibility verdict (`Feasible` or fallback message).
3. Always show the opponent routing verdict (`Use $vibecode-opponent-ai: Yes/No`).
4. Only after those verdicts, begin implementation.

## Response Templates

Use these templates to keep behavior consistent.

### Confirmation Prompt

`Here is my understanding of the game build plan:
- Core loop: ...
- Win/Lose: ...
- Controls/Platform: ...
- Scope boundaries: ...
- Deliverables: ...
Did I understand this correctly?`

### Feasibility Rejection

`For now it's too complicated to build such a game.`

### Routing Summary

`Feasibility with $vibecode-canvas-arcade: Feasible
Use $vibecode-opponent-ai: <Yes|No>
Next step: <start build path>`

## References

1. Feasibility rubric: `references/canvas-feasibility-rubric.md`
2. Opponent routing matrix: `references/opponent-ai-routing.md`

## Guardrails

1. Keep the loop strict: no build before explicit confirmation.
2. Prefer one targeted clarification question at a time.
3. Keep decisions deterministic and explainable from the rubric/matrix.
4. Do not invent unsupported capabilities for `$vibecode-canvas-arcade`.

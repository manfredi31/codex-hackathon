---
name: vibecode-opponent-ai
description: Generate drop-in JavaScript opponent AI modules (`ai.js`) for HTML games with a `decideAction(state)` action selector. Use when Codex needs FSM, Utility AI, Minimax, or A* behavior with strict legal-action enforcement, deterministic decisions, browser time budgets, and fixed deliverables (technique summary, full code, and tests), especially in vibecode-canvas-arcade projects.
---

# Vibecode Opponent AI

## Overview

Build deterministic opponent logic as a drop-in `ai.js` for browser games. Target `decideAction(state) => action` and keep outputs legal, fast, and schema-valid without adding difficulty modes.

## Quick Start

1. Confirm the user supplied all required inputs.
2. If placeholders like `{...}` remain, ask for missing fields using `assets/templates/opponent-ai-brief.md`.
3. Read `references/technique-playbook.md` and choose exactly one technique: `FSM`, `Utility AI`, `Minimax`, or `A*`.
4. Generate full `ai.js` that exports `decideAction(state)` and always returns one legal action object.
5. Return deliverables in the exact order defined in this skill.

## Required Inputs

- Technique: `FSM`, `Utility AI`, `Minimax`, or `A*`
- Rules: objective, win conditions, lose conditions, illegal moves
- Timing model: turn-based or real-time, plus `fps` for real-time
- State contract: JSON example of `state`
- Action contract: output schema and valid action list
- Performance budget: max milliseconds per decision in browser
- Randomness policy: deterministic for equal state unless `state.rngSeed` is present

## Workflow

1. Normalize the state and action contracts into explicit assumptions.
2. Implement legality first:
   - enumerate candidate actions
   - validate candidates against action schema and game rules
   - define one guaranteed legal fallback action
3. Implement the chosen decision technique with deterministic tie-break rules.
4. Add a time guard so decision logic exits before the budget and returns the best legal action found so far.
5. Generate the final response with required deliverables.

## Required Deliverables

1. Explain the chosen technique in 5-8 bullet points.
2. Provide full JavaScript for `ai.js` with `decideAction(state)`.
3. Provide exactly 3 test cases in `state -> expected action` format.
4. Do not include difficulty settings.

## Hard Constraints

- Never return illegal actions.
- Return exactly one JSON action object from `decideAction(state)`.
- Keep execution under the provided per-decision time budget in browser.
- Keep behavior deterministic for equal input state, except optional seeded randomness from `state.rngSeed`.
- Allow external libraries only when explicitly permitted by the user and still preserve drop-in usage.

## Vibecode Integration

- Keep `decideAction(state)` pure so it can be called from the `Game` manager update loop.
- For real-time games, compute action on AI ticks and reuse the action between ticks.
- Keep stable ordering for candidate actions and score sorting to prevent nondeterministic outputs.

## References

- Technique guide: `references/technique-playbook.md`
- Intake template: `assets/templates/opponent-ai-brief.md`

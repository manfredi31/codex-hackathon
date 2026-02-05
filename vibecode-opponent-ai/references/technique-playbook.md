# Technique Playbook

Use this guide to map game characteristics to one AI technique and keep output deterministic, legal, and fast.

## Technique Selection

- Use `FSM` for clear discrete modes, scripted behavior phases, and simple tactical transitions.
- Use `Utility AI` when many context signals must be weighted each frame or turn.
- Use `Minimax` for adversarial turn-based games where both sides have clear, simulated actions.
- Use `A*` when primary difficulty is pathfinding to a target under movement constraints.

## Legality-First Pattern

Always implement in this order:

1. `enumerateCandidates(state)` to build only actions from the valid action list.
2. `isLegalAction(state, action)` to enforce schema and game-rule checks.
3. `fallbackAction(state)` that is guaranteed legal in all reachable states.
4. `chooseBestLegalAction(state, legalCandidates)` for technique-specific ranking.

If no candidate survives validation, return `fallbackAction(state)`.

## Determinism Rules

- Keep a stable candidate order (fixed action list sequence).
- Use deterministic tie-break keys (for example: score, then action type, then index).
- Avoid `Math.random()` unless `state.rngSeed` exists.
- If seed exists, use a local seeded RNG initialized from `state.rngSeed`.

## Performance Rules

- Track elapsed time using `performance.now()`.
- Reserve a safety buffer before the budget limit and exit early.
- Prefer bounded search:
  - `Minimax`: iterative deepening with depth/node caps.
  - `A*`: node expansion cap and admissible heuristic.
  - `Utility AI`: constant-time score terms only.
  - `FSM`: O(1) transitions and lightweight guards.

## Output Checklist

- Include 5-8 bullets explaining the chosen technique.
- Provide complete `ai.js` with `decideAction(state)`.
- Return exactly 3 tests as `state -> expected action`.
- Do not include difficulty modes.

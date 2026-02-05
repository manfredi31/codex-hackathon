# Opponent AI Brief Template

Use this template when required inputs are missing.

## Technique

Choose one:

- `FSM`
- `Utility AI`
- `Minimax`
- `A*`

## Game Rules

- Objective:
- Win condition:
- Lose condition:
- Illegal moves:

## Timing Model

- Mode: `turn-based` or `real-time`
- Tick rate (fps): (required only for `real-time`)

## State Format

Provide:

- Function contract: `decideAction(state) => action`
- Example state JSON:

```json
{}
```

## Action Format

Provide:

- Action JSON schema:

```json
{}
```

- Valid actions list:

```text
- ACTION_NAME
```

## Hard Constraints

- Max decision time per call (ms):
- External libraries allowed: `yes` or `no`
- Determinism rule: deterministic for equal state unless `state.rngSeed` is present

## Required Deliverables

1. Explain technique in 5-8 bullet points.
2. Full `ai.js` with `decideAction(state)`.
3. Exactly 3 test cases (`state -> expected action`).
4. No difficulty settings.

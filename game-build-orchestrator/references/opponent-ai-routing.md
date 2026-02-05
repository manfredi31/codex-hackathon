# Opponent AI Routing

Use this matrix after the game is marked feasible.

## Use `$vibecode-opponent-ai` (Yes) When

1. The game needs an opponent that chooses actions from game state.
2. The user asks for competitive/adaptive behavior (bot rival, enemy commander, CPU player).
3. Legal action selection matters and must be deterministic.
4. The opponent must follow explicit state/action contracts.

## Do Not Use `$vibecode-opponent-ai` (No) When

1. Opposition can be scripted with simple movement patterns.
2. Enemy behavior is timer/path/random-spawn based only.
3. There is no explicit action schema and no decision module requirement.

## One-Question Tie Breaker

If uncertain, ask:
`Do you want a state-driven opponent module that decides legal actions each tick/turn, or simple scripted enemy behavior?`

Routing rule:
1. If state-driven module is requested, use `$vibecode-opponent-ai`.
2. If simple scripted behavior is fine, keep behavior in `$vibecode-canvas-arcade`.

# Genre Recipes

Pick one recipe as the baseline, then adapt constants and visuals.

## 1) Lane Runner (Chase Camera)

Use for endless runners and dodge games.

- Objective: survive and score by distance/time.
- Camera: fixed follow offset behind player.
- Player input: lane shift or horizontal drift with damping.
- World motion: move obstacles toward player instead of moving world chunks at first.
- Scoring: `score += dt * baseRate`, bonus on near-miss.
- Lose condition: health to zero or hard collision.
- Difficulty ramp:
1. Increase obstacle speed gradually.
2. Reduce spawn interval to a minimum clamp.
3. Add obstacle variants after score thresholds.

Starter constants:
- lanes: `[-3, 0, 3]`
- base speed: `14`
- speed ramp: `+0.18 / sec`
- spawn interval: `1.2 -> 0.35`

## 2) Arena Survival (Top-Down or Isometric)

Use for wave survival or twin-stick style games.

- Objective: survive waves, clear enemies, increase combo.
- Camera: top-down fixed angle.
- Player input: `WASD` move, mouse/keyboard fire.
- Enemy behavior: seek player + occasional strafe.
- Scoring: kills + wave bonus + damage streak.
- Lose condition: HP reaches 0.
- Difficulty ramp:
1. Increase concurrent enemy cap.
2. Add faster enemy types over time.
3. Slightly reduce pickup drop rate.

Starter constants:
- arena radius: `22`
- player speed: `9`
- enemy speed: `4.5 -> 7`
- wave duration: `25s`

## 3) Hover Dash (Forward Flight Illusion)

Use for tunnel dodgers and hover racers.

- Objective: avoid gates/walls while collecting boosts.
- Camera: cockpit or close follow with slight sway.
- Player input: horizontal and vertical drift.
- World motion: scroll track segments toward camera.
- Scoring: distance + boost chain.
- Lose condition: direct collision or energy depletion.
- Difficulty ramp:
1. Increase track scroll speed.
2. Narrow safe gaps over time.
3. Increase obstacle density in bursts.

Starter constants:
- scroll speed: `18`
- max drift speed: `11`
- boost duration: `1.4s`
- obstacle spacing: `8 -> 4`

## 4) Rail Shooter Lite

Use for guided-path action with timed firing.

- Objective: destroy targets while path auto-advances.
- Camera: predefined rail path look-at target.
- Player input: reticle movement + fire.
- Enemies: spawn in patterns with simple HP.
- Scoring: precision + streak.
- Lose condition: timer expires or HP to zero.
- Difficulty ramp:
1. Shorter reaction windows.
2. Mixed enemy movement patterns.
3. Higher required score checkpoints.

Starter constants:
- rail speed: `10`
- fire cooldown: `0.16s`
- target hp: `1..4`
- checkpoint interval: `20s`

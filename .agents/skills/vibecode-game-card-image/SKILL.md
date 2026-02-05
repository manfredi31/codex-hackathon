---
name: vibecode-game-card-image
description: Generate a polished game card image for each game folder using the OpenAI Image API. Use when creating or iterating a game so home-screen cards can show a representative visual. Produce `card.png` in the current game folder.
---

# Vibecode Game Card Image

Create one card image per game in the current working directory.

## When to use
- After generating or iterating a game.
- When `card.png` is missing or outdated.
- When the game concept changes enough that artwork should change.

## Output contract
1. Write the final image to `card.png` in the current game folder.
2. Aspect ratio should be landscape (default `1536x1024`).
3. No text overlays, no logos, no watermarks.
4. Match the game theme, mechanics, and mood from `index.html` and chat prompt.

## Workflow
1. Read the game concept from current prompt + `index.html`.
2. Build a short structured prompt:
- Subject/gameplay focus
- Style (clean arcade key art)
- Composition (single focal scene)
- Color/mood
- Constraints (no text, no watermark)
3. Run `scripts/create_game_card.py`.
4. Validate quickly (file exists and looks relevant).
5. If weak result, iterate with one targeted prompt adjustment.

## Command
```bash
python3 /Users/manfredibernardi/projects/codex-hackathon/.agents/skills/vibecode-game-card-image/scripts/create_game_card.py \
  --prompt "<art direction prompt>" \
  --out "card.png"
```

Optional:
```bash
python3 /Users/manfredibernardi/projects/codex-hackathon/.agents/skills/vibecode-game-card-image/scripts/create_game_card.py \
  --prompt "<art direction prompt>" \
  --out "card.png" \
  --size "1536x1024" \
  --quality high
```

## Requirements
- `OPENAI_API_KEY` must be set.
- Python packages: `openai`, `pillow`.

Install if needed:
```bash
python3 -m pip install openai pillow
```

## Defaults
- Model: `gpt-image-1.5`
- Size: `1536x1024`
- Quality: `medium`

## Non-goals
- Do not edit skill files.
- Do not generate multiple variants unless asked.
- Do not place output outside the current game folder unless asked.

from __future__ import annotations

from .models import ChatMessage
from .storage import GameStorage


def build_codex_prompt(
    *,
    storage: GameStorage,
    slug: str,
    prompt: str,
    chat_context: list[ChatMessage],
    skill_phaser_path: str,
    skill_playwright_path: str,
    forbidden_path: str,
) -> str:
    game = storage.read_game(slug)

    context_lines = []
    for msg in chat_context[-24:]:
        role = msg.role.upper()
        content = msg.content.strip()
        if not content:
            continue
        context_lines.append(f"{role}: {content}")

    context_block = "\n".join(context_lines) if context_lines else "(No prior chat context.)"

    return f"""
You are Codex running inside a single game's folder.

Hard requirements:
1) Use these two local skills while working:
- phaser-gamedev: {skill_phaser_path}
- playwright-testing: {skill_playwright_path}
2) Do NOT edit any skill files.
3) Do NOT read from or use this folder: {forbidden_path}
4) Edit only files in the current working directory (this game's folder).
5) Build/iterate a playable vanilla HTML/CSS/JavaScript browser game.
6) Ensure index.html exists and is the playable entrypoint.

Game metadata:
- slug: {game.slug}
- title: {game.title}

Prior chat context:
{context_block}

New user request:
{prompt.strip()}

Output expectations:
- Make the game playable by opening index.html in a browser.
- Keep code maintainable and readable.
- If adding files, keep a clean small structure.
""".strip()

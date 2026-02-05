from __future__ import annotations

import base64
from pathlib import Path

from openai import AsyncOpenAI

from .models import ChatMessage


def _build_chat_context_block(chat_context: list[ChatMessage]) -> str:
    context_lines = []
    for msg in chat_context[-24:]:
        role = msg.role.upper()
        content = msg.content.strip()
        if not content:
            continue
        context_lines.append(f"{role}: {content}")
    return "\n".join(context_lines) if context_lines else "(No prior chat context.)"


def build_game_prompt(
    *,
    prompt: str,
    chat_context: list[ChatMessage],
) -> str:
    context_block = _build_chat_context_block(chat_context)

    return f"""
You are Codex building a browser game inside this folder.

Use the $vibecode-canvas-arcade skill.
Edit only files in the current working directory.
Ensure index.html is the playable entrypoint.
Do NOT modify game.json (managed separately).

Prior chat context:
{context_block}

User request:
{prompt.strip()}
""".strip()


async def generate_title(
    *,
    prompt: str,
    chat_context: list[ChatMessage],
    model: str = "gpt-4o-mini",
) -> str:
    """Call the OpenAI API to generate a short, creative game title."""
    context_block = _build_chat_context_block(chat_context)

    system_msg = (
        "You are a creative game naming assistant. "
        "Given a game description, return ONLY a short, catchy game title. "
        "No quotes, no explanation, no punctuation beyond what the title needs. "
        "Keep it under 60 characters."
    )
    user_msg = f"Game description:\n{prompt.strip()}\n\nChat context:\n{context_block}"

    client = AsyncOpenAI()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=60,
        temperature=0.9,
    )

    title = (response.choices[0].message.content or "").strip().strip('"\'')
    return title or "Untitled Game"


async def generate_card_image(
    *,
    prompt: str,
    chat_context: list[ChatMessage],
    output_path: Path,
    model: str = "gpt-image-1",
    size: str = "1536x1024",
    quality: str = "medium",
) -> Path:
    """Generate a game card image via the OpenAI Images API and save it to *output_path*."""
    context_block = _build_chat_context_block(chat_context)

    art_prompt = (
        f"Polished arcade key-art game card for: {prompt.strip()}\n"
        f"Context: {context_block}\n"
        "Style: clean, vibrant arcade key art. "
        "Composition: one focal action scene with a readable silhouette. "
        "Constraints: no text, no logo, no watermark, no UI elements."
    )

    client = AsyncOpenAI()
    result = await client.images.generate(
        model=model,
        prompt=art_prompt,
        size=size,
        quality=quality,
    )

    if not result.data or not result.data[0].b64_json:
        raise RuntimeError("No image was returned by the API")

    image_bytes = base64.b64decode(result.data[0].b64_json)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_bytes)
    return output_path

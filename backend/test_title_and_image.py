#!/usr/bin/env python3
"""
Quick standalone test for title generation and card image generation.

Usage:
    cd backend
    python test_title_and_image.py

Requires OPENAI_API_KEY to be set in the environment.
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path

# Ensure the app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.prompting import generate_card_image, generate_title
from app.settings import load_settings


async def test_title():
    print("=" * 60)
    print("TEST 1: Title Generation")
    print("=" * 60)

    settings = load_settings()
    print(f"  Model: {settings.title_model}")

    try:
        title = await generate_title(
            prompt="A space shooter where you dodge asteroids and collect power-ups",
            chat_context=[],
            model=settings.title_model,
        )
        print(f"  ✅ Generated title: {title!r}")
        return True
    except Exception as e:
        print(f"  ❌ FAILED: {type(e).__name__}: {e}")
        return False


async def test_card_image():
    print()
    print("=" * 60)
    print("TEST 2: Card Image Generation")
    print("=" * 60)

    settings = load_settings()
    print(f"  Model: {settings.image_model}")

    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / "test_card.png"
        try:
            result = await generate_card_image(
                prompt="A space shooter where you dodge asteroids and collect power-ups",
                chat_context=[],
                output_path=output_path,
                model=settings.image_model,
            )
            size_kb = result.stat().st_size / 1024
            print(f"  ✅ Image saved: {result} ({size_kb:.1f} KB)")
            return True
        except Exception as e:
            print(f"  ❌ FAILED: {type(e).__name__}: {e}")
            return False


async def main():
    # Check for API key first
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY is not set in the environment!")
        print("   Set it with: export OPENAI_API_KEY='sk-...'")
        sys.exit(1)
    else:
        print(f"✅ OPENAI_API_KEY is set (starts with {api_key[:8]}...)")
        print()

    title_ok = await test_title()
    image_ok = await test_card_image()

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Title generation:  {'✅ PASS' if title_ok else '❌ FAIL'}")
    print(f"  Image generation:  {'✅ PASS' if image_ok else '❌ FAIL'}")

    if not (title_ok and image_ok):
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

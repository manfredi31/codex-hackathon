#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import os
from pathlib import Path

from openai import OpenAI


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a game card image with OpenAI Images API")
    parser.add_argument("--prompt", required=True, help="Prompt describing the desired card art")
    parser.add_argument("--out", default="card.png", help="Output image path")
    parser.add_argument("--model", default="gpt-image-1.5", help="Image model")
    parser.add_argument("--size", default="1536x1024", help="Image size (e.g. 1536x1024)")
    parser.add_argument("--quality", default="medium", choices=["low", "medium", "high", "auto"], help="Image quality")
    parser.add_argument("--background", default="auto", choices=["auto", "opaque", "transparent"], help="Background mode")
    return parser.parse_args()


def require_api_key() -> None:
    if os.getenv("OPENAI_API_KEY"):
        return
    raise SystemExit("OPENAI_API_KEY is not set")


def main() -> int:
    args = parse_args()
    require_api_key()

    client = OpenAI()
    result = client.images.generate(
        model=args.model,
        prompt=args.prompt,
        size=args.size,
        quality=args.quality,
        background=args.background,
    )

    if not result.data or not result.data[0].b64_json:
        raise SystemExit("No image was returned by the API")

    image_bytes = base64.b64decode(result.data[0].b64_json)
    output_path = Path(args.out)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_bytes)
    print(str(output_path.resolve()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    project_root: Path
    games_dir: Path
    codex_bin: str
    codex_model: str | None
    title_model: str
    image_model: str


def load_settings() -> Settings:
    project_root = Path(__file__).resolve().parents[2]

    # Load .env from project root so OPENAI_API_KEY (and other vars) are available.
    load_dotenv(project_root / ".env")

    games_dir = Path(os.getenv("GAMES_DIR", project_root / "games")).resolve()

    return Settings(
        project_root=project_root,
        games_dir=games_dir,
        codex_bin=os.getenv("CODEX_BIN", "codex"),
        codex_model=(os.getenv("CODEX_MODEL") or None),
        title_model=os.getenv("TITLE_MODEL", "gpt-4o-mini"),
        image_model=os.getenv("IMAGE_MODEL", "gpt-image-1"),
    )

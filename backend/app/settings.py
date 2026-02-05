from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    project_root: Path
    games_dir: Path
    codex_bin: str
    skill_phaser_path: Path
    skill_playwright_path: Path
    forbidden_path: Path


def load_settings() -> Settings:
    project_root = Path(__file__).resolve().parents[2]
    games_dir = Path(os.getenv("GAMES_DIR", project_root / "games")).resolve()

    return Settings(
        project_root=project_root,
        games_dir=games_dir,
        codex_bin=os.getenv("CODEX_BIN", "codex"),
        skill_phaser_path=Path(
            os.getenv(
                "SKILL_PHASER_PATH",
                project_root / "phaser-gamedev" / "SKILL.md",
            )
        ).resolve(),
        skill_playwright_path=Path(
            os.getenv(
                "SKILL_PLAYWRIGHT_PATH",
                project_root / "playwright-testing" / "SKILL.md",
            )
        ).resolve(),
        forbidden_path=Path(
            os.getenv("FORBIDDEN_PATH", project_root / "games-inspo")
        ).resolve(),
    )

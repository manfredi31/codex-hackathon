from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from .models import GameRecord


class GameNotFoundError(Exception):
    pass


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def slugify_title(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "game"


class GameStorage:
    def __init__(self, games_dir: Path) -> None:
        self.games_dir = games_dir

    def ensure_games_dir(self) -> None:
        self.games_dir.mkdir(parents=True, exist_ok=True)

    def list_games(self) -> list[GameRecord]:
        self.ensure_games_dir()
        games: list[GameRecord] = []
        for entry in self.games_dir.iterdir():
            if not entry.is_dir():
                continue
            try:
                games.append(self.read_game(entry.name))
            except GameNotFoundError:
                continue

        games.sort(key=lambda g: g.updatedAt, reverse=True)
        return games

    def create_game(self, title: str) -> GameRecord:
        self.ensure_games_dir()
        base_slug = slugify_title(title)
        slug = base_slug
        suffix = 2

        while (self.games_dir / slug).exists():
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        game_dir = self.games_dir / slug
        game_dir.mkdir(parents=True, exist_ok=False)
        (game_dir / ".runs").mkdir(parents=True, exist_ok=True)

        timestamp = now_utc()
        metadata = {
            "slug": slug,
            "title": title.strip(),
            "createdAt": timestamp.isoformat(),
            "updatedAt": timestamp.isoformat(),
        }
        self._write_metadata(game_dir, metadata)

        # Keep preview/play route valid before the first AI generation run.
        self._ensure_placeholder_index(game_dir, title.strip())
        return self.read_game(slug)

    def read_game(self, slug: str) -> GameRecord:
        game_dir = self.games_dir / slug
        metadata_path = game_dir / "game.json"

        if not game_dir.exists() or not metadata_path.exists():
            raise GameNotFoundError(slug)

        data = json.loads(metadata_path.read_text(encoding="utf-8"))
        if not (game_dir / "index.html").exists():
            self._ensure_placeholder_index(game_dir, data.get("title", slug))

        return GameRecord(
            slug=data["slug"],
            title=data["title"],
            createdAt=datetime.fromisoformat(data["createdAt"]),
            updatedAt=datetime.fromisoformat(data["updatedAt"]),
            previewUrl=f"/games/{data['slug']}/index.html",
        )

    def touch_game(self, slug: str) -> GameRecord:
        game_dir = self.games_dir / slug
        metadata_path = game_dir / "game.json"
        if not metadata_path.exists():
            raise GameNotFoundError(slug)

        data = json.loads(metadata_path.read_text(encoding="utf-8"))
        data["updatedAt"] = now_utc().isoformat()
        self._write_metadata(game_dir, data)
        return self.read_game(slug)

    def game_dir(self, slug: str) -> Path:
        game_dir = self.games_dir / slug
        if not game_dir.exists():
            raise GameNotFoundError(slug)
        return game_dir

    def _write_metadata(self, game_dir: Path, metadata: dict) -> None:
        (game_dir / "game.json").write_text(
            json.dumps(metadata, indent=2),
            encoding="utf-8",
        )

    def _ensure_placeholder_index(self, game_dir: Path, title: str) -> None:
        path = game_dir / "index.html"
        if path.exists():
            return

        safe_title = title.replace("<", "").replace(">", "")
        path.write_text(
            """<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>{title}</title>
  </head>
  <body style=\"font-family: system-ui; margin: 0; display: grid; place-items: center; min-height: 100vh;\">
    <div>
      <h1>{title}</h1>
      <p>Game files will appear here after the first AI generation.</p>
    </div>
  </body>
</html>
""".format(title=safe_title),
            encoding="utf-8",
        )

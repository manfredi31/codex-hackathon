from __future__ import annotations

import json
import re
import shutil
from collections.abc import Iterable
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
        games_by_slug: dict[str, GameRecord] = {}

        # Primary format: one game per folder.
        for entry in self.games_dir.iterdir():
            if not entry.is_dir():
                continue
            try:
                record = self.read_game(entry.name)
                games_by_slug[record.slug] = record
            except GameNotFoundError:
                continue

        # Legacy format compatibility: flat HTML files in games root.
        for entry in self.games_dir.glob("*.html"):
            slug = entry.stem
            if slug in games_by_slug:
                continue
            games_by_slug[slug] = self._legacy_file_record(entry)

        games = list(games_by_slug.values())
        games.sort(key=lambda g: g.updatedAt, reverse=True)
        return games

    def create_game(self, title: str | None = None) -> GameRecord:
        self.ensure_games_dir()
        normalized_title = (title or "").strip()
        if normalized_title:
            base_slug = slugify_title(normalized_title)
        else:
            base_slug = f"game-{now_utc().strftime('%Y%m%d%H%M%S')}"
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
            "title": normalized_title or "Untitled Game",
            "createdAt": timestamp.isoformat(),
            "updatedAt": timestamp.isoformat(),
        }
        self._write_metadata(game_dir, metadata)

        # Keep preview/play route valid before the first AI generation run.
        self._ensure_placeholder_index(game_dir, metadata["title"])
        return self.read_game(slug)

    def read_game(self, slug: str) -> GameRecord:
        game_dir = self.games_dir / slug
        metadata_path = game_dir / "game.json"

        if game_dir.exists():
            if metadata_path.exists():
                data = json.loads(metadata_path.read_text(encoding="utf-8"))
                if not (game_dir / "index.html").exists():
                    self._ensure_placeholder_index(game_dir, data.get("title", slug))

                return GameRecord(
                    slug=data["slug"],
                    title=data["title"],
                    createdAt=datetime.fromisoformat(data["createdAt"]),
                    updatedAt=datetime.fromisoformat(data["updatedAt"]),
                    previewUrl=f"/games/{data['slug']}/index.html",
                    imageUrl=self._image_url_for_directory(game_dir, data["slug"]),
                )

            # Folder exists without metadata: infer and bootstrap metadata.
            index_path = game_dir / "index.html"
            if index_path.exists():
                inferred = self._record_from_directory_without_metadata(slug, game_dir)
                self._write_metadata(
                    game_dir,
                    {
                        "slug": inferred.slug,
                        "title": inferred.title,
                        "createdAt": inferred.createdAt.isoformat(),
                        "updatedAt": inferred.updatedAt.isoformat(),
                    },
                )
                return inferred

        legacy_file = self.games_dir / f"{slug}.html"
        if legacy_file.exists():
            return self._legacy_file_record(legacy_file)

        raise GameNotFoundError(slug)

    def update_title(self, slug: str, title: str) -> GameRecord:
        """Set the game's title in game.json and bump updatedAt."""
        game_dir = self.games_dir / slug
        metadata_path = game_dir / "game.json"
        if not metadata_path.exists():
            raise GameNotFoundError(slug)

        data = json.loads(metadata_path.read_text(encoding="utf-8"))
        data["title"] = title
        data["updatedAt"] = now_utc().isoformat()
        self._write_metadata(game_dir, data)
        return self.read_game(slug)

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
            legacy_file = self.games_dir / f"{slug}.html"
            if not legacy_file.exists():
                raise GameNotFoundError(slug)
            game_dir = self._materialize_legacy_file_game(slug, legacy_file)
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

    def _legacy_file_record(self, html_path: Path) -> GameRecord:
        stat = html_path.stat()
        created = datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc)
        updated = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
        slug = html_path.stem
        title = self._title_from_slug(slug)
        return GameRecord(
            slug=slug,
            title=title,
            createdAt=created,
            updatedAt=updated,
            previewUrl=f"/games/{html_path.name}",
            imageUrl=self._image_url_for_legacy_file(slug),
        )

    def _record_from_directory_without_metadata(self, slug: str, game_dir: Path) -> GameRecord:
        index_path = game_dir / "index.html"
        stat = index_path.stat()
        created = datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc)
        updated = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
        return GameRecord(
            slug=slug,
            title=self._title_from_slug(slug),
            createdAt=created,
            updatedAt=updated,
            previewUrl=f"/games/{slug}/index.html",
            imageUrl=self._image_url_for_directory(game_dir, slug),
        )

    def _materialize_legacy_file_game(self, slug: str, legacy_file: Path) -> Path:
        game_dir = self.games_dir / slug
        game_dir.mkdir(parents=True, exist_ok=True)
        (game_dir / ".runs").mkdir(parents=True, exist_ok=True)

        index_path = game_dir / "index.html"
        if not index_path.exists():
            # Copy instead of move so existing direct file URLs still work.
            shutil.copy2(legacy_file, index_path)

        record = self._record_from_directory_without_metadata(slug, game_dir)
        self._write_metadata(
            game_dir,
            {
                "slug": record.slug,
                "title": record.title,
                "createdAt": record.createdAt.isoformat(),
                "updatedAt": record.updatedAt.isoformat(),
            },
        )

        return game_dir

    def _title_from_slug(self, slug: str) -> str:
        words = [word for word in slug.replace("_", "-").split("-") if word]
        return " ".join(word.capitalize() for word in words) or "Game"

    def _image_url_for_directory(self, game_dir: Path, slug: str) -> str | None:
        for filename in self._card_image_candidates():
            candidate = game_dir / filename
            if candidate.exists():
                return f"/games/{slug}/{filename}"
        return None

    def _image_url_for_legacy_file(self, slug: str) -> str | None:
        for suffix in ("png", "jpg", "jpeg", "webp"):
            candidate = self.games_dir / f"{slug}.{suffix}"
            if candidate.exists():
                return f"/games/{candidate.name}"
        return None

    def _card_image_candidates(self) -> Iterable[str]:
        return (
            "card.png",
            "card.jpg",
            "card.jpeg",
            "card.webp",
            "cover.png",
            "cover.jpg",
            "cover.jpeg",
            "cover.webp",
            "thumbnail.png",
            "thumbnail.jpg",
            "thumbnail.jpeg",
            "thumbnail.webp",
        )

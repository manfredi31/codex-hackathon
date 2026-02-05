from __future__ import annotations

import json
import time
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.models import RunStatus
from app.settings import Settings


def make_client(tmp_path: Path) -> TestClient:
    games_dir = tmp_path / "games"
    fixture_root = Path(__file__).parent / "fixtures"
    codex_bin = fixture_root / "fake_codex.py"

    settings = Settings(
        project_root=tmp_path,
        games_dir=games_dir,
        codex_bin=str(codex_bin),
        skill_phaser_path=tmp_path / "phaser-gamedev" / "SKILL.md",
        skill_playwright_path=tmp_path / "playwright-testing" / "SKILL.md",
        forbidden_path=tmp_path / "games-inspo",
    )

    app = create_app(settings)
    return TestClient(app)


def wait_for_run_completion(client: TestClient, run_id: str, timeout_seconds: float = 10.0):
    manager = client.app.state.run_manager
    start = time.time()
    while time.time() - start < timeout_seconds:
        run = manager.get_run(run_id)
        if run and run.status in {RunStatus.completed, RunStatus.failed, RunStatus.cancelled}:
            return run
        time.sleep(0.05)
    raise AssertionError(f"run {run_id} did not finish in time")


def test_create_and_list_games(tmp_path: Path):
    with make_client(tmp_path) as client:
        response = client.post("/api/games", json={"title": "Space Survivor"})
        assert response.status_code == 200
        created = response.json()
        assert created["slug"] == "space-survivor"

        list_response = client.get("/api/games")
        assert list_response.status_code == 200
        games = list_response.json()
        assert len(games) == 1
        assert games[0]["title"] == "Space Survivor"


def test_slug_collision(tmp_path: Path):
    with make_client(tmp_path) as client:
        first = client.post("/api/games", json={"title": "Puzzle Quest"}).json()
        second = client.post("/api/games", json={"title": "Puzzle Quest"}).json()

        assert first["slug"] == "puzzle-quest"
        assert second["slug"] == "puzzle-quest-2"


def test_generate_run_and_sse(tmp_path: Path):
    with make_client(tmp_path) as client:
        created = client.post("/api/games", json={"title": "Racer"}).json()
        slug = created["slug"]

        run_response = client.post(
            f"/api/games/{slug}/generate",
            json={"prompt": "Build a tiny racing game", "chatContext": []},
        )
        assert run_response.status_code == 200
        run_id = run_response.json()["runId"]

        finished_events: list[dict] = []

        with client.stream("GET", f"/api/runs/{run_id}/events") as stream:
            assert stream.status_code == 200
            for line in stream.iter_lines():
                if not line or not line.startswith("data: "):
                    continue
                event = json.loads(line.replace("data: ", "", 1))
                finished_events.append(event)
                if event["type"] == "run_finished":
                    break

        run = wait_for_run_completion(client, run_id)
        assert run.status == RunStatus.completed

        index_path = tmp_path / "games" / slug / "index.html"
        assert index_path.exists()

        run_log = tmp_path / "games" / slug / ".runs" / f"{run_id}.jsonl"
        assert run_log.exists()
        assert any(e["type"] == "run_finished" for e in finished_events)

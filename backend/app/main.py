from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from .models import (
    CancelRunResponse,
    CreateGameRequest,
    GameRecord,
    GenerateGameRequest,
    GenerateGameResponse,
)
from .run_manager import RunManager, stream_run_events
from .settings import Settings, load_settings
from .storage import GameNotFoundError, GameStorage


def create_app(settings: Optional[Settings] = None) -> FastAPI:
    app_settings = settings or load_settings()
    storage = GameStorage(app_settings.games_dir)
    manager = RunManager(
        storage=storage,
        project_root=app_settings.project_root,
        codex_bin=app_settings.codex_bin,
        codex_model=app_settings.codex_model,
        title_model=app_settings.title_model,
        image_model=app_settings.image_model,
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        storage.ensure_games_dir()
        await manager.start()
        yield
        await manager.shutdown()

    app = FastAPI(title="AI Game Studio API", lifespan=lifespan)
    app.state.storage = storage
    app.state.run_manager = manager
    storage.ensure_games_dir()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/games", StaticFiles(directory=app_settings.games_dir), name="games")

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/games", response_model=list[GameRecord])
    async def list_games() -> list[GameRecord]:
        return storage.list_games()

    @app.post("/api/games", response_model=GameRecord)
    async def create_game(request: Optional[CreateGameRequest] = None) -> GameRecord:
        return storage.create_game(request.title if request else None)

    @app.get("/api/games/{slug}", response_model=GameRecord)
    async def get_game(slug: str) -> GameRecord:
        try:
            return storage.read_game(slug)
        except GameNotFoundError as error:
            raise HTTPException(status_code=404, detail="Game not found") from error

    @app.post("/api/games/{slug}/generate", response_model=GenerateGameResponse)
    async def generate_game(slug: str, request: GenerateGameRequest) -> GenerateGameResponse:
        try:
            run = await manager.enqueue(
                slug=slug,
                prompt=request.prompt,
                chat_context=request.chatContext,
            )
        except GameNotFoundError as error:
            raise HTTPException(status_code=404, detail="Game not found") from error

        return GenerateGameResponse(runId=run.run_id)

    @app.get("/api/runs/{run_id}/events")
    async def run_events(run_id: str) -> StreamingResponse:
        run = manager.get_run(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        return StreamingResponse(
            stream_run_events(run),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    @app.post("/api/runs/{run_id}/cancel", response_model=CancelRunResponse)
    async def cancel_run(run_id: str) -> CancelRunResponse:
        run = await manager.cancel(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        return CancelRunResponse(runId=run.run_id, status=run.status)

    return app


app = create_app()

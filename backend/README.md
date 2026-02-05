# Backend (FastAPI)

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

- `GAMES_DIR`: overrides default `<repo>/games`
- `CODEX_BIN`: overrides codex binary path (default `codex`)
- `SKILL_PHASER_PATH`: override skill path
- `SKILL_PLAYWRIGHT_PATH`: override skill path
- `FORBIDDEN_PATH`: folder codex prompt forbids (default `<repo>/games-inspo`)

## API

- `GET /api/games`
- `POST /api/games`
- `GET /api/games/{slug}`
- `POST /api/games/{slug}/generate`
- `GET /api/runs/{runId}/events`
- `POST /api/runs/{runId}/cancel`

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
- `CODEX_MODEL`: optional model name passed to `codex exec -m ...` (overrides your local codex default model)
- `TITLE_MODEL`: OpenAI model for game title generation (default `gpt-4o-mini`)
- `IMAGE_MODEL`: OpenAI model for card image generation (default `gpt-image-1`)

## API

- `GET /api/games`
- `POST /api/games`
- `GET /api/games/{slug}`
- `POST /api/games/{slug}/generate`
- `GET /api/runs/{runId}/events`
- `POST /api/runs/{runId}/cancel`

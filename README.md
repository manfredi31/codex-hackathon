# AI Game Studio MVP

A local single-user app to create browser games with Codex, iterate via chat, and play published games.

## Structure

- `frontend/`: React + TypeScript + Vite UI
- `backend/`: FastAPI API and Codex run orchestration
- `games/`: generated game folders (`games/<slug>`)

## Run

1. Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

2. Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Notes

- Each generation run spawns:

```bash
codex exec --dangerously-bypass-approvals-and-sandbox --json --cd <gameDir> --output-last-message <runLastMessagePath> -
```

- Run logs are stored in `games/<slug>/.runs/<runId>.jsonl`
- Final Codex message is stored in `games/<slug>/.runs/<runId>.last.txt`

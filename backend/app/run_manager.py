from __future__ import annotations

import asyncio
import json
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .models import ChatMessage, RunStatus
from .prompting import build_codex_prompt
from .storage import GameNotFoundError, GameStorage


@dataclass
class RunState:
    run_id: str
    slug: str
    prompt: str
    chat_context: list[ChatMessage]
    status: RunStatus
    created_at: datetime
    queue_position: int | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    process: asyncio.subprocess.Process | None = None
    return_code: int | None = None
    last_message: str | None = None
    error: str | None = None
    cancelled: bool = False
    subscribers: set[asyncio.Queue] = field(default_factory=set)
    backlog: list[dict[str, Any]] = field(default_factory=list)

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        for event in self.backlog:
            queue.put_nowait(event)
        self.subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        self.subscribers.discard(queue)


class RunManager:
    def __init__(
        self,
        *,
        storage: GameStorage,
        project_root: Path,
        codex_bin: str,
        skill_phaser_path: Path,
        skill_playwright_path: Path,
        forbidden_path: Path,
    ) -> None:
        self.storage = storage
        self.project_root = project_root
        self.codex_bin = codex_bin
        self.skill_phaser_path = skill_phaser_path
        self.skill_playwright_path = skill_playwright_path
        self.forbidden_path = forbidden_path

        self._runs: dict[str, RunState] = {}
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._lock = asyncio.Lock()
        self._worker_task: asyncio.Task | None = None

    async def start(self) -> None:
        if self._worker_task and not self._worker_task.done():
            return
        self._worker_task = asyncio.create_task(self._worker_loop())

    async def shutdown(self) -> None:
        if not self._worker_task:
            return
        self._worker_task.cancel()
        try:
            await self._worker_task
        except asyncio.CancelledError:
            pass

    async def enqueue(
        self,
        *,
        slug: str,
        prompt: str,
        chat_context: list[ChatMessage],
    ) -> RunState:
        self.storage.game_dir(slug)

        run = RunState(
            run_id=uuid.uuid4().hex,
            slug=slug,
            prompt=prompt,
            chat_context=chat_context,
            status=RunStatus.queued,
            created_at=datetime.now(timezone.utc),
        )

        async with self._lock:
            self._runs[run.run_id] = run
            await self._queue.put(run.run_id)
            self._refresh_queue_positions_locked()

        await self._emit(run, "status", {"status": RunStatus.queued.value})
        return run

    def get_run(self, run_id: str) -> RunState | None:
        return self._runs.get(run_id)

    async def cancel(self, run_id: str) -> RunState | None:
        run = self._runs.get(run_id)
        if not run:
            return None

        if run.status in {RunStatus.completed, RunStatus.failed, RunStatus.cancelled}:
            return run

        run.cancelled = True

        if run.status == RunStatus.running and run.process:
            run.process.terminate()
            await self._emit(run, "status", {"status": "cancelling"})
            return run

        run.status = RunStatus.cancelled
        run.finished_at = datetime.now(timezone.utc)
        await self._emit(run, "status", {"status": RunStatus.cancelled.value})
        await self._emit(
            run,
            "run_finished",
            {
                "status": RunStatus.cancelled.value,
                "returnCode": None,
                "lastMessage": run.last_message,
            },
        )

        async with self._lock:
            self._refresh_queue_positions_locked()

        return run

    async def _worker_loop(self) -> None:
        while True:
            run_id = await self._queue.get()
            run = self._runs.get(run_id)
            if not run:
                continue

            if run.status == RunStatus.cancelled:
                continue

            async with self._lock:
                self._refresh_queue_positions_locked()

            await self._execute_run(run)

            async with self._lock:
                self._refresh_queue_positions_locked()

    async def _execute_run(self, run: RunState) -> None:
        run_dir = self.storage.game_dir(run.slug)
        runs_dir = run_dir / ".runs"
        runs_dir.mkdir(parents=True, exist_ok=True)

        last_message_path = runs_dir / f"{run.run_id}.last.txt"

        run.status = RunStatus.running
        run.started_at = datetime.now(timezone.utc)
        run.queue_position = None
        await self._emit(run, "status", {"status": RunStatus.running.value})

        prompt = build_codex_prompt(
            storage=self.storage,
            slug=run.slug,
            prompt=run.prompt,
            chat_context=run.chat_context,
            skill_phaser_path=str(self.skill_phaser_path),
            skill_playwright_path=str(self.skill_playwright_path),
            forbidden_path=str(self.forbidden_path),
        )

        cmd = [
            self.codex_bin,
            "exec",
            "--dangerously-bypass-approvals-and-sandbox",
            "--json",
            "--cd",
            str(run_dir),
            "--output-last-message",
            str(last_message_path),
            "-",
        ]

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.project_root),
                env={**os.environ},
            )
        except FileNotFoundError:
            run.status = RunStatus.failed
            run.error = f"Codex binary not found: {self.codex_bin}"
            run.finished_at = datetime.now(timezone.utc)
            await self._emit(run, "error", {"message": run.error})
            await self._emit(
                run,
                "run_finished",
                {
                    "status": run.status.value,
                    "returnCode": None,
                    "lastMessage": None,
                    "error": run.error,
                },
            )
            return

        run.process = process

        if process.stdin:
            process.stdin.write(prompt.encode("utf-8"))
            await process.stdin.drain()
            process.stdin.close()

        stdout_task = asyncio.create_task(self._consume_stdout(run, process.stdout))
        stderr_task = asyncio.create_task(self._consume_stderr(run, process.stderr))

        return_code = await process.wait()
        await stdout_task
        await stderr_task

        run.return_code = return_code
        run.finished_at = datetime.now(timezone.utc)

        if last_message_path.exists():
            run.last_message = last_message_path.read_text(encoding="utf-8").strip()

        if run.cancelled and return_code != 0:
            run.status = RunStatus.cancelled
        elif return_code == 0:
            run.status = RunStatus.completed
            self.storage.touch_game(run.slug)
        else:
            run.status = RunStatus.failed
            if not run.error:
                run.error = f"Codex exited with code {return_code}"

        await self._emit(
            run,
            "run_finished",
            {
                "status": run.status.value,
                "returnCode": run.return_code,
                "lastMessage": run.last_message,
                "error": run.error,
            },
        )

    async def _consume_stdout(
        self,
        run: RunState,
        stream: asyncio.StreamReader | None,
    ) -> None:
        if stream is None:
            return

        while True:
            line = await stream.readline()
            if not line:
                return

            text = line.decode("utf-8", errors="replace").strip()
            if not text:
                continue

            try:
                payload = json.loads(text)
                await self._emit(run, "codex_event", {"event": payload})
            except json.JSONDecodeError:
                await self._emit(run, "codex_text", {"text": text})

    async def _consume_stderr(
        self,
        run: RunState,
        stream: asyncio.StreamReader | None,
    ) -> None:
        if stream is None:
            return

        while True:
            line = await stream.readline()
            if not line:
                return

            text = line.decode("utf-8", errors="replace").strip()
            if not text:
                continue

            await self._emit(run, "stderr", {"text": text})

    async def _emit(self, run: RunState, event_type: str, payload: dict[str, Any]) -> None:
        event = {
            "type": event_type,
            "runId": run.run_id,
            "slug": run.slug,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }

        run.backlog.append(event)
        for queue in list(run.subscribers):
            queue.put_nowait(event)

        event_path = self.storage.game_dir(run.slug) / ".runs" / f"{run.run_id}.jsonl"
        event_path.parent.mkdir(parents=True, exist_ok=True)
        with event_path.open("a", encoding="utf-8") as file:
            file.write(json.dumps(event) + "\n")

    def _refresh_queue_positions_locked(self) -> None:
        queued_runs = sorted(
            (
                run
                for run in self._runs.values()
                if run.status == RunStatus.queued and not run.cancelled
            ),
            key=lambda run: run.created_at,
        )

        for index, run in enumerate(queued_runs, start=1):
            if run.queue_position == index:
                continue
            run.queue_position = index
            asyncio.create_task(
                self._emit(
                    run,
                    "queue_position",
                    {"position": index},
                )
            )

        queued_ids = {run.run_id for run in queued_runs}
        for run in self._runs.values():
            if run.run_id not in queued_ids and run.status != RunStatus.queued:
                run.queue_position = None


async def stream_run_events(run: RunState):
    queue = run.subscribe()
    try:
        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"

            if event["type"] == "run_finished":
                return
    finally:
        run.unsubscribe(queue)

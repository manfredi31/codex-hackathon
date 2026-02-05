from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from .models import ChatMessage, RunStatus

logger = logging.getLogger(__name__)
from .prompting import build_game_prompt, generate_card_image, generate_title
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
    session_id: str | None = None
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
        codex_model: str | None,
        title_model: str,
        image_model: str,
    ) -> None:
        self.storage = storage
        self.project_root = project_root
        self.codex_bin = codex_bin
        self.codex_model = codex_model
        self.title_model = title_model
        self.image_model = image_model

        self._runs: dict[str, RunState] = {}
        self._queue: Optional[asyncio.Queue[str]] = None
        self._lock: Optional[asyncio.Lock] = None
        self._worker_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        if self._queue is None:
            self._queue = asyncio.Queue()
        if self._lock is None:
            self._lock = asyncio.Lock()
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

        if self._lock is None or self._queue is None:
            raise RuntimeError("RunManager must be started before enqueue")

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

        if run.status == RunStatus.running:
            if run.process:
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

        if self._lock is None:
            raise RuntimeError("RunManager lock is not initialized")

        async with self._lock:
            self._refresh_queue_positions_locked()

        return run

    async def _worker_loop(self) -> None:
        while True:
            if self._queue is None or self._lock is None:
                raise RuntimeError("RunManager queue is not initialized")

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

        run.status = RunStatus.running
        run.started_at = datetime.now(timezone.utc)
        run.queue_position = None
        await self._emit(run, "status", {"status": RunStatus.running.value})

        # Check whether we can resume an existing Codex session for this game.
        existing_session_id = self._load_session_id(run.slug)

        if existing_session_id:
            # Resume: send only the user's latest message; Codex already has
            # the full conversation history.
            game_prompt = run.prompt.strip()
            last_message_path: Path | None = None
        else:
            # New session: build the full prompt with system instructions and
            # prior chat context.
            game_prompt = build_game_prompt(
                prompt=run.prompt,
                chat_context=run.chat_context,
            )
            last_message_path = runs_dir / f"{run.run_id}.last.txt"

        # --- Launch primary game Codex process ---
        try:
            game_proc = await self._spawn_codex(
                run_dir,
                game_prompt,
                last_message_path,
                session_id=existing_session_id,
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

        run.process = game_proc

        # --- Generate title via OpenAI API (only for untitled games) ---
        game = self.storage.read_game(run.slug)
        if game.title == "Untitled Game":
            asyncio.create_task(self._generate_and_save_title(run))

        # --- Generate card image via OpenAI Images API (only when missing) ---
        if not game.imageUrl:
            asyncio.create_task(self._generate_and_save_card_image(run))

        # --- Stream the game process output to the client ---
        stdout_task = asyncio.create_task(self._consume_stdout(run, game_proc.stdout))
        stderr_task = asyncio.create_task(self._consume_stderr(run, game_proc.stderr))

        # Wait for the game process — this is what the user cares about.
        return_code = await game_proc.wait()
        await stdout_task
        await stderr_task

        run.return_code = return_code
        run.finished_at = datetime.now(timezone.utc)

        if last_message_path and last_message_path.exists():
            run.last_message = last_message_path.read_text(encoding="utf-8").strip()

        # Persist the session ID so the next run for this game can resume.
        if run.session_id:
            self._save_session_id(run.slug, run.session_id)

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

    # ------------------------------------------------------------------
    # Session persistence helpers
    # ------------------------------------------------------------------

    def _load_session_id(self, slug: str) -> str | None:
        """Load persisted Codex session ID for a game, if any."""
        session_file = self.storage.game_dir(slug) / ".codex_session"
        if session_file.exists():
            return session_file.read_text(encoding="utf-8").strip() or None
        return None

    def _save_session_id(self, slug: str, session_id: str) -> None:
        """Persist Codex session ID so subsequent runs can resume."""
        session_file = self.storage.game_dir(slug) / ".codex_session"
        session_file.write_text(session_id, encoding="utf-8")

    # ------------------------------------------------------------------
    # Codex subprocess helpers
    # ------------------------------------------------------------------

    async def _spawn_codex(
        self,
        cwd: Path,
        prompt: str,
        last_message_path: Path | None = None,
        session_id: str | None = None,
    ) -> asyncio.subprocess.Process:
        """Spawn a Codex CLI process.

        When *session_id* is provided the process uses ``codex exec resume``
        to continue an existing conversation.  Otherwise a fresh session is
        created with ``codex exec``.
        """
        if session_id:
            # Resume an existing Codex session.
            cmd = [
                self.codex_bin,
                "exec",
                "resume",
                "--dangerously-bypass-approvals-and-sandbox",
                "--json",
            ]
            if self.codex_model:
                cmd.extend(["-m", self.codex_model])
            # Positional args: SESSION_ID then PROMPT ("-" = read from stdin).
            cmd.extend([session_id, "-"])
        else:
            # Start a brand-new session.
            cmd = [
                self.codex_bin,
                "exec",
                "--dangerously-bypass-approvals-and-sandbox",
                "--json",
                "--cd",
                str(cwd),
            ]
            if last_message_path:
                cmd.extend(["--output-last-message", str(last_message_path)])
            cmd.append("-")

            if self.codex_model:
                cmd[2:2] = ["-m", self.codex_model]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(self.project_root),
            env={**os.environ},
        )

        if process.stdin:
            process.stdin.write(prompt.encode("utf-8"))
            await process.stdin.drain()
            process.stdin.close()

        return process

    async def _generate_and_save_title(self, run: RunState) -> None:
        """Generate a game title via the OpenAI API and write it to game.json."""
        try:
            title = await generate_title(
                prompt=run.prompt,
                chat_context=run.chat_context,
                model=self.title_model,
            )
            self.storage.update_title(run.slug, title)
            await self._emit(run, "metadata_updated", {"task": "title"})
        except Exception:
            logger.exception("Title generation failed for slug=%s", run.slug)

    async def _generate_and_save_card_image(self, run: RunState) -> None:
        """Generate a card image via the OpenAI Images API and save it to the game folder."""
        try:
            run_dir = self.storage.game_dir(run.slug)
            output_path = run_dir / "card.png"
            await generate_card_image(
                prompt=run.prompt,
                chat_context=run.chat_context,
                output_path=output_path,
                model=self.image_model,
            )
            self.storage.touch_game(run.slug)
            await self._emit(run, "metadata_updated", {"task": "image"})
        except Exception:
            logger.exception("Card image generation failed for slug=%s", run.slug)

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
                event = json.loads(text)
            except json.JSONDecodeError:
                # Non-JSON line (e.g. a CLI warning) — skip, don't abort.
                continue

            if not isinstance(event, dict):
                continue

            await self._forward_codex_event(run, event)

    async def _forward_codex_event(
        self, run: RunState, event: dict[str, Any]
    ) -> None:
        """Route a single ``codex exec --json`` JSONL event.

        The stdout format uses top-level ``type`` values such as
        ``thread.started``, ``item.started``, ``item.completed``, and
        ``turn.completed``.  The ``item`` dict carries a nested ``type``
        (``reasoning``, ``command_execution``, ``agent_message``, etc.).
        """
        top_type = event.get("type", "")

        # --- Session / thread ID ---
        if top_type == "thread.started":
            thread_id = event.get("thread_id")
            if isinstance(thread_id, str) and thread_id:
                run.session_id = thread_id
            return

        # --- Item events (the interesting ones) ---
        item = event.get("item")
        if not isinstance(item, dict):
            return

        item_type = item.get("type", "")
        item_id = item.get("id", "")

        # Thinking / reasoning
        if item_type == "reasoning" and top_type == "item.completed":
            text = item.get("text", "")
            if isinstance(text, str) and text.strip():
                await self._emit(
                    run, "codex_thinking", {"text": text.strip()}
                )
            return

        # Tool call started (shell command or other execution)
        if item_type == "command_execution" and top_type == "item.started":
            command = item.get("command", "")
            await self._emit(
                run,
                "codex_tool_call",
                {
                    "callId": item_id,
                    "name": "shell_command",
                    "input": command if isinstance(command, str) else str(command),
                },
            )
            return

        # Tool call completed — emit the output
        if item_type == "command_execution" and top_type == "item.completed":
            output = item.get("aggregated_output", "")
            if not isinstance(output, str):
                output = str(output)
            if len(output) > 500:
                output = output[:500] + "\u2026"
            exit_code = item.get("exit_code")
            await self._emit(
                run,
                "codex_tool_output",
                {
                    "callId": item_id,
                    "output": output,
                    "exitCode": exit_code,
                },
            )
            return

        # File-edit tool calls (apply_patch and similar)
        if item_type in ("local_shell_call", "tool_call") and top_type in (
            "item.started",
            "item.completed",
        ):
            name = item.get("name", item_type)
            if top_type == "item.started":
                raw_input = item.get("arguments") or item.get("input") or ""
                display = self._summarize_tool_input(name, raw_input)
                await self._emit(
                    run,
                    "codex_tool_call",
                    {"callId": item_id, "name": name, "input": display},
                )
            else:
                raw_output = item.get("output", "")
                if not isinstance(raw_output, str):
                    raw_output = str(raw_output)
                if len(raw_output) > 500:
                    raw_output = raw_output[:500] + "\u2026"
                await self._emit(
                    run,
                    "codex_tool_output",
                    {"callId": item_id, "output": raw_output},
                )
            return

        # Assistant text message
        if item_type == "agent_message" and top_type == "item.completed":
            text = item.get("text", "")
            if isinstance(text, str) and text.strip():
                await self._emit(
                    run, "assistant_response", {"text": text.strip()}
                )
            return

    @staticmethod
    def _summarize_tool_input(name: str, raw_input: Any) -> str:
        """Produce a short human-readable label for a tool invocation."""
        if not isinstance(raw_input, str):
            return str(raw_input)[:200]
        if name == "apply_patch":
            for patch_line in raw_input.splitlines():
                if patch_line.startswith(("*** Update File:", "*** Add File:")):
                    return patch_line.split(":", 1)[-1].strip()
            return "(file edit)"
        if name == "shell_command":
            try:
                args = json.loads(raw_input)
                return args.get("command", raw_input)
            except (json.JSONDecodeError, AttributeError):
                pass
        return raw_input[:200]

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

            if not run.error:
                run.error = text

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

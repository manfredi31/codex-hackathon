from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1)


class CreateGameRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)


class GenerateGameRequest(BaseModel):
    prompt: str = Field(min_length=1)
    chatContext: list[ChatMessage] = Field(default_factory=list)


class GameRecord(BaseModel):
    slug: str
    title: str
    createdAt: datetime
    updatedAt: datetime
    previewUrl: str
    imageUrl: Optional[str] = None


class RunStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class GenerateGameResponse(BaseModel):
    runId: str


class CancelRunResponse(BaseModel):
    runId: str
    status: RunStatus


class RunEvent(BaseModel):
    type: str
    runId: str
    slug: str
    timestamp: datetime
    payload: dict

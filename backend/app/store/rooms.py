import asyncio
from dataclasses import dataclass, field

from app.db.models import Series as SeriesORM
from app.models.draft import DraftState


@dataclass
class DraftRoom:
    series: SeriesORM
    state: DraftState
    timer_task: asyncio.Task | None = None
    blue_ready: bool = False
    red_ready: bool = False
    fearless_pool: set[str] = field(default_factory=set)


# In-memory store of active rooms keyed by series_id
rooms: dict[str, DraftRoom] = {}

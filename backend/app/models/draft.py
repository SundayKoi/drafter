from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class DraftPhase(str, Enum):
    WAITING = "WAITING"
    BAN_1 = "BAN_1"
    PICK_1 = "PICK_1"
    BAN_2 = "BAN_2"
    PICK_2 = "PICK_2"
    COMPLETE = "COMPLETE"


class SlotState(BaseModel):
    slot_index: int = Field(..., ge=0, le=19)
    side: Literal["blue", "red"]
    action_type: Literal["ban", "pick"]
    champion_id: str | None = None
    locked: bool = False


class DraftState(BaseModel):
    game_id: str
    series_id: str
    game_number: int = Field(..., ge=1)
    phase: DraftPhase = DraftPhase.WAITING
    current_slot_index: int = Field(0, ge=0, le=20)
    slots: list[SlotState] = Field(..., min_length=20, max_length=20)
    first_pick_side: Literal["blue", "red"]
    blue_ready: bool = False
    red_ready: bool = False
    timer_seconds_remaining: int = 0
    fearless_pool: list[str] = Field(default_factory=list)
    fearless_mode: bool = False
    blue_team_name: str | None = None
    red_team_name: str | None = None

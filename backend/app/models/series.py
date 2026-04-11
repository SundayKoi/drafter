from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.models.draft import DraftState


class SeriesConfig(BaseModel):
    name: str = Field(..., max_length=200, min_length=1)
    format: Literal["bo1", "bo3", "bo5"]
    fearless: bool = False
    patch: str = Field(..., max_length=20)
    timer_seconds: int = Field(30, ge=10, le=120)
    game1_first_pick: Literal["blue", "red", "coin_flip"] = "blue"
    blue_team_name: str | None = Field(None, max_length=100)
    red_team_name: str | None = Field(None, max_length=100)

    @model_validator(mode="after")
    def no_fearless_bo1(self):
        if self.format == "bo1" and self.fearless:
            raise ValueError("Fearless mode requires Bo3 or Bo5")
        return self


class GameSummary(BaseModel):
    game_number: int
    winner: Literal["blue", "red"] | None
    first_pick_side: Literal["blue", "red"]
    draft_state: DraftState | None = None


class SeriesState(BaseModel):
    series_id: str
    format: Literal["bo1", "bo3", "bo5"]
    fearless: bool
    current_game_number: int
    max_games: int
    games_needed_to_win: int
    blue_score: int
    red_score: int
    blue_team_name: str | None
    red_team_name: str | None
    status: Literal["pending", "in_progress", "complete"]
    games: list[GameSummary]
    fearless_pool: list[str]
    current_draft: DraftState | None = None

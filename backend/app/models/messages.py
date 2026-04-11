from typing import Any, Literal

from pydantic import BaseModel


# --- Client -> Server ---

class ReadyMessage(BaseModel):
    type: Literal["READY"] = "READY"


class HoverMessage(BaseModel):
    type: Literal["HOVER"] = "HOVER"
    payload: dict  # { champion_id: str }


class LockInMessage(BaseModel):
    type: Literal["LOCK_IN"] = "LOCK_IN"
    payload: dict  # { champion_id: str }


class ReportWinnerMessage(BaseModel):
    type: Literal["REPORT_WINNER"] = "REPORT_WINNER"
    payload: dict  # { winner: "blue" | "red" }


class StartNextGameMessage(BaseModel):
    type: Literal["START_NEXT_GAME"] = "START_NEXT_GAME"
    payload: dict  # { first_pick_override?: "blue" | "red" }


class PingMessage(BaseModel):
    type: Literal["PING"] = "PING"


# --- Server -> Client (constructed as dicts for broadcast) ---

def sync_message(draft: dict, series: dict) -> dict:
    return {"type": "SYNC", "payload": {"draft": draft, "series": series}}


def timer_tick_message(seconds_remaining: int) -> dict:
    return {"type": "TIMER_TICK", "payload": {"seconds_remaining": seconds_remaining}}


def hover_update_message(champion_id: str, side: str) -> dict:
    return {"type": "HOVER_UPDATE", "payload": {"champion_id": champion_id, "side": side}}


def series_sync_message(series: dict) -> dict:
    return {"type": "SERIES_SYNC", "payload": series}


def game_complete_message(game_number: int, winner: str, series: dict) -> dict:
    return {
        "type": "GAME_COMPLETE",
        "payload": {"game_number": game_number, "winner": winner, "series": series},
    }


def series_complete_message(winner: str, blue_score: int, red_score: int) -> dict:
    return {
        "type": "SERIES_COMPLETE",
        "payload": {"winner": winner, "blue_score": blue_score, "red_score": red_score},
    }


def next_game_starting_message(
    game_number: int, first_pick_side: str, fearless_pool: list[str],
) -> dict:
    return {
        "type": "NEXT_GAME_STARTING",
        "payload": {
            "game_number": game_number,
            "first_pick_side": first_pick_side,
            "fearless_pool": fearless_pool,
        },
    }


def error_message(code: str, message: str) -> dict:
    return {"type": "ERROR", "payload": {"code": code, "message": message}}


def pong_message() -> dict:
    return {"type": "PONG"}

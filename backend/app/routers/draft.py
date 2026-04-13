import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import series_repo
from app.logic.draft_order import determine_first_pick
from app.logic.fearless import build_fearless_pool
from app.security.rate_limit import limiter
from app.security.tokens import verify_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/draft", tags=["draft"])

FORMAT_MAX_GAMES = {"bo1": 1, "bo3": 3, "bo5": 5}


class NextGameRequest(BaseModel):
    winner: Literal["blue", "red"]
    first_pick_override: Literal["blue", "red"] | None = None


async def _resolve_role_http(series, token: str) -> Literal["blue", "red", "spectator"]:
    if verify_token(token, series.blue_token_hash):
        return "blue"
    if verify_token(token, series.red_token_hash):
        return "red"
    if verify_token(token, series.spectator_token_hash):
        return "spectator"
    raise HTTPException(status_code=403, detail="Invalid token")


@router.post("/{series_id}/next-game")
@limiter.limit("20/hour")
async def next_game(
    request: Request,
    series_id: str,
    body: NextGameRequest,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Record game winner, update scores, and create next game if series not over.
    Blue or red token required (not spectator).
    """
    series = await series_repo.get_series(db, series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    role = await _resolve_role_http(series, token)
    if role == "spectator":
        raise HTTPException(status_code=403, detail="Spectators cannot advance games")

    games = await series_repo.get_series_games(db, series_id)

    # Find current in-progress or most recent complete game
    current_game = next(
        (g for g in reversed(games) if g.status == "in_progress"), None
    )
    if not current_game:
        # Maybe draft just completed — find the latest complete game without a winner set via this endpoint
        current_game = next(
            (g for g in reversed(games) if g.status == "complete" and g.winner is None),
            None,
        )

    if current_game and current_game.status == "in_progress":
        # Complete the current game
        completed_dicts = [
            {"draft_state_json": g.draft_state_json}
            for g in games if g.status == "complete"
        ]
        if current_game.draft_state_json:
            completed_dicts.append({"draft_state_json": current_game.draft_state_json})

        new_fearless_pool = list(
            build_fearless_pool(completed_dicts) if series.fearless else []
        )

        await series_repo.complete_game(
            db, current_game, body.winner,
            current_game.draft_state_json or {},
            new_fearless_pool,
        )

    # Update scores
    blue_score = series.blue_score + (1 if body.winner == "blue" else 0)
    red_score = series.red_score + (1 if body.winner == "red" else 0)

    max_games = FORMAT_MAX_GAMES[series.format]
    games_needed = (max_games // 2) + 1
    series_over = blue_score >= games_needed or red_score >= games_needed

    new_status = "complete" if series_over else "in_progress"
    await series_repo.update_series_score(db, series, blue_score, red_score, new_status)

    result = {
        "blue_score": blue_score,
        "red_score": red_score,
        "series_status": new_status,
        "next_game": None,
    }

    # Create next game if series is not over
    if not series_over:
        next_game_number = len(games) + 1

        if body.first_pick_override:
            first_pick_side = body.first_pick_override
        else:
            first_pick_side = determine_first_pick(
                series.game1_first_pick, next_game_number
            )

        # Rebuild fearless pool from all completed games
        all_games = await series_repo.get_series_games(db, series_id)
        completed_dicts = [
            {"draft_state_json": g.draft_state_json}
            for g in all_games if g.status == "complete"
        ]
        fearless_pool = list(
            build_fearless_pool(completed_dicts) if series.fearless else []
        )

        new_game = await series_repo.create_game(
            db,
            series_id=series_id,
            game_number=next_game_number,
            first_pick_side=first_pick_side,
            fearless_mode=series.fearless,
            fearless_pool=fearless_pool,
        )

        result["next_game"] = {
            "game_id": new_game.id,
            "game_number": new_game.game_number,
            "first_pick_side": new_game.first_pick_side,
            "fearless_pool": fearless_pool,
        }

    return result

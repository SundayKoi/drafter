import logging
import random
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import series_repo
from app.logic.fearless import build_fearless_pool
from app.models.series import SeriesConfig
from app.security.rate_limit import limiter
from app.security.tokens import verify_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/series", tags=["series"])

FORMAT_MAX_GAMES = {"bo1": 1, "bo3": 3, "bo5": 5}


async def _resolve_role_http(
    series, token: str,
) -> Literal["blue", "red", "spectator"]:
    if verify_token(token, series.blue_token_hash):
        return "blue"
    if verify_token(token, series.red_token_hash):
        return "red"
    if verify_token(token, series.spectator_token_hash):
        return "spectator"
    raise HTTPException(status_code=403, detail="Invalid token")


@router.post("/new")
@limiter.limit("20/hour")
async def create_series(
    request: Request,
    config: SeriesConfig,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new series. Returns series_id and the three URLs with raw tokens.
    Raw tokens are shown ONCE here — never stored raw, never returned again.
    """
    # Resolve coin flip
    first_pick = config.game1_first_pick
    if first_pick == "coin_flip":
        first_pick = random.choice(["blue", "red"])

    series, blue_token, red_token, spectator_token = await series_repo.create_series(
        db,
        name=config.name,
        format=config.format,
        fearless=config.fearless,
        patch=config.patch,
        timer_seconds=config.timer_seconds,
        game1_first_pick=first_pick,
        blue_team_name=config.blue_team_name,
        red_team_name=config.red_team_name,
    )

    base_url = str(request.base_url).rstrip("/")

    return {
        "series_id": series.id,
        "blue_url": f"{base_url}/draft/{series.id}?token={blue_token}",
        "red_url": f"{base_url}/draft/{series.id}?token={red_token}",
        "spectator_url": f"{base_url}/draft/{series.id}?token={spectator_token}",
    }


@router.get("/{series_id}")
@limiter.limit("120/minute")
async def get_series(
    request: Request,
    series_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Returns series state. Requires valid token."""
    series = await series_repo.get_series(db, series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    role = await _resolve_role_http(series, token)
    games = await series_repo.get_series_games(db, series_id)

    max_games = FORMAT_MAX_GAMES[series.format]
    games_needed = (max_games // 2) + 1

    # Build fearless pool
    completed_dicts = [
        {"draft_state_json": g.draft_state_json}
        for g in games if g.status == "complete"
    ]
    fearless_pool = list(build_fearless_pool(completed_dicts)) if series.fearless else []

    # Current game
    current_game = next(
        (g for g in reversed(games) if g.status in ("pending", "in_progress")),
        None,
    )

    game_summaries = [
        {
            "game_number": g.game_number,
            "winner": g.winner,
            "first_pick_side": g.first_pick_side,
            "draft_state": g.draft_state_json,
        }
        for g in games
    ]

    current_game_number = max((g.game_number for g in games), default=1)

    return {
        "series_id": series.id,
        "format": series.format,
        "fearless": series.fearless,
        "current_game_number": current_game_number,
        "max_games": max_games,
        "games_needed_to_win": games_needed,
        "blue_score": series.blue_score,
        "red_score": series.red_score,
        "blue_team_name": series.blue_team_name,
        "red_team_name": series.red_team_name,
        "status": series.status,
        "timer_seconds": series.timer_seconds,
        "games": game_summaries,
        "fearless_pool": fearless_pool,
        "current_draft": current_game.draft_state_json if current_game else None,
        "role": role,
    }


@router.get("/{series_id}/history")
@limiter.limit("120/minute")
async def get_series_history(
    request: Request,
    series_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Returns completed games with full draft snapshots."""
    series = await series_repo.get_series(db, series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    await _resolve_role_http(series, token)
    games = await series_repo.get_series_games(db, series_id)

    return [
        {
            "game_number": g.game_number,
            "winner": g.winner,
            "first_pick_side": g.first_pick_side,
            "status": g.status,
            "draft_state": g.draft_state_json,
            "fearless_pool": g.fearless_pool_json,
            "started_at": g.started_at.isoformat() if g.started_at else None,
            "completed_at": g.completed_at.isoformat() if g.completed_at else None,
        }
        for g in games
        if g.status == "complete"
    ]

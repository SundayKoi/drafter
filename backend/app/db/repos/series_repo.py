from datetime import datetime, timezone

from nanoid import generate as nanoid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Game, Series
from app.logic.draft_order import generate_draft_order
from app.models.draft import DraftPhase, DraftState, SlotState
from app.security.tokens import generate_token, hash_token

NANOID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
NANOID_SIZE = 8

FORMAT_MAX_GAMES = {"bo1": 1, "bo3": 3, "bo5": 5}


def _generate_id() -> str:
    return nanoid(NANOID_ALPHABET, NANOID_SIZE)


def _build_initial_draft_state(
    game_id: str,
    series_id: str,
    game_number: int,
    first_pick_side: str,
    fearless_mode: bool,
    fearless_pool: list[str],
) -> dict:
    order = generate_draft_order(first_pick_side)
    slots = [
        SlotState(slot_index=i, side=side, action_type=action)
        for i, (side, action) in enumerate(order)
    ]
    state = DraftState(
        game_id=game_id,
        series_id=series_id,
        game_number=game_number,
        phase=DraftPhase.WAITING,
        current_slot_index=0,
        slots=slots,
        first_pick_side=first_pick_side,
        fearless_pool=fearless_pool,
        fearless_mode=fearless_mode,
    )
    return state.model_dump()


async def create_series(
    db: AsyncSession,
    name: str,
    format: str,
    fearless: bool,
    patch: str,
    timer_seconds: int,
    game1_first_pick: str,
    blue_team_name: str | None = None,
    red_team_name: str | None = None,
) -> tuple[Series, str, str, str]:
    """
    Creates a new series + game 1. Returns (series_orm, blue_token, red_token, spectator_token).
    Raw tokens are returned once here and never stored.
    """
    series_id = _generate_id()
    game_id = _generate_id()

    blue_token = generate_token()
    red_token = generate_token()
    spectator_token = generate_token()

    series = Series(
        id=series_id,
        name=name,
        format=format,
        fearless=fearless,
        patch=patch,
        timer_seconds=timer_seconds,
        blue_token_hash=hash_token(blue_token),
        red_token_hash=hash_token(red_token),
        spectator_token_hash=hash_token(spectator_token),
        blue_team_name=blue_team_name,
        red_team_name=red_team_name,
        blue_score=0,
        red_score=0,
        game1_first_pick=game1_first_pick,
        status="pending",
    )
    db.add(series)

    draft_state = _build_initial_draft_state(
        game_id=game_id,
        series_id=series_id,
        game_number=1,
        first_pick_side=game1_first_pick,
        fearless_mode=fearless,
        fearless_pool=[],
    )

    game = Game(
        id=game_id,
        series_id=series_id,
        game_number=1,
        first_pick_side=game1_first_pick,
        status="pending",
        draft_state_json=draft_state,
        fearless_pool_json=[],
    )
    db.add(game)

    await db.commit()
    await db.refresh(series)

    return series, blue_token, red_token, spectator_token


async def get_series(db: AsyncSession, series_id: str) -> Series | None:
    result = await db.execute(
        select(Series)
        .options(selectinload(Series.games))
        .where(Series.id == series_id)
    )
    return result.scalar_one_or_none()


async def get_series_games(db: AsyncSession, series_id: str) -> list[Game]:
    result = await db.execute(
        select(Game)
        .where(Game.series_id == series_id)
        .order_by(Game.game_number)
    )
    return list(result.scalars().all())


async def get_active_series(db: AsyncSession) -> list[Series]:
    result = await db.execute(
        select(Series).where(Series.status == "in_progress")
    )
    return list(result.scalars().all())


async def create_game(
    db: AsyncSession,
    series_id: str,
    game_number: int,
    first_pick_side: str,
    fearless_mode: bool,
    fearless_pool: list[str],
) -> Game:
    game_id = _generate_id()
    draft_state = _build_initial_draft_state(
        game_id=game_id,
        series_id=series_id,
        game_number=game_number,
        first_pick_side=first_pick_side,
        fearless_mode=fearless_mode,
        fearless_pool=fearless_pool,
    )

    game = Game(
        id=game_id,
        series_id=series_id,
        game_number=game_number,
        first_pick_side=first_pick_side,
        status="pending",
        draft_state_json=draft_state,
        fearless_pool_json=fearless_pool,
    )
    db.add(game)
    await db.commit()
    await db.refresh(game)
    return game


async def start_game(db: AsyncSession, game: Game) -> Game:
    game.status = "in_progress"
    game.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(game)
    return game


async def complete_game(
    db: AsyncSession,
    game: Game,
    winner: str,
    draft_state_json: dict,
    fearless_pool: list[str],
) -> Game:
    game.status = "complete"
    game.winner = winner
    game.draft_state_json = draft_state_json
    game.fearless_pool_json = fearless_pool
    game.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(game)
    return game


async def update_series_score(
    db: AsyncSession,
    series: Series,
    blue_score: int,
    red_score: int,
    status: str | None = None,
) -> Series:
    series.blue_score = blue_score
    series.red_score = red_score
    if status:
        series.status = status
    await db.commit()
    await db.refresh(series)
    return series


async def update_series_status(
    db: AsyncSession,
    series: Series,
    status: str,
) -> Series:
    series.status = status
    await db.commit()
    await db.refresh(series)
    return series


async def save_draft_state(
    db: AsyncSession,
    game: Game,
    draft_state_json: dict,
) -> None:
    game.draft_state_json = draft_state_json
    await db.commit()

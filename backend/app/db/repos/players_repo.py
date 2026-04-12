from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.site_models import Player, Team


async def list_by_league(db: AsyncSession, league_id: str) -> list[Player]:
    stmt = (
        select(Player)
        .join(Team, Team.id == Player.team_id)
        .where(Team.league_id == league_id)
        .order_by(Team.name, Player.role)
    )
    return list((await db.execute(stmt)).scalars().all())


async def list_by_team(db: AsyncSession, team_id: str) -> list[Player]:
    stmt = select(Player).where(Player.team_id == team_id).order_by(Player.role)
    return list((await db.execute(stmt)).scalars().all())


async def get(db: AsyncSession, player_id: str) -> Player | None:
    return await db.get(Player, player_id)

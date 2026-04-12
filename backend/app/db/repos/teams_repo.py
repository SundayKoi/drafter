from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.site_models import Team


async def list_by_league(db: AsyncSession, league_id: str) -> list[Team]:
    stmt = (
        select(Team)
        .where(Team.league_id == league_id, Team.is_active.is_(True))
        .options(selectinload(Team.players))
        .order_by(Team.name)
    )
    return list((await db.execute(stmt)).scalars().all())


async def get(db: AsyncSession, team_id: str) -> Team | None:
    return await db.get(Team, team_id)


async def list_all(db: AsyncSession) -> list[Team]:
    stmt = select(Team).order_by(Team.league_id, Team.name)
    return list((await db.execute(stmt)).scalars().all())

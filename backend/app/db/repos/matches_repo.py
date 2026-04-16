from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.site_models import Match


async def list_matches(
    db: AsyncSession, season: str, league_id: str | None = None
) -> list[Match]:
    stmt = select(Match).where(Match.season == season)
    if league_id is not None:
        stmt = stmt.where(Match.league_id == league_id)
    stmt = stmt.order_by(Match.scheduled_at.desc())
    return list((await db.execute(stmt)).scalars().all())


async def get(db: AsyncSession, match_id: str) -> Match | None:
    return await db.get(Match, match_id)

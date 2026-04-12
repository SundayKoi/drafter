from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.site_models import Vod


async def list_all(db: AsyncSession, league_id: str | None = None) -> list[Vod]:
    stmt = select(Vod)
    if league_id is not None:
        stmt = stmt.where(Vod.league_id == league_id)
    stmt = stmt.order_by(Vod.created_at.desc())
    return list((await db.execute(stmt)).scalars().all())


async def get(db: AsyncSession, vod_id: str) -> Vod | None:
    return await db.get(Vod, vod_id)

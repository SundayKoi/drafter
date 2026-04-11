from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ChampionCache


async def get_cached_champions(db: AsyncSession, patch: str) -> dict | None:
    result = await db.execute(
        select(ChampionCache).where(ChampionCache.patch == patch)
    )
    row = result.scalar_one_or_none()
    if row:
        return row.data_json
    return None


async def set_cached_champions(db: AsyncSession, patch: str, data: dict) -> None:
    result = await db.execute(
        select(ChampionCache).where(ChampionCache.patch == patch)
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.data_json = data
        existing.cached_at = datetime.now(timezone.utc)
    else:
        row = ChampionCache(
            patch=patch,
            data_json=data,
            cached_at=datetime.now(timezone.utc),
        )
        db.add(row)
    await db.commit()

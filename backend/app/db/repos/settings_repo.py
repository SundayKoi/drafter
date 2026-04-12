"""Key/value site settings. ORM-only; keys whitelisted at the router level."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.site_models import SiteSetting


async def get_all(db: AsyncSession) -> dict[str, str | None]:
    rows = (await db.execute(select(SiteSetting))).scalars().all()
    return {r.key: r.value for r in rows}


async def set_many(db: AsyncSession, values: dict[str, str | None], staff_id: str) -> None:
    for key, value in values.items():
        existing = await db.get(SiteSetting, key)
        if existing is None:
            db.add(SiteSetting(key=key, value=value, updated_by=staff_id))
        else:
            existing.value = value
            existing.updated_at = datetime.now(timezone.utc)
            existing.updated_by = staff_id
    await db.commit()

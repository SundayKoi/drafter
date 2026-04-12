"""Parameterised staff lookups. All queries go through the ORM; no raw SQL."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.site_models import StaffUser


async def get_by_id(db: AsyncSession, staff_id: str) -> StaffUser | None:
    return await db.get(StaffUser, staff_id)


async def get_by_email(db: AsyncSession, email: str) -> StaffUser | None:
    # Case-insensitive match — normalise email before comparison.
    stmt = select(StaffUser).where(StaffUser.email == email.strip().lower())
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_by_discord_id(db: AsyncSession, discord_id: str) -> StaffUser | None:
    stmt = select(StaffUser).where(StaffUser.discord_id == discord_id)
    return (await db.execute(stmt)).scalar_one_or_none()


async def touch_last_login(db: AsyncSession, staff: StaffUser) -> None:
    staff.last_login = datetime.now(timezone.utc)
    await db.commit()

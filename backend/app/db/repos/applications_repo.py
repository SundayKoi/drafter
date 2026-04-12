from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.site_models import ApplicationPlayer, TeamApplication


async def list_by_status(
    db: AsyncSession, status: str | None = None
) -> list[TeamApplication]:
    stmt = select(TeamApplication).options(selectinload(TeamApplication.applicants))
    if status is not None:
        stmt = stmt.where(TeamApplication.status == status)
    stmt = stmt.order_by(TeamApplication.submitted_at.desc())
    return list((await db.execute(stmt)).scalars().all())


async def get(db: AsyncSession, application_id: str) -> TeamApplication | None:
    stmt = (
        select(TeamApplication)
        .where(TeamApplication.id == application_id)
        .options(selectinload(TeamApplication.applicants))
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def set_status(
    db: AsyncSession,
    application: TeamApplication,
    new_status: str,
    staff_id: str,
    note: str | None,
) -> None:
    application.status = new_status
    application.reviewed_by = staff_id
    application.review_note = note
    application.reviewed_at = datetime.now(timezone.utc)
    await db.commit()


async def pending_count(db: AsyncSession) -> int:
    from sqlalchemy import func

    stmt = select(func.count()).select_from(TeamApplication).where(
        TeamApplication.status == "pending"
    )
    return int((await db.execute(stmt)).scalar_one())


__all__ = [
    "ApplicationPlayer",
    "TeamApplication",
    "list_by_status",
    "get",
    "set_status",
    "pending_count",
]

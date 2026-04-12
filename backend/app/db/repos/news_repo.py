from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.site_models import NewsPost


async def list_published(
    db: AsyncSession, limit: int = 20, league_id: str | None = None
) -> list[NewsPost]:
    stmt = select(NewsPost).where(NewsPost.is_published.is_(True))
    if league_id is not None:
        stmt = stmt.where(NewsPost.league_id == league_id)
    stmt = stmt.order_by(NewsPost.published_at.desc().nullslast()).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


async def list_all(db: AsyncSession) -> list[NewsPost]:
    stmt = select(NewsPost).order_by(NewsPost.created_at.desc())
    return list((await db.execute(stmt)).scalars().all())


async def get_by_slug(db: AsyncSession, slug: str) -> NewsPost | None:
    stmt = select(NewsPost).where(NewsPost.slug == slug)
    return (await db.execute(stmt)).scalar_one_or_none()


async def get(db: AsyncSession, post_id: str) -> NewsPost | None:
    return await db.get(NewsPost, post_id)

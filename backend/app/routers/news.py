from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from nanoid import generate as nanoid
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import news_repo
from app.db.site_models import NewsPost, StaffUser
from app.models.site_schemas import LeagueId, NewsBody, NewsOut, slugify
from app.security.site_auth import get_current_staff, require_admin

router = APIRouter(prefix="/news", tags=["news"])


def _out(p: NewsPost) -> NewsOut:
    return NewsOut.model_validate(p, from_attributes=True)


@router.get("", response_model=list[NewsOut])
async def list_news(
    league: LeagueId | None = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> list[NewsOut]:
    limit = max(1, min(limit, 100))
    return [_out(p) for p in await news_repo.list_published(db, limit=limit, league_id=league)]


@router.get("/slug/{slug}", response_model=NewsOut)
async def get_news_by_slug(slug: str, db: AsyncSession = Depends(get_db)) -> NewsOut:
    p = await news_repo.get_by_slug(db, slug)
    if p is None or not p.is_published:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return _out(p)


@router.get("/admin/all", response_model=list[NewsOut])
async def admin_list_news(
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> list[NewsOut]:
    return [_out(p) for p in await news_repo.list_all(db)]


async def _unique_slug(db: AsyncSession, base: str) -> str:
    slug = base
    n = 2
    while await news_repo.get_by_slug(db, slug):
        slug = f"{base}-{n}"
        n += 1
    return slug


@router.post("", response_model=NewsOut, status_code=201)
async def create_news(
    body: NewsBody,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_current_staff),
) -> NewsOut:
    slug = await _unique_slug(db, slugify(body.title))
    post = NewsPost(
        id=nanoid(size=21),
        title=body.title,
        slug=slug,
        body=body.body,
        league_id=body.league_id,
        author_id=staff.id,
        is_published=body.is_published,
        published_at=datetime.now(timezone.utc) if body.is_published else None,
    )
    db.add(post)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug conflict")
    await db.refresh(post)
    return _out(post)


@router.put("/{post_id}", response_model=NewsOut)
async def update_news(
    post_id: str,
    body: NewsBody,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(get_current_staff),
) -> NewsOut:
    post = await news_repo.get(db, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    post.title = body.title
    post.body = body.body
    post.league_id = body.league_id
    if body.is_published and not post.is_published:
        post.published_at = datetime.now(timezone.utc)
    post.is_published = body.is_published
    await db.commit()
    await db.refresh(post)
    return _out(post)


@router.delete("/{post_id}", status_code=204)
async def delete_news(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> None:
    post = await news_repo.get(db, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    await db.delete(post)
    await db.commit()

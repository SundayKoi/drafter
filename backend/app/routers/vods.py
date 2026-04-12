from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from nanoid import generate as nanoid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import vods_repo
from app.db.site_models import StaffUser, Vod
from app.models.site_schemas import LeagueId, VodBody, VodOut, detect_vod_platform
from app.security.site_auth import require_admin

router = APIRouter(prefix="/vods", tags=["vods"])


def _out(v: Vod) -> VodOut:
    return VodOut.model_validate(v, from_attributes=True)


@router.get("", response_model=list[VodOut])
async def list_vods(
    league: LeagueId | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[VodOut]:
    return [_out(v) for v in await vods_repo.list_all(db, league_id=league)]


@router.post("", response_model=VodOut, status_code=201)
async def create_vod(
    body: VodBody,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> VodOut:
    url = str(body.url)
    try:
        platform = detect_vod_platform(url)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    v = Vod(
        id=nanoid(size=21),
        title=body.title,
        url=url,
        league_id=body.league_id,
        platform=platform,
        thumbnail_url=body.thumbnail_url,
        match_id=body.match_id,
    )
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return _out(v)


@router.put("/{vod_id}", response_model=VodOut)
async def update_vod(
    vod_id: str,
    body: VodBody,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> VodOut:
    v = await vods_repo.get(db, vod_id)
    if v is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "VOD not found")
    url = str(body.url)
    try:
        platform = detect_vod_platform(url)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    v.title = body.title
    v.url = url
    v.league_id = body.league_id
    v.platform = platform
    v.thumbnail_url = body.thumbnail_url
    v.match_id = body.match_id
    await db.commit()
    await db.refresh(v)
    return _out(v)


@router.delete("/{vod_id}", status_code=204)
async def delete_vod(
    vod_id: str,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> None:
    v = await vods_repo.get(db, vod_id)
    if v is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "VOD not found")
    await db.delete(v)
    await db.commit()

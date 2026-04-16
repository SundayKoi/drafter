from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from nanoid import generate as nanoid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import matches_repo, settings_repo
from app.db.site_models import Match, StaffUser
from app.models.site_schemas import LeagueId, MatchBody, MatchOut
from app.security.site_auth import require_admin

router = APIRouter(prefix="/matches", tags=["matches"])


def _out(m: Match) -> MatchOut:
    return MatchOut.model_validate(m, from_attributes=True)


@router.get("", response_model=list[MatchOut])
async def list_matches(
    league: LeagueId | None = None,
    season: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[MatchOut]:
    if season is None:
        s = await settings_repo.get_all(db)
        season = s.get("current_season") or "S1"
    return [_out(m) for m in await matches_repo.list_matches(db, season, league)]


@router.post("", response_model=MatchOut, status_code=201)
async def create_match(
    body: MatchBody,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> MatchOut:
    if body.blue_team_id == body.red_team_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Blue and red teams must differ")
    m = Match(id=nanoid(size=21), **body.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return _out(m)


@router.put("/{match_id}", response_model=MatchOut)
async def update_match(
    match_id: str,
    body: MatchBody,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> MatchOut:
    m = await matches_repo.get(db, match_id)
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    for k, v in body.model_dump().items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return _out(m)


@router.delete("/{match_id}", status_code=204)
async def delete_match(
    match_id: str,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> None:
    m = await matches_repo.get(db, match_id)
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    await db.delete(m)
    await db.commit()

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import teams_repo
from app.models.site_schemas import LeagueId, PlayerOut, TeamOut

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=list[TeamOut])
async def list_teams(league: LeagueId, db: AsyncSession = Depends(get_db)) -> list[TeamOut]:
    teams = await teams_repo.list_by_league(db, league)
    return [
        TeamOut(
            id=t.id,
            league_id=t.league_id,  # type: ignore[arg-type]
            name=t.name,
            logo_url=t.logo_url,
            bio=t.bio,
            players=[PlayerOut.model_validate(p, from_attributes=True) for p in t.players],
        )
        for t in teams
    ]


@router.get("/{team_id}", response_model=TeamOut)
async def get_team(team_id: str, db: AsyncSession = Depends(get_db)) -> TeamOut:
    t = await teams_repo.get(db, team_id)
    if t is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    return TeamOut(
        id=t.id,
        league_id=t.league_id,  # type: ignore[arg-type]
        name=t.name,
        logo_url=t.logo_url,
        bio=t.bio,
        players=[PlayerOut.model_validate(p, from_attributes=True) for p in t.players],
    )

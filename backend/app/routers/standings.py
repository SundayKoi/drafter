from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from nanoid import generate as nanoid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import settings_repo, standings_repo, teams_repo
from app.db.site_models import StaffUser, Standing
from app.models.site_schemas import LeagueId, StandingOut, StandingUpdate
from app.security.site_auth import require_admin

router = APIRouter(prefix="/standings", tags=["standings"])


async def _current_season(db: AsyncSession) -> str:
    s = await settings_repo.get_all(db)
    return s.get("current_season") or "S1"


@router.get("", response_model=list[StandingOut])
async def get_standings(
    league: LeagueId,
    season: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[StandingOut]:
    seasn = season or await _current_season(db)
    rows = await standings_repo.list_by_league(db, league, seasn)
    return [
        StandingOut(
            team_id=t.id,
            team_name=t.name,
            team_logo_url=t.logo_url,
            league_id=s.league_id,  # type: ignore[arg-type]
            season=s.season,
            wins=s.wins,
            losses=s.losses,
            point_diff=s.point_diff,
            streak=s.streak,
        )
        for (s, t) in rows
    ]


@router.put("", response_model=list[StandingOut])
async def upsert_standings(
    league: LeagueId,
    season: str,
    updates: list[StandingUpdate],
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> list[StandingOut]:
    # Validate team ids belong to this league — prevents updating foreign leagues.
    league_teams = {t.id: t for t in await teams_repo.list_by_league(db, league)}
    for upd in updates:
        if upd.team_id not in league_teams:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Team {upd.team_id} not in league {league}",
            )
        existing = await standings_repo.get_by_team_season(db, upd.team_id, season)
        if existing is None:
            db.add(
                Standing(
                    id=nanoid(size=21),
                    team_id=upd.team_id,
                    league_id=league,
                    season=season,
                    wins=upd.wins,
                    losses=upd.losses,
                    point_diff=upd.point_diff,
                    streak=upd.streak,
                )
            )
        else:
            existing.wins = upd.wins
            existing.losses = upd.losses
            existing.point_diff = upd.point_diff
            existing.streak = upd.streak
    await db.commit()
    return await get_standings(league, season, db)  # type: ignore[arg-type]

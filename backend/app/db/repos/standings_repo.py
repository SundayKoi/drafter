from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.site_models import Standing, Team


async def list_by_league(
    db: AsyncSession, league_id: str, season: str
) -> list[tuple[Standing, Team]]:
    stmt = (
        select(Standing, Team)
        .join(Team, Team.id == Standing.team_id)
        .where(Standing.league_id == league_id, Standing.season == season)
        .order_by(Standing.wins.desc(), Standing.point_diff.desc())
    )
    return [(s, t) for s, t in (await db.execute(stmt)).all()]


async def get_by_team_season(
    db: AsyncSession, team_id: str, season: str
) -> Standing | None:
    stmt = select(Standing).where(
        Standing.team_id == team_id, Standing.season == season
    )
    return (await db.execute(stmt)).scalar_one_or_none()

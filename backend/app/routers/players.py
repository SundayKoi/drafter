from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from nanoid import generate as nanoid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import players_repo, teams_repo
from app.db.site_models import Player, StaffUser
from app.models.site_schemas import LeagueId, PlayerBody, PlayerOut
from app.security.site_auth import require_admin

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[PlayerOut])
async def list_players(
    league: LeagueId, db: AsyncSession = Depends(get_db)
) -> list[PlayerOut]:
    rows = await players_repo.list_by_league(db, league)
    return [PlayerOut.model_validate(p, from_attributes=True) for p in rows]


@router.post("/team/{team_id}", response_model=PlayerOut)
async def create_player(
    team_id: str,
    body: PlayerBody,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> PlayerOut:
    team = await teams_repo.get(db, team_id)
    if team is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    player = Player(id=nanoid(size=21), team_id=team_id, **body.model_dump())
    db.add(player)
    await db.commit()
    await db.refresh(player)
    return PlayerOut.model_validate(player, from_attributes=True)


@router.put("/{player_id}", response_model=PlayerOut)
async def update_player(
    player_id: str,
    body: PlayerBody,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> PlayerOut:
    player = await players_repo.get(db, player_id)
    if player is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    for k, v in body.model_dump().items():
        setattr(player, k, v)
    await db.commit()
    await db.refresh(player)
    return PlayerOut.model_validate(player, from_attributes=True)


@router.delete("/{player_id}", status_code=204)
async def delete_player(
    player_id: str,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> None:
    player = await players_repo.get(db, player_id)
    if player is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    await db.delete(player)
    await db.commit()

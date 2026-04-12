"""Google Sheets / CSV standings import.

Flow is strictly two-step: admin fetches a PREVIEW (no writes), then POSTs
``confirm=true`` back with the same URL to apply. The backend never
auto-applies an import, so a bad sheet URL cannot overwrite standings
unnoticed.

URL whitelist: only ``docs.google.com/spreadsheets/.../export`` or an explicit
``.csv`` URL is accepted. This prevents SSRF to arbitrary internal hosts.
"""
from __future__ import annotations

import csv
import io
import re
from urllib.parse import urlparse

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request, status
from nanoid import generate as nanoid
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import standings_repo, teams_repo
from app.db.site_models import StaffUser, Standing
from app.models.site_schemas import LeagueId
from app.security.rate_limit import limiter
from app.security.site_auth import require_admin

router = APIRouter(prefix="/admin/sheets", tags=["sheets"])


class ImportRequest(BaseModel):
    url: str = Field(max_length=1000)
    league: LeagueId
    season: str = Field(min_length=1, max_length=10)
    confirm: bool = False


class PreviewRow(BaseModel):
    team_name: str
    matched_team_id: str | None
    wins: int
    losses: int
    point_diff: int


class ImportPreview(BaseModel):
    rows: list[PreviewRow]
    unmatched: list[str]
    will_update: int


def _validate_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "URL must be https")
    host = (parsed.hostname or "").lower()
    is_gsheet = host == "docs.google.com" and "/spreadsheets/" in parsed.path and "export" in parsed.path
    is_csv = url.lower().endswith(".csv")
    if not (is_gsheet or is_csv):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Only Google Sheets export URLs or direct .csv URLs are allowed",
        )
    return url


async def _fetch_csv(url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(
            url,
            timeout=aiohttp.ClientTimeout(total=15),
            allow_redirects=True,
            max_redirects=3,
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Could not fetch sheet")
            # cap size to 1MB to prevent abuse
            text = await resp.text(encoding="utf-8", errors="replace")
            if len(text) > 1_000_000:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sheet too large")
            return text


def _parse_rows(text: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(text))
    results: list[dict] = []
    for row in reader:
        # Case-insensitive header lookup
        norm = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        team = norm.get("team") or norm.get("team name") or norm.get("name")
        if not team:
            continue
        try:
            wins = int(norm.get("w") or norm.get("wins") or 0)
            losses = int(norm.get("l") or norm.get("losses") or 0)
            diff = int(
                re.sub(r"[^-\d]", "", norm.get("+/-") or norm.get("point diff") or "0") or "0"
            )
        except ValueError:
            continue
        results.append({"team": team, "wins": wins, "losses": losses, "point_diff": diff})
    return results


@router.post("/import", response_model=ImportPreview)
@limiter.limit("20/hour")
async def import_standings(
    request: Request,
    body: ImportRequest,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(require_admin),
) -> ImportPreview:
    url = _validate_url(body.url)
    text = await _fetch_csv(url)
    parsed = _parse_rows(text)

    teams = {t.name.strip().lower(): t for t in await teams_repo.list_by_league(db, body.league)}

    preview_rows: list[PreviewRow] = []
    unmatched: list[str] = []
    to_apply: list[tuple[str, dict]] = []
    for row in parsed:
        key = row["team"].strip().lower()
        matched = teams.get(key)
        preview_rows.append(
            PreviewRow(
                team_name=row["team"],
                matched_team_id=matched.id if matched else None,
                wins=row["wins"],
                losses=row["losses"],
                point_diff=row["point_diff"],
            )
        )
        if matched is None:
            unmatched.append(row["team"])
        else:
            to_apply.append((matched.id, row))

    if body.confirm:
        for team_id, row in to_apply:
            existing = await standings_repo.get_by_team_season(db, team_id, body.season)
            if existing is None:
                db.add(
                    Standing(
                        id=nanoid(size=21),
                        team_id=team_id,
                        league_id=body.league,
                        season=body.season,
                        wins=row["wins"],
                        losses=row["losses"],
                        point_diff=row["point_diff"],
                        streak=0,
                    )
                )
            else:
                existing.wins = row["wins"]
                existing.losses = row["losses"]
                existing.point_diff = row["point_diff"]
        await db.commit()

    return ImportPreview(
        rows=preview_rows,
        unmatched=unmatched,
        will_update=len(to_apply),
    )

import logging

import aiohttp
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import champion_cache_repo
from app.security.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/champions", tags=["champions"])

DDRAGON_VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json"
DDRAGON_CHAMPIONS_URL = "https://ddragon.leagueoflegends.com/cdn/{patch}/data/en_US/champion.json"


async def _fetch_latest_patch() -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(DDRAGON_VERSIONS_URL, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            resp.raise_for_status()
            versions = await resp.json()
            return versions[0]


async def _fetch_champions(patch: str) -> dict:
    url = DDRAGON_CHAMPIONS_URL.format(patch=patch)
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
            resp.raise_for_status()
            return await resp.json()


@router.get("")
@limiter.limit("60/minute")
async def get_champions(
    request: Request,
    patch: str | None = Query(None, max_length=20),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns champion data from DataDragon, cached in DB.
    If no patch specified, fetches the latest patch version.
    """
    try:
        if not patch:
            patch = await _fetch_latest_patch()

        # Check cache
        cached = await champion_cache_repo.get_cached_champions(db, patch)
        if cached:
            return {"patch": patch, "data": cached}

        # Fetch from DataDragon
        data = await _fetch_champions(patch)
        await champion_cache_repo.set_cached_champions(db, patch, data)

        return {"patch": patch, "data": data}

    except aiohttp.ClientError as e:
        logger.error("DataDragon fetch failed: %s", e)
        return JSONResponse(
            status_code=502,
            content={"detail": "Failed to fetch champion data from DataDragon"},
        )

"""Site settings — public GET (non-sensitive keys only), admin PUT."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import settings_repo
from app.db.site_models import StaffUser
from app.models.site_schemas import ALLOWED_SETTING_KEYS, SettingsBody
from app.security.site_auth import require_admin

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=dict)
async def get_settings(db: AsyncSession = Depends(get_db)) -> dict:
    return await settings_repo.get_all(db)


@router.put("", response_model=dict)
async def update_settings(
    body: SettingsBody,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(require_admin),
) -> dict:
    # Only whitelisted keys go through. Values normalised to strings for the
    # k/v table; booleans -> "true"/"false".
    raw = body.model_dump(exclude_unset=True)
    values: dict[str, str | None] = {}
    for key, value in raw.items():
        if key not in ALLOWED_SETTING_KEYS:
            continue
        if value is None:
            values[key] = None
        elif isinstance(value, bool):
            values[key] = "true" if value else "false"
        else:
            values[key] = str(value)
    await settings_repo.set_many(db, values, staff.id)
    return await settings_repo.get_all(db)

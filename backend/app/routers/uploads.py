from __future__ import annotations

from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.db.site_models import StaffUser
from app.security.rate_limit import limiter
from app.security.site_auth import get_current_staff
from app.storage.uploads import save_logo

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/logo")
@limiter.limit("10/hour")
async def upload_logo(
    request: Request,
    file: UploadFile = File(...),
    _: StaffUser = Depends(get_current_staff),
) -> dict:
    url = await save_logo(file)
    return {"url": url}


@router.post("/public-logo")
@limiter.limit("10/hour")
async def upload_public_logo(
    request: Request,
    file: UploadFile = File(...),
) -> dict:
    # Used during the /apply flow — no auth, rate-limited. MIME + magic byte
    # validation + randomised filenames are handled inside ``save_logo``.
    url = await save_logo(file)
    return {"url": url}

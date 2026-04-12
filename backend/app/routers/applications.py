from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from nanoid import generate as nanoid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import applications_repo, settings_repo
from app.db.site_models import (
    ApplicationPlayer,
    Player,
    StaffUser,
    Team,
    TeamApplication,
)
from app.models.site_schemas import (
    ApplicationBody,
    ApplicationOut,
    ApplicationPlayerOut,
    ApplicationReview,
)
from app.security.rate_limit import limiter
from app.security.site_auth import require_admin

router = APIRouter(tags=["applications"])


def _to_out(app: TeamApplication) -> ApplicationOut:
    return ApplicationOut(
        id=app.id,
        league_id=app.league_id,  # type: ignore[arg-type]
        team_name=app.team_name,
        logo_url=app.logo_url,
        bio=app.bio,
        contact_name=app.contact_name,
        contact_email=app.contact_email,
        contact_discord=app.contact_discord,
        status=app.status,  # type: ignore[arg-type]
        submitted_at=app.submitted_at,
        reviewed_at=app.reviewed_at,
        review_note=app.review_note,
        players=[
            ApplicationPlayerOut.model_validate(p, from_attributes=True)
            for p in sorted(app.applicants, key=lambda x: x.role)
        ],
    )


@router.post("/apply", response_model=ApplicationOut, status_code=201)
@limiter.limit("5/hour")
async def submit_application(
    request: Request,
    body: ApplicationBody,
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    settings = await settings_repo.get_all(db)
    if (settings.get("applications_open") or "true").lower() != "true":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Applications are closed")
    app = TeamApplication(
        id=nanoid(size=21),
        league_id=body.league_id,
        team_name=body.team_name,
        logo_url=body.logo_url,
        bio=body.bio,
        contact_name=body.contact_name,
        contact_email=body.contact_email,
        contact_discord=body.contact_discord,
        status="pending",
    )
    db.add(app)
    await db.flush()
    for p in body.players:
        db.add(
            ApplicationPlayer(
                id=nanoid(size=21),
                application_id=app.id,
                summoner_name=p.summoner_name,
                opgg_url=p.opgg_url,
                role=p.role,
                is_captain=p.is_captain,
            )
        )
    await db.commit()
    result = await applications_repo.get(db, app.id)
    assert result is not None
    return _to_out(result)


@router.get("/admin/applications", response_model=list[ApplicationOut])
async def admin_list_applications(
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> list[ApplicationOut]:
    if status_filter not in (None, "pending", "approved", "denied"):
        raise HTTPException(400, "Invalid status filter")
    rows = await applications_repo.list_by_status(db, status_filter)
    return [_to_out(a) for a in rows]


@router.get("/admin/applications/{app_id}", response_model=ApplicationOut)
async def admin_get_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(require_admin),
) -> ApplicationOut:
    app = await applications_repo.get(db, app_id)
    if app is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    return _to_out(app)


@router.patch("/admin/applications/{app_id}", response_model=ApplicationOut)
async def admin_review_application(
    app_id: str,
    review: ApplicationReview,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(require_admin),
) -> ApplicationOut:
    app = await applications_repo.get(db, app_id)
    if app is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    if app.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, "Application already reviewed")

    if review.action == "approve":
        team = Team(
            id=nanoid(size=21),
            league_id=app.league_id,
            name=app.team_name,
            logo_url=app.logo_url,
            bio=app.bio,
            is_active=True,
        )
        db.add(team)
        await db.flush()
        for p in app.applicants:
            db.add(
                Player(
                    id=nanoid(size=21),
                    team_id=team.id,
                    summoner_name=p.summoner_name,
                    opgg_url=p.opgg_url,
                    role=p.role,
                    is_captain=p.is_captain,
                )
            )
        await applications_repo.set_status(db, app, "approved", staff.id, review.note)
    else:
        await applications_repo.set_status(db, app, "denied", staff.id, review.note)

    refreshed = await applications_repo.get(db, app_id)
    assert refreshed is not None
    return _to_out(refreshed)

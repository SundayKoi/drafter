"""Site staff auth endpoints — namespaced under /auth (no overlap with drafter routes)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repos import staff_repo
from app.db.site_models import StaffUser
from app.security import discord_oauth
from app.security.rate_limit import limiter
from app.security.site_auth import (
    create_access_token,
    get_current_staff,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class StaffPublic(BaseModel):
    id: str
    display_name: str
    role: str

    @classmethod
    def from_orm_user(cls, s: StaffUser) -> "StaffPublic":
        return cls(id=s.id, display_name=s.display_name, role=s.role)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    staff: StaffPublic


class DiscordRedirectResponse(BaseModel):
    url: str


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginBody,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    staff = await staff_repo.get_by_email(db, body.email)
    # Generic message — don't leak which half was wrong.
    invalid = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if staff is None or not staff.is_active or not staff.password_hash:
        raise invalid
    if not verify_password(body.password, staff.password_hash):
        raise invalid
    await staff_repo.touch_last_login(db, staff)
    return TokenResponse(
        access_token=create_access_token(staff.id, staff.role),
        staff=StaffPublic.from_orm_user(staff),
    )


@router.get("/discord/redirect", response_model=DiscordRedirectResponse)
async def discord_redirect() -> DiscordRedirectResponse:
    url, _state = discord_oauth.build_authorize_url()
    return DiscordRedirectResponse(url=url)


@router.get("/discord/callback", response_model=TokenResponse)
@limiter.limit("20/minute")
async def discord_callback(
    request: Request,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    discord_oauth.verify_state(state)
    profile = await discord_oauth.exchange_code(code)
    discord_id = profile.get("id")
    if not discord_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Discord did not return a user id")
    staff = await staff_repo.get_by_discord_id(db, discord_id)
    if staff is None or not staff.is_active:
        # No self-registration — unknown Discord users get a flat 403.
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized — contact an admin")
    await staff_repo.touch_last_login(db, staff)
    return TokenResponse(
        access_token=create_access_token(staff.id, staff.role),
        staff=StaffPublic.from_orm_user(staff),
    )


@router.get("/me", response_model=StaffPublic)
async def me(staff: StaffUser = Depends(get_current_staff)) -> StaffPublic:
    return StaffPublic.from_orm_user(staff)


@router.post("/logout", status_code=204)
async def logout(_staff: StaffUser = Depends(get_current_staff)) -> None:
    # JWTs are stateless; the client drops the token. Short 8h expiry bounds
    # the window. For immediate global logout, rotate SECRET_KEY.
    return None

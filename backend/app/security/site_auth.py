"""Site staff authentication — JWT issue/verify, bcrypt password hashing, FastAPI deps.

SECURITY NOTES
- Passwords are bcrypt-hashed with cost 12. Plaintext passwords never touch logs
  or the DB. ``verify_password`` uses ``bcrypt.checkpw`` which is constant-time.
- JWTs are signed HS256 with ``settings.SECRET_KEY``. Tokens carry only the
  staff id and role — no sensitive data — and expire after 8h.
- ``get_current_staff`` re-reads the staff row on every request so a
  deactivated account loses access immediately on its next call (independent
  of JWT expiry). Admin-only routes add ``require_admin`` on top.
- All DB lookups use the SQLAlchemy ORM with bound parameters; user-supplied
  values are never concatenated into SQL.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.database import get_db
from app.db.repos import staff_repo
from app.db.site_models import StaffUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(staff_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": staff_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=settings.JWT_EXPIRE_HOURS)).timestamp()),
        "typ": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _decode(token: str, expected_typ: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    if payload.get("typ") != expected_typ:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong token type")
    return payload


def verify_access_token(token: str) -> dict:
    return _decode(token, "access")


def create_state_token(nonce: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "nonce": nonce,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.OAUTH_STATE_EXPIRE_SECONDS)).timestamp()),
        "typ": "oauth_state",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_state_token(token: str) -> str:
    return _decode(token, "oauth_state")["nonce"]


async def get_current_staff(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> StaffUser:
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = verify_access_token(token)
    staff = await staff_repo.get_by_id(db, payload["sub"])
    if staff is None or not staff.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not active")
    return staff


async def require_admin(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
    if staff.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return staff

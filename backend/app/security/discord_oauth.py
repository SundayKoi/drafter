"""Discord OAuth2 code-exchange flow.

We only use the ``identify`` scope — we never ask for ``email`` or message
access. The Discord user id we receive is matched against an existing
``StaffUser.discord_id``. If there is no match, login is refused; there is
no self-registration.

CSRF protection: the ``state`` parameter is a signed, short-lived JWT. We
verify its signature and expiry on callback — no server-side session store
needed, and a stolen/replayed state cannot authenticate a different browser.
"""
from __future__ import annotations

import secrets
from urllib.parse import urlencode

import aiohttp
from fastapi import HTTPException, status

from app.config import settings
from app.security.site_auth import create_state_token, verify_state_token

DISCORD_AUTHORIZE = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN = "https://discord.com/api/oauth2/token"
DISCORD_USER = "https://discord.com/api/users/@me"


def build_authorize_url() -> tuple[str, str]:
    if not settings.DISCORD_CLIENT_ID or not settings.DISCORD_REDIRECT_URI:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Discord OAuth not configured")
    nonce = secrets.token_urlsafe(24)
    state = create_state_token(nonce)
    qs = urlencode(
        {
            "client_id": settings.DISCORD_CLIENT_ID,
            "redirect_uri": settings.DISCORD_REDIRECT_URI,
            "response_type": "code",
            "scope": "identify",
            "state": state,
            "prompt": "none",
        }
    )
    return f"{DISCORD_AUTHORIZE}?{qs}", state


def verify_state(state: str) -> None:
    verify_state_token(state)  # raises 401 on failure


async def exchange_code(code: str) -> dict:
    if not settings.DISCORD_CLIENT_SECRET:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Discord OAuth not configured")
    data = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "client_secret": settings.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(
            DISCORD_TOKEN,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Discord code exchange failed")
            token_data = await resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Discord did not return an access token")
        async with session.get(
            DISCORD_USER,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Could not read Discord identity")
            return await resp.json()

"""Pydantic request/response schemas for the site. Strict field lengths —
every string has a ``max_length`` so Pydantic rejects oversized input before
it reaches the DB.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator

LeagueId = Literal["cinder", "blaze", "scorch", "magma"]
Role = Literal["top", "jungle", "mid", "bot", "support"]
MatchStatus = Literal["scheduled", "completed", "cancelled"]
VodPlatform = Literal["youtube", "twitch"]

OPGG_RE = re.compile(r"^https://(www\.)?op\.gg/summoners/[a-z0-9_-]+/.+$", re.IGNORECASE)
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate_opgg(value: str) -> str:
    value = value.strip()
    if not OPGG_RE.match(value):
        raise ValueError("Invalid op.gg URL")
    if len(value) > 500:
        raise ValueError("op.gg URL too long")
    return value


def slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s[:200] or "post"


# ---------------- teams / players ----------------


class PlayerOut(BaseModel):
    id: str
    team_id: str
    summoner_name: str
    opgg_url: str
    role: Role
    is_captain: bool
    discord_handle: str | None = None


class TeamOut(BaseModel):
    id: str
    league_id: LeagueId
    name: str
    logo_url: str | None
    bio: str | None
    players: list[PlayerOut] = Field(default_factory=list)


class PlayerBody(BaseModel):
    summoner_name: str = Field(min_length=1, max_length=50)
    opgg_url: str = Field(max_length=500)
    role: Role
    is_captain: bool = False
    discord_handle: str | None = Field(default=None, max_length=100)

    @field_validator("opgg_url")
    @classmethod
    def _opgg(cls, v: str) -> str:
        return validate_opgg(v)


class TeamBody(BaseModel):
    league_id: LeagueId
    name: str = Field(min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=500)
    logo_url: str | None = Field(default=None, max_length=500)


# ---------------- applications ----------------


class ApplicationPlayerBody(PlayerBody):
    pass


class ApplicationPlayerOut(BaseModel):
    id: str
    summoner_name: str
    opgg_url: str
    role: Role
    is_captain: bool


class ApplicationBody(BaseModel):
    league_id: LeagueId
    team_name: str = Field(min_length=1, max_length=100)
    logo_url: str | None = Field(default=None, max_length=500)
    bio: str = Field(min_length=1, max_length=500)
    contact_name: str = Field(min_length=1, max_length=100)
    contact_email: EmailStr
    contact_discord: str = Field(min_length=1, max_length=100)
    players: list[ApplicationPlayerBody] = Field(min_length=5, max_length=7)

    @field_validator("players")
    @classmethod
    def _one_captain(cls, v: list[ApplicationPlayerBody]) -> list[ApplicationPlayerBody]:
        captains = sum(1 for p in v if p.is_captain)
        if captains != 1:
            raise ValueError("Exactly one captain is required")
        return v


class ApplicationOut(BaseModel):
    id: str
    league_id: LeagueId
    team_name: str
    logo_url: str | None
    bio: str
    contact_name: str
    contact_email: str
    contact_discord: str
    status: Literal["pending", "approved", "denied"]
    submitted_at: datetime
    reviewed_at: datetime | None = None
    review_note: str | None = None
    players: list[ApplicationPlayerOut] = Field(default_factory=list)


class ApplicationReview(BaseModel):
    action: Literal["approve", "deny"]
    note: str | None = Field(default=None, max_length=500)


# ---------------- standings / matches ----------------


class StandingOut(BaseModel):
    team_id: str
    team_name: str
    team_logo_url: str | None
    league_id: LeagueId
    season: str
    wins: int
    losses: int
    point_diff: int
    streak: int


class StandingUpdate(BaseModel):
    team_id: str = Field(max_length=21)
    wins: int = Field(ge=0, le=1000)
    losses: int = Field(ge=0, le=1000)
    point_diff: int = Field(ge=-10000, le=10000)
    streak: int = Field(ge=-100, le=100)


class MatchBody(BaseModel):
    league_id: LeagueId
    season: str = Field(min_length=1, max_length=10)
    blue_team_id: str = Field(max_length=21)
    red_team_id: str = Field(max_length=21)
    blue_score: int | None = Field(default=None, ge=0, le=10)
    red_score: int | None = Field(default=None, ge=0, le=10)
    winner_id: str | None = Field(default=None, max_length=21)
    scheduled_at: datetime
    played_at: datetime | None = None
    vod_url: str | None = Field(default=None, max_length=500)
    status: MatchStatus = "scheduled"


class MatchOut(BaseModel):
    id: str
    league_id: LeagueId
    season: str
    blue_team_id: str
    red_team_id: str
    blue_score: int | None
    red_score: int | None
    winner_id: str | None
    scheduled_at: datetime
    played_at: datetime | None
    vod_url: str | None
    status: MatchStatus


# ---------------- news ----------------


class NewsBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=20000)
    league_id: LeagueId | None = None
    is_published: bool = False


class NewsOut(BaseModel):
    id: str
    title: str
    slug: str
    body: str
    league_id: LeagueId | None
    author_id: str
    is_published: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


# ---------------- vods ----------------


class VodBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl
    league_id: LeagueId | None = None
    match_id: str | None = Field(default=None, max_length=21)
    thumbnail_url: str | None = Field(default=None, max_length=500)


class VodOut(BaseModel):
    id: str
    title: str
    url: str
    league_id: LeagueId | None
    platform: VodPlatform
    thumbnail_url: str | None
    match_id: str | None
    created_at: datetime


def detect_vod_platform(url: str) -> VodPlatform:
    if "youtu" in url:
        return "youtube"
    if "twitch" in url:
        return "twitch"
    raise ValueError("VOD URL must be a YouTube or Twitch link")


# ---------------- settings ----------------


ALLOWED_SETTING_KEYS = {
    "twitch_channel",
    "twitter_url",
    "discord_invite",
    "youtube_channel",
    "instagram_url",
    "org_bio",
    "current_season",
    "applications_open",
    "rules_embed_url",
    "league_info_embed_url",
}


class SettingsBody(BaseModel):
    twitch_channel: str | None = Field(default=None, max_length=50)
    twitter_url: str | None = Field(default=None, max_length=500)
    discord_invite: str | None = Field(default=None, max_length=500)
    youtube_channel: str | None = Field(default=None, max_length=500)
    instagram_url: str | None = Field(default=None, max_length=500)
    org_bio: str | None = Field(default=None, max_length=5000)
    current_season: str | None = Field(default=None, max_length=10)
    applications_open: bool | None = None
    rules_embed_url: str | None = Field(default=None, max_length=1000)
    league_info_embed_url: str | None = Field(default=None, max_length=1000)

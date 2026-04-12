"""ORM models for the Ember Esports main site.

Tables live in the same metadata as the drafter models (shared ``Base``) so
one Alembic history covers both. The drafter's tables (``series``, ``games``,
``champion_cache``) are untouched — site tables use distinct names prefixed
or namespaced to avoid any collision.

All DB access goes through SQLAlchemy ORM with bound parameters, so user
input is never interpolated into SQL. Enum-like string columns are locked
down with CHECK constraints at the DB level as a defence in depth.
"""
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import BOOLEAN
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models import Base

LEAGUE_CHECK = "league_id IN ('cinder','blaze','scorch','magma')"
ROLE_CHECK = "role IN ('top','jungle','mid','bot','support')"


class StaffUser(Base):
    __tablename__ = "staff_users"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    discord_id: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    discord_username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False, default="moderator")
    is_active: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("role IN ('admin','moderator')", name="ck_staff_role"),
    )


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    league_id: Mapped[str] = mapped_column(String(16), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    players: Mapped[list["Player"]] = relationship(
        back_populates="team", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(LEAGUE_CHECK, name="ck_team_league"),
    )


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    team_id: Mapped[str] = mapped_column(
        String(21), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    summoner_name: Mapped[str] = mapped_column(String(50), nullable=False)
    opgg_url: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(8), nullable=False)
    is_captain: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False)
    discord_handle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    team: Mapped["Team"] = relationship(back_populates="players")

    __table_args__ = (
        CheckConstraint(ROLE_CHECK, name="ck_player_role"),
    )


class Standing(Base):
    __tablename__ = "standings"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    team_id: Mapped[str] = mapped_column(
        String(21), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    league_id: Mapped[str] = mapped_column(String(16), nullable=False)
    season: Mapped[str] = mapped_column(String(10), nullable=False)
    wins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    losses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    point_diff: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(LEAGUE_CHECK, name="ck_standing_league"),
    )


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    league_id: Mapped[str] = mapped_column(String(16), nullable=False)
    season: Mapped[str] = mapped_column(String(10), nullable=False)
    blue_team_id: Mapped[str] = mapped_column(
        String(21), ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False
    )
    red_team_id: Mapped[str] = mapped_column(
        String(21), ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False
    )
    blue_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    red_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    winner_id: Mapped[str | None] = mapped_column(
        String(21), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    played_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    vod_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(11), nullable=False, default="scheduled")
    imported_from_sheets: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint(LEAGUE_CHECK, name="ck_match_league"),
        CheckConstraint(
            "status IN ('scheduled','completed','cancelled')", name="ck_match_status"
        ),
    )


class TeamApplication(Base):
    __tablename__ = "team_applications"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    league_id: Mapped[str] = mapped_column(String(16), nullable=False)
    team_name: Mapped[str] = mapped_column(String(100), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str] = mapped_column(String(500), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(100), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(254), nullable=False)
    contact_discord: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(9), nullable=False, default="pending")
    reviewed_by: Mapped[str | None] = mapped_column(
        String(21), ForeignKey("staff_users.id", ondelete="SET NULL"), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    applicants: Mapped[list["ApplicationPlayer"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(LEAGUE_CHECK, name="ck_app_league"),
        CheckConstraint(
            "status IN ('pending','approved','denied')", name="ck_app_status"
        ),
    )


class ApplicationPlayer(Base):
    __tablename__ = "application_players"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    application_id: Mapped[str] = mapped_column(
        String(21), ForeignKey("team_applications.id", ondelete="CASCADE"), nullable=False
    )
    summoner_name: Mapped[str] = mapped_column(String(50), nullable=False)
    opgg_url: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(8), nullable=False)
    is_captain: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False)

    application: Mapped["TeamApplication"] = relationship(back_populates="applicants")

    __table_args__ = (
        CheckConstraint(ROLE_CHECK, name="ck_appplayer_role"),
    )


class NewsPost(Base):
    __tablename__ = "news_posts"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    league_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    author_id: Mapped[str] = mapped_column(
        String(21), ForeignKey("staff_users.id", ondelete="RESTRICT"), nullable=False
    )
    is_published: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "league_id IS NULL OR " + LEAGUE_CHECK, name="ck_news_league"
        ),
    )


class Vod(Base):
    __tablename__ = "vods"

    id: Mapped[str] = mapped_column(String(21), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    league_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(String(8), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    match_id: Mapped[str | None] = mapped_column(
        String(21), ForeignKey("matches.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint("platform IN ('youtube','twitch')", name="ck_vod_platform"),
        CheckConstraint(
            "league_id IS NULL OR " + LEAGUE_CHECK, name="ck_vod_league"
        ),
    )


class SiteSetting(Base):
    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    updated_by: Mapped[str | None] = mapped_column(
        String(21), ForeignKey("staff_users.id", ondelete="SET NULL"), nullable=True
    )

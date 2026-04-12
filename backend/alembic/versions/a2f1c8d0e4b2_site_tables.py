"""site tables — staff, teams, players, standings, matches, applications, news, vods, settings

Revision ID: a2f1c8d0e4b2
Revises: 1d4409f243b2
Create Date: 2026-04-12 00:00:00.000000

Adds the Ember Esports main-site tables alongside the existing drafter tables.
Drafter tables (series, games, champion_cache) are not touched.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a2f1c8d0e4b2"
down_revision: Union[str, None] = "1d4409f243b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LEAGUE_CHECK = "league_id IN ('cinder','blaze','scorch','magma')"
ROLE_CHECK = "role IN ('top','jungle','mid','bot','support')"


def upgrade() -> None:
    op.create_table(
        "staff_users",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("discord_id", sa.String(32), nullable=True, unique=True),
        sa.Column("discord_username", sa.String(64), nullable=True),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("role", sa.String(16), nullable=False, server_default=sa.text("'moderator'")),
        sa.Column("is_active", postgresql.BOOLEAN(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("role IN ('admin','moderator')", name="ck_staff_role"),
    )

    op.create_table(
        "teams",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("league_id", sa.String(16), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("bio", sa.String(500), nullable=True),
        sa.Column("is_active", postgresql.BOOLEAN(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(LEAGUE_CHECK, name="ck_team_league"),
    )

    op.create_table(
        "players",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("team_id", sa.String(21), sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("summoner_name", sa.String(50), nullable=False),
        sa.Column("opgg_url", sa.Text(), nullable=False),
        sa.Column("role", sa.String(8), nullable=False),
        sa.Column("is_captain", postgresql.BOOLEAN(), nullable=False, server_default=sa.text("false")),
        sa.Column("discord_handle", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(ROLE_CHECK, name="ck_player_role"),
    )

    op.create_table(
        "standings",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("team_id", sa.String(21), sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("league_id", sa.String(16), nullable=False),
        sa.Column("season", sa.String(10), nullable=False),
        sa.Column("wins", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("losses", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("point_diff", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("streak", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(LEAGUE_CHECK, name="ck_standing_league"),
    )

    op.create_table(
        "matches",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("league_id", sa.String(16), nullable=False),
        sa.Column("season", sa.String(10), nullable=False),
        sa.Column("blue_team_id", sa.String(21), sa.ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("red_team_id", sa.String(21), sa.ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("blue_score", sa.Integer(), nullable=True),
        sa.Column("red_score", sa.Integer(), nullable=True),
        sa.Column("winner_id", sa.String(21), sa.ForeignKey("teams.id", ondelete="SET NULL"), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("played_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("vod_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(11), nullable=False, server_default=sa.text("'scheduled'")),
        sa.Column("imported_from_sheets", postgresql.BOOLEAN(), nullable=False, server_default=sa.text("false")),
        sa.CheckConstraint(LEAGUE_CHECK, name="ck_match_league"),
        sa.CheckConstraint("status IN ('scheduled','completed','cancelled')", name="ck_match_status"),
    )

    op.create_table(
        "team_applications",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("league_id", sa.String(16), nullable=False),
        sa.Column("team_name", sa.String(100), nullable=False),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("bio", sa.String(500), nullable=False),
        sa.Column("contact_name", sa.String(100), nullable=False),
        sa.Column("contact_email", sa.String(254), nullable=False),
        sa.Column("contact_discord", sa.String(100), nullable=False),
        sa.Column("status", sa.String(9), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("reviewed_by", sa.String(21), sa.ForeignKey("staff_users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("review_note", sa.String(500), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(LEAGUE_CHECK, name="ck_app_league"),
        sa.CheckConstraint("status IN ('pending','approved','denied')", name="ck_app_status"),
    )

    op.create_table(
        "application_players",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("application_id", sa.String(21), sa.ForeignKey("team_applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("summoner_name", sa.String(50), nullable=False),
        sa.Column("opgg_url", sa.Text(), nullable=False),
        sa.Column("role", sa.String(8), nullable=False),
        sa.Column("is_captain", postgresql.BOOLEAN(), nullable=False, server_default=sa.text("false")),
        sa.CheckConstraint(ROLE_CHECK, name="ck_appplayer_role"),
    )

    op.create_table(
        "news_posts",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False, unique=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("league_id", sa.String(16), nullable=True),
        sa.Column("author_id", sa.String(21), sa.ForeignKey("staff_users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("is_published", postgresql.BOOLEAN(), nullable=False, server_default=sa.text("false")),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("league_id IS NULL OR " + LEAGUE_CHECK, name="ck_news_league"),
    )

    op.create_table(
        "vods",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("league_id", sa.String(16), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("platform", sa.String(8), nullable=False),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column("match_id", sa.String(21), sa.ForeignKey("matches.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("platform IN ('youtube','twitch')", name="ck_vod_platform"),
        sa.CheckConstraint("league_id IS NULL OR " + LEAGUE_CHECK, name="ck_vod_league"),
    )

    op.create_table(
        "site_settings",
        sa.Column("key", sa.String(64), primary_key=True),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_by", sa.String(21), sa.ForeignKey("staff_users.id", ondelete="SET NULL"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("site_settings")
    op.drop_table("vods")
    op.drop_table("news_posts")
    op.drop_table("application_players")
    op.drop_table("team_applications")
    op.drop_table("matches")
    op.drop_table("standings")
    op.drop_table("players")
    op.drop_table("teams")
    op.drop_table("staff_users")

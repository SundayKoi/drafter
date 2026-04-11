"""initial schema

Revision ID: 1d4409f243b2
Revises:
Create Date: 2026-04-10 22:11:06.492085

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1d4409f243b2'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "series",
        sa.Column("id", sa.String(8), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("format", sa.String(3), nullable=False),
        sa.Column("fearless", postgresql.BOOLEAN(), nullable=False, server_default=sa.text("false")),
        sa.Column("patch", sa.String(20), nullable=False),
        sa.Column("timer_seconds", sa.Integer(), nullable=False, server_default=sa.text("30")),
        sa.Column("blue_token_hash", sa.Text(), nullable=False),
        sa.Column("red_token_hash", sa.Text(), nullable=False),
        sa.Column("spectator_token_hash", sa.Text(), nullable=False),
        sa.Column("blue_team_name", sa.String(100), nullable=True),
        sa.Column("red_team_name", sa.String(100), nullable=True),
        sa.Column("blue_score", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("red_score", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("game1_first_pick", sa.String(4), nullable=False),
        sa.Column("status", sa.String(11), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("format IN ('bo1','bo3','bo5')", name="ck_series_format"),
        sa.CheckConstraint("game1_first_pick IN ('blue','red')", name="ck_series_first_pick"),
        sa.CheckConstraint("status IN ('pending','in_progress','complete')", name="ck_series_status"),
        sa.CheckConstraint("timer_seconds BETWEEN 10 AND 120", name="ck_series_timer"),
        sa.CheckConstraint("NOT (format = 'bo1' AND fearless = true)", name="ck_no_fearless_bo1"),
    )

    op.create_table(
        "games",
        sa.Column("id", sa.String(8), primary_key=True),
        sa.Column("series_id", sa.String(8), sa.ForeignKey("series.id", ondelete="CASCADE"), nullable=False),
        sa.Column("game_number", sa.Integer(), nullable=False),
        sa.Column("first_pick_side", sa.String(4), nullable=False),
        sa.Column("status", sa.String(11), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("winner", sa.String(4), nullable=True),
        sa.Column("draft_state_json", postgresql.JSONB(), nullable=True),
        sa.Column("fearless_pool_json", postgresql.JSONB(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("first_pick_side IN ('blue','red')", name="ck_game_first_pick"),
        sa.CheckConstraint("status IN ('pending','in_progress','complete')", name="ck_game_status"),
        sa.CheckConstraint("winner IS NULL OR winner IN ('blue','red')", name="ck_game_winner"),
        sa.CheckConstraint("game_number >= 1", name="ck_game_number"),
    )

    op.create_table(
        "champion_cache",
        sa.Column("patch", sa.String(20), primary_key=True),
        sa.Column("data_json", postgresql.JSONB(), nullable=False),
        sa.Column("cached_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("champion_cache")
    op.drop_table("games")
    op.drop_table("series")

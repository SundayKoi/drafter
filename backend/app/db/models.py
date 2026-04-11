from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import BOOLEAN, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Series(Base):
    __tablename__ = "series"

    id: Mapped[str] = mapped_column(String(8), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    format: Mapped[str] = mapped_column(String(3), nullable=False)
    fearless: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False)
    patch: Mapped[str] = mapped_column(String(20), nullable=False)
    timer_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    blue_token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    red_token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    spectator_token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    blue_team_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    red_team_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    blue_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    red_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    game1_first_pick: Mapped[str] = mapped_column(String(4), nullable=False)
    status: Mapped[str] = mapped_column(String(11), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    games: Mapped[list["Game"]] = relationship(
        back_populates="series", cascade="all, delete-orphan", order_by="Game.game_number"
    )

    __table_args__ = (
        CheckConstraint("format IN ('bo1','bo3','bo5')", name="ck_series_format"),
        CheckConstraint("game1_first_pick IN ('blue','red')", name="ck_series_first_pick"),
        CheckConstraint(
            "status IN ('pending','in_progress','complete')", name="ck_series_status"
        ),
        CheckConstraint("timer_seconds BETWEEN 10 AND 120", name="ck_series_timer"),
        CheckConstraint(
            "NOT (format = 'bo1' AND fearless = true)", name="ck_no_fearless_bo1"
        ),
    )


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(8), primary_key=True)
    series_id: Mapped[str] = mapped_column(
        String(8), ForeignKey("series.id", ondelete="CASCADE"), nullable=False
    )
    game_number: Mapped[int] = mapped_column(Integer, nullable=False)
    first_pick_side: Mapped[str] = mapped_column(String(4), nullable=False)
    status: Mapped[str] = mapped_column(String(11), nullable=False, default="pending")
    winner: Mapped[str | None] = mapped_column(String(4), nullable=True)
    draft_state_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    fearless_pool_json: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    series: Mapped["Series"] = relationship(back_populates="games")

    __table_args__ = (
        CheckConstraint("first_pick_side IN ('blue','red')", name="ck_game_first_pick"),
        CheckConstraint(
            "status IN ('pending','in_progress','complete')", name="ck_game_status"
        ),
        CheckConstraint(
            "winner IS NULL OR winner IN ('blue','red')", name="ck_game_winner"
        ),
        CheckConstraint("game_number >= 1", name="ck_game_number"),
    )


class ChampionCache(Base):
    __tablename__ = "champion_cache"

    patch: Mapped[str] = mapped_column(String(20), primary_key=True)
    data_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

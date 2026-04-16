import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db.database import AsyncSessionLocal
from app.db.repos import series_repo
from app.models.draft import DraftState
from app.security.rate_limit import limiter
from app.store import rooms as store
from app.store.rooms import DraftRoom
from app.routers.auth import router as auth_router
from app.routers.champions import router as champions_router
from app.routers.draft import router as draft_router
from app.routers.news import router as news_router
from app.routers.series import router as series_router
from app.routers.settings import router as settings_router
from app.ws.handler import router as ws_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: reload any series with status="in_progress" into memory
    # so drafts survive server restarts mid-game
    async with AsyncSessionLocal() as db:
        active = await series_repo.get_active_series(db)
        for series in active:
            games = await series_repo.get_series_games(db, series.id)
            current_game = next(
                (g for g in reversed(games) if g.status == "in_progress"), None
            )
            if current_game and current_game.draft_state_json:
                state = DraftState.model_validate(current_game.draft_state_json)
                fearless_pool = set()
                if series.fearless:
                    from app.logic.fearless import build_fearless_pool
                    completed = [
                        {"draft_state_json": g.draft_state_json}
                        for g in games if g.status == "complete"
                    ]
                    fearless_pool = build_fearless_pool(completed)
                store.rooms[series.id] = DraftRoom(
                    series=series,
                    state=state,
                    fearless_pool=fearless_pool,
                )
                logger.info("Reloaded room: %s", series.id)

    logger.info("Loaded %d active rooms", len(store.rooms))
    yield

    # Shutdown: cancel all timer tasks cleanly
    for room in store.rooms.values():
        if room.timer_task and not room.timer_task.done():
            room.timer_task.cancel()
    store.rooms.clear()
    logger.info("Shutdown complete")


app = FastAPI(title="Ember Draft Tool", lifespan=lifespan)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(series_router)
app.include_router(draft_router)
app.include_router(champions_router)
app.include_router(ws_router)
app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(news_router)


@app.get("/health")
async def health():
    return {"status": "ok", "rooms": len(store.rooms)}

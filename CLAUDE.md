# Ember Esports Draft Tool — Claude Code Implementation Plan
> Real-time LoL draft simulator for Ember Esports. Hosted on Ember's VPS at drafter.emberesports.com. Ember branding hardcoded. No multi-tenant, no billing, no public platform.

---

## Product Overview

A League of Legends draft tool built exclusively for Ember Esports. Supports Bo1/Bo3/Bo5 series, fearless draft mode, flexible first-pick side assignment, and real-time WebSocket sync via shared room links. Two captains and a spectator share a single URL set per series.

**Stack:**
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python + FastAPI + WebSockets
- **Database:** PostgreSQL (asyncpg + SQLAlchemy async + Alembic)
- **Hosting:** Ember's VPS — Nginx, Docker Compose
- **Data:** Riot Data Dragon API (champion data, splash art)
- **Branding:** Ember colors and logo hardcoded as constants — no DB theme system

---

## Repository Structure

```
ember-drafter/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DraftBoard/
│   │   │   │   ├── DraftBoard.tsx          # Root layout — blue side | center | red side
│   │   │   │   ├── TeamColumn.tsx          # One side's bans + picks column
│   │   │   │   ├── BanSlot.tsx             # Ban cell: icon + X overlay when locked
│   │   │   │   ├── PickSlot.tsx            # Pick cell: splash art + name overlay
│   │   │   │   └── ActiveIndicator.tsx     # Pulsing border on currently-acting slot
│   │   │   ├── ChampionGrid/
│   │   │   │   ├── ChampionGrid.tsx        # Scrollable grid of all champions
│   │   │   │   ├── ChampionCard.tsx        # Tile: icon, name, available/used/fearless states
│   │   │   │   ├── SearchBar.tsx           # Text search input
│   │   │   │   └── RoleFilter.tsx          # Top/Jg/Mid/Bot/Sup toggle buttons
│   │   │   ├── Timer/
│   │   │   │   ├── DraftTimer.tsx          # SVG arc countdown, color shifts <10s
│   │   │   │   └── useTimer.ts             # Countdown hook, auto-advance on 0
│   │   │   ├── Controls/
│   │   │   │   ├── ActionBar.tsx           # Lock In button + phase label
│   │   │   │   ├── ReadyGate.tsx           # Pre-draft ready-check overlay
│   │   │   │   └── SeriesControls.tsx      # Next Game / Copy Link buttons
│   │   │   ├── Series/
│   │   │   │   ├── SeriesHeader.tsx        # Format badge, scores, first-pick indicator
│   │   │   │   ├── GameHistory.tsx         # Collapsed previous game drafts
│   │   │   │   └── FearlessPool.tsx        # Icon strip of fearless-locked champions
│   │   │   ├── Overlay/
│   │   │   │   ├── HoverPreview.tsx        # Large splash on champion hover
│   │   │   │   ├── BannedChampionToast.tsx # Flash animation when champ gets banned
│   │   │   │   └── SideCoinFlip.tsx        # Animated first-pick reveal overlay
│   │   │   └── Layout/
│   │   │       ├── Header.tsx              # Ember logo, series name, patch badge
│   │   │       └── ConnectionStatus.tsx    # WS dot (green/yellow/red)
│   │   ├── hooks/
│   │   │   ├── useDraft.ts                 # Draft state machine + WS dispatch
│   │   │   ├── useSeries.ts                # Series state: game number, scores, fearless pool
│   │   │   ├── useChampions.ts             # Fetch + cache DataDragon champion list
│   │   │   ├── useWebSocket.ts             # WS connection, reconnect, message parsing
│   │   │   └── useRole.ts                  # Derive role from token (blue/red/spectator)
│   │   ├── types/
│   │   │   ├── draft.ts                    # DraftState, SlotState, DraftPhase
│   │   │   ├── series.ts                   # SeriesState, SeriesFormat, GameSummary
│   │   │   ├── ws.ts                       # WebSocket message envelope types
│   │   │   └── champion.ts                 # DataDragon ChampionData shape
│   │   ├── utils/
│   │   │   ├── draftOrder.ts               # generateDraftOrder(first_pick_side)
│   │   │   ├── dataDragon.ts               # Splash URL, icon URL, patch version helpers
│   │   │   └── seriesId.ts                 # nanoid generator
│   │   ├── constants/
│   │   │   └── brand.ts                    # Ember branding: colors, logo URL, site name
│   │   ├── context/
│   │   │   └── DraftContext.tsx            # Draft + series + champions combined context
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx             # Create new series
│   │   │   ├── DraftPage.tsx               # Main draft view /draft/:seriesId
│   │   │   └── SpectatorPage.tsx           # Read-only live draft view
│   │   ├── App.tsx                         # Router: / | /draft/:id | /spectate/:id
│   │   └── main.tsx
│   ├── public/
│   │   └── fonts/                          # Self-hosted: Bebas Neue, Space Mono, Inter
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                         # FastAPI app, CORS, lifespan, routers
│   │   ├── config.py                       # pydantic-settings, reads .env
│   │   ├── routers/
│   │   │   ├── series.py                   # POST /series/new, GET /series/{id}, /history
│   │   │   ├── draft.py                    # POST /draft/{id}/next-game
│   │   │   └── champions.py                # GET /champions?patch= (proxy + DB cache)
│   │   ├── ws/
│   │   │   ├── manager.py                  # ConnectionManager: rooms, broadcast, disconnect
│   │   │   └── handler.py                  # WS /ws/{series_id}?token=
│   │   ├── models/
│   │   │   ├── draft.py                    # DraftState, SlotState, DraftPhase (Pydantic)
│   │   │   ├── series.py                   # SeriesConfig, SeriesState, GameResult
│   │   │   └── messages.py                 # WS message envelope types
│   │   ├── db/
│   │   │   ├── database.py                 # SQLAlchemy async engine + session factory
│   │   │   ├── models.py                   # ORM table definitions
│   │   │   └── repos/
│   │   │       ├── series_repo.py          # CRUD: Series, Games
│   │   │       └── champion_cache_repo.py  # Cache DataDragon in DB
│   │   ├── logic/
│   │   │   ├── draft_engine.py             # apply_action(state, action) -> state (pure fn)
│   │   │   ├── draft_order.py              # generate_draft_order(first_pick_side)
│   │   │   ├── fearless.py                 # build_fearless_pool, validate_fearless_pick
│   │   │   └── timer.py                    # asyncio timer task per room
│   │   ├── security/
│   │   │   ├── tokens.py                   # Token generation, hashing, verification
│   │   │   └── rate_limit.py               # slowapi limiters
│   │   └── store/
│   │       └── rooms.py                    # In-memory live DraftRoom objects
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── alembic.ini
│   ├── tests/
│   │   ├── test_draft_engine.py
│   │   ├── test_draft_order.py             # Tests for both first-pick sides
│   │   ├── test_fearless.py
│   │   ├── test_security.py
│   │   └── test_ws_flow.py
│   ├── .env.example
│   ├── requirements.txt
│   └── pyproject.toml
│
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── nginx/
│   │   └── ember-drafter.conf
│   └── scripts/
│       ├── deploy.sh
│       ├── backup_db.sh
│       └── init_db_user.sql               # Creates restricted Postgres users
│
├── SECURITY.md
└── README.md
```

---

## Ember Branding Constants (`src/constants/brand.ts`)

Hardcoded — no DB, no theme system. Update these when Ember's brand changes.

```typescript
export const BRAND = {
  name: 'Ember Esports',
  logoUrl: '/assets/ember-logo.png',      // place logo in public/assets/
  siteName: 'Ember Draft Tool',
  colors: {
    primary:   '#FF6B00',                 // Ember orange — update to actual brand color
    secondary: '#1A1A1A',
    accent:    '#FFFFFF',
    bg:        '#0A0A0A',
    surface:   '#141414',
    border:    '#222222',
    muted:     '#666666',
    blueSide:  '#2563EB',
    redSide:   '#DC2626',
    gold:      '#EAB308',
    fearless:  '#7F1D1D',
  },
} as const;
```

These feed directly into `tailwind.config.ts` and CSS variables. No runtime theme loading.

---

## Database Schema (PostgreSQL)

```python
# Series — one per Bo1/Bo3/Bo5 event
class Series(Base):
    __tablename__ = "series"
    id: str                         # 8-char nanoid PK
    name: str                       # max 200 chars
    format: str                     # "bo1" | "bo3" | "bo5"
    fearless: bool
    patch: str                      # max 20 chars, e.g. "15.8.1"
    timer_seconds: int              # 10–120
    blue_token_hash: str            # bcrypt hash — never store raw token
    red_token_hash: str
    spectator_token_hash: str
    blue_team_name: str | None      # max 100 chars
    red_team_name: str | None       # max 100 chars
    blue_score: int                 # game wins this series
    red_score: int
    game1_first_pick: str           # "blue" | "red"
    status: str                     # "pending" | "in_progress" | "complete"
    created_at: datetime
    updated_at: datetime

    __table_args__ = (
        CheckConstraint("format IN ('bo1','bo3','bo5')",             name="ck_series_format"),
        CheckConstraint("game1_first_pick IN ('blue','red')",        name="ck_series_first_pick"),
        CheckConstraint("status IN ('pending','in_progress','complete')", name="ck_series_status"),
        CheckConstraint("timer_seconds BETWEEN 10 AND 120",          name="ck_series_timer"),
        CheckConstraint("NOT (format = 'bo1' AND fearless = true)",  name="ck_no_fearless_bo1"),
    )

# Game — one per draft within a series
class Game(Base):
    __tablename__ = "games"
    id: str                         # nanoid PK
    series_id: str                  # FK -> series.id ON DELETE CASCADE
    game_number: int                # >= 1
    first_pick_side: str            # "blue" | "red"
    status: str                     # "pending" | "in_progress" | "complete"
    winner: str | None              # "blue" | "red" | null
    draft_state_json: dict          # JSONB — validated DraftState before write
    fearless_pool_json: list        # JSONB — champion_ids locked out for next games
    started_at: datetime | None
    completed_at: datetime | None

    __table_args__ = (
        CheckConstraint("first_pick_side IN ('blue','red')",              name="ck_game_first_pick"),
        CheckConstraint("status IN ('pending','in_progress','complete')", name="ck_game_status"),
        CheckConstraint("winner IS NULL OR winner IN ('blue','red')",     name="ck_game_winner"),
        CheckConstraint("game_number >= 1",                               name="ck_game_number"),
    )

# ChampionCache — avoid hammering DataDragon on every request
class ChampionCache(Base):
    __tablename__ = "champion_cache"
    patch: str                      # PK, max 20 chars
    data_json: dict                 # JSONB — full DataDragon champion summary
    cached_at: datetime
```

---

## Phase 1 — Infrastructure & Database

### Step 1.1 — Dependencies

```bash
# Backend
pip install fastapi uvicorn[standard] websockets pydantic pydantic-settings \
            sqlalchemy[asyncio] asyncpg alembic aiohttp bcrypt \
            slowapi nanoid pytest pytest-asyncio

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss @tailwindcss/vite react-router-dom zustand nanoid
```

### Step 1.2 — Environment variables (`.env.example`)

```
# Database — two users (see init_db_user.sql)
DATABASE_URL=postgresql+asyncpg://drafter_app:APP_PASSWORD@postgres:5432/ember_drafter
MIGRATION_DATABASE_URL=postgresql+asyncpg://drafter_migrate:MIGRATE_PASSWORD@postgres:5432/ember_drafter
POSTGRES_SUPERUSER_PASSWORD=SUPERUSER_PASSWORD
APP_DB_PASSWORD=APP_PASSWORD
MIGRATE_DB_PASSWORD=MIGRATE_PASSWORD

# App
SECRET_KEY=                     # python3 -c "import secrets; print(secrets.token_hex(32))"
CORS_ORIGINS=["https://drafter.emberesports.com"]
```

### Step 1.3 — Database connection (`app/db/database.py`)

```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

### Step 1.4 — Restricted Postgres users (`infra/scripts/init_db_user.sql`)

```sql
-- Run once at DB init via docker-entrypoint-initdb.d

-- Migration user: DDL for Alembic only
CREATE USER drafter_migrate WITH PASSWORD 'MIGRATE_PASSWORD';
GRANT CONNECT ON DATABASE ember_drafter TO drafter_migrate;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drafter_migrate;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO drafter_migrate;

-- App runtime user: DML only — cannot DROP or ALTER anything
CREATE USER drafter_app WITH PASSWORD 'APP_PASSWORD';
GRANT CONNECT ON DATABASE ember_drafter TO drafter_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO drafter_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO drafter_app;

-- Auto-grant on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO drafter_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO drafter_app;
```

### Step 1.5 — Alembic setup

```bash
alembic init alembic
# Edit alembic/env.py:
#   - Import Base from app.db.models
#   - Use MIGRATION_DATABASE_URL from settings
#   - Set target_metadata = Base.metadata
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### Step 1.6 — On startup: reload in-progress series (`app/main.py`)

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: reload any series with status="in_progress" into memory
    # so drafts survive server restarts mid-game
    async with AsyncSessionLocal() as db:
        active = await series_repo.get_active_series(db)
        for series in active:
            games = await series_repo.get_series_games(db, series.id)
            current_game = next((g for g in games if g.status == "in_progress"), None)
            if current_game:
                state = DraftState.model_validate(current_game.draft_state_json)
                store.rooms[series.id] = DraftRoom(series=series, state=state)
    yield
    # Shutdown: cancel all timer tasks cleanly
    for room in store.rooms.values():
        if room.timer_task:
            room.timer_task.cancel()
```

---

## Phase 2 — Security Core

### Token system (`app/security/tokens.py`)

```python
import secrets
import bcrypt

def generate_token() -> str:
    """256 bits of entropy. Cryptographically secure."""
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    """Hash for storage. Never store raw tokens."""
    return bcrypt.hashpw(token.encode(), bcrypt.gensalt(rounds=12)).decode()

def verify_token(token: str, token_hash: str) -> bool:
    return bcrypt.checkpw(token.encode(), token_hash.encode())

# Series creation flow:
# 1. generate_token() x3
# 2. Return all three raw in POST /series/new response — only time they're shown
# 3. Store hash_token(each) in DB
# 4. WS connect: verify_token(presented, stored_hash) to assign role
```

### Token verification for role assignment (`app/ws/handler.py`)

```python
async def resolve_role(
    series: Series,
    presented_token: str
) -> Literal["blue", "red", "spectator"]:
    if verify_token(presented_token, series.blue_token_hash):
        return "blue"
    if verify_token(presented_token, series.red_token_hash):
        return "red"
    if verify_token(presented_token, series.spectator_token_hash):
        return "spectator"
    await websocket.close(code=4001, reason="Invalid token")
    raise WebSocketException(code=4001)
```

### Token auth on REST endpoints

```python
# GET /series/{id} requires a valid token — draft state is not public
async def get_series(
    series_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    series = await series_repo.get_series(db, series_id)
    if not series:
        raise HTTPException(404)
    role = await resolve_role_http(series, token)  # raises 403 if invalid
    return serialize_series_for_role(series, role)
```

### Rate limiting (`app/security/rate_limit.py`)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# In routers — applied as decorators:
# POST /series/new       → @limiter.limit("20/hour")
# GET  /champions        → @limiter.limit("60/minute")
# GET  /series/{id}      → @limiter.limit("120/minute")
```

---

## Phase 3 — Draft Order Engine

### Abstract sequence (`app/logic/draft_order.py`)

```python
# fp = first-pick team, sp = second-pick team
# Sequence never changes — only which team is "fp" changes per game
ABSTRACT_DRAFT_ORDER = [
    ("fp","ban"),("sp","ban"),("fp","ban"),("sp","ban"),("fp","ban"),("sp","ban"),
    ("fp","pick"),("sp","pick"),("sp","pick"),("fp","pick"),("fp","pick"),("sp","pick"),
    ("sp","ban"),("fp","ban"),("sp","ban"),("fp","ban"),
    ("sp","pick"),("fp","pick"),("fp","pick"),("sp","pick"),
]

def generate_draft_order(first_pick_side: Literal["blue","red"]) -> list[tuple[str,str]]:
    """
    Substitutes concrete sides into the abstract sequence.

    first_pick_side="blue" → classic: blue bans first, blue picks first
    first_pick_side="red"  → red bans first, red picks first

    UI columns are ALWAYS Blue (left) / Red (right).
    first_pick_side only controls who acts first in the sequence.
    Active glow follows the actor regardless of column position.

    Returns list of ("blue"|"red", "ban"|"pick") tuples, length 20.
    """
    sp = "red" if first_pick_side == "blue" else "blue"
    role_map = {"fp": first_pick_side, "sp": sp}
    return [(role_map[r], a) for r, a in ABSTRACT_DRAFT_ORDER]

def determine_first_pick(game1_first_pick: str, game_number: int) -> str:
    """
    Strict alternation starting from game1_first_pick.
    Game 1: assigned side. Game 2: opposite. Game 3: back. Etc.
    Either captain can override via START_NEXT_GAME before the game begins.
    """
    if game_number % 2 == 1:
        return game1_first_pick
    return "red" if game1_first_pick == "blue" else "blue"
```

Frontend mirror (`src/utils/draftOrder.ts`):

```typescript
type SlotDef = { side: 'blue' | 'red'; action_type: 'ban' | 'pick' };

const ABSTRACT_ORDER: Array<['fp' | 'sp', 'ban' | 'pick']> = [
  ['fp','ban'],['sp','ban'],['fp','ban'],['sp','ban'],['fp','ban'],['sp','ban'],
  ['fp','pick'],['sp','pick'],['sp','pick'],['fp','pick'],['fp','pick'],['sp','pick'],
  ['sp','ban'],['fp','ban'],['sp','ban'],['fp','ban'],
  ['sp','pick'],['fp','pick'],['fp','pick'],['sp','pick'],
];

export function generateDraftOrder(firstPickSide: 'blue' | 'red'): SlotDef[] {
  const sp = firstPickSide === 'blue' ? 'red' : 'blue';
  return ABSTRACT_ORDER.map(([role, action]) => ({
    side: role === 'fp' ? firstPickSide : sp,
    action_type: action,
  }));
}

export function isMyTurn(state: DraftState, myRole: 'blue' | 'red' | 'spectator'): boolean {
  if (myRole === 'spectator' || state.phase === 'WAITING' || state.phase === 'COMPLETE') return false;
  return state.slots[state.current_slot_index]?.side === myRole;
}
```

---

## Phase 4 — Fearless Draft

```python
# app/logic/fearless.py

def build_fearless_pool(completed_games: list[Game]) -> set[str]:
    """
    Collects all PICKED champion_ids from completed games.
    Bans do NOT carry over — only picks are fearless-locked.
    Champions in the pool can still be banned in later games.
    Returns set of champion_ids that cannot be picked again this series.
    """
    pool = set()
    for game in completed_games:
        for slot in (game.draft_state_json or {}).get("slots", []):
            if slot["action_type"] == "pick" and slot["champion_id"]:
                pool.add(slot["champion_id"])
    return pool
```

Frontend champion card states (`src/components/ChampionGrid/ChampionCard.tsx`):

```typescript
// Three visual states:
// 1. Available        — normal, clickable
// 2. Used this draft  — grey overlay, not clickable (banned or picked this game)
// 3. Fearless locked  — dark crimson overlay + crossed-shield icon
//                       tooltip: "Already picked in Game N"
//                       still clickable for BANS, blocked for PICKS only

const isFearlessLocked = fearlessPool.includes(champion.id)
  && currentSlot?.action_type === 'pick';
const isUsedThisDraft = usedInCurrentDraft.has(champion.id);
const isDisabled = isFearlessLocked || isUsedThisDraft;
```

---

## Phase 5 — Draft Engine

```python
# app/logic/draft_engine.py

class DraftValidationError(Exception):
    def __init__(self, message: str, code: str = "INVALID_ACTION"):
        self.message = message
        self.code = code

def apply_action(
    state: DraftState,
    champion_id: str,
    acting_side: str,
    fearless_pool: set[str] = frozenset(),
) -> DraftState:
    """
    Pure function. Returns new DraftState.
    Raises DraftValidationError on any invalid move.
    Never mutates input state.
    """
    if state.phase == DraftPhase.COMPLETE:
        raise DraftValidationError("Draft is already complete")

    current_slot = state.slots[state.current_slot_index]

    if current_slot.side != acting_side:
        raise DraftValidationError(f"Not {acting_side}'s turn", "WRONG_TURN")

    # Champion already used in this draft?
    used = {s.champion_id for s in state.slots if s.locked and s.champion_id}
    if champion_id in used:
        raise DraftValidationError(f"{champion_id} already used", "ALREADY_USED")

    # Fearless check — picks only, not bans
    if current_slot.action_type == "pick" and champion_id in fearless_pool:
        raise DraftValidationError(
            f"{champion_id} already picked in this series",
            "FEARLESS_VIOLATION"
        )

    # Apply action
    new_slots = [s.model_copy() for s in state.slots]
    new_slots[state.current_slot_index] = current_slot.model_copy(
        update={"champion_id": champion_id, "locked": True}
    )

    next_index = state.current_slot_index + 1

    return state.model_copy(update={
        "slots": new_slots,
        "current_slot_index": next_index,
        "phase": compute_phase(next_index),
    })

def compute_phase(slot_index: int) -> DraftPhase:
    if slot_index == 0:    return DraftPhase.WAITING
    if slot_index <= 6:    return DraftPhase.BAN_1
    if slot_index <= 12:   return DraftPhase.PICK_1
    if slot_index <= 16:   return DraftPhase.BAN_2
    if slot_index <= 20:   return DraftPhase.PICK_2
    return DraftPhase.COMPLETE
```

---

## Phase 6 — Series Logic

### Models (`app/models/series.py`)

```python
class SeriesConfig(BaseModel):
    name: str = Field(..., max_length=200, min_length=1)
    format: Literal["bo1","bo3","bo5"]
    fearless: bool = False
    patch: str = Field(..., max_length=20)
    timer_seconds: int = Field(30, ge=10, le=120)
    game1_first_pick: Literal["blue","red","coin_flip"] = "blue"
    blue_team_name: str | None = Field(None, max_length=100)
    red_team_name: str | None = Field(None, max_length=100)

    @model_validator(mode="after")
    def no_fearless_bo1(self):
        if self.format == "bo1" and self.fearless:
            raise ValueError("Fearless mode requires Bo3 or Bo5")
        return self

class SeriesState(BaseModel):
    series_id: str
    format: str
    fearless: bool
    current_game_number: int
    max_games: int                  # 1, 3, or 5
    games_needed_to_win: int        # 1, 2, or 3
    blue_score: int
    red_score: int
    blue_team_name: str | None
    red_team_name: str | None
    status: str
    games: list[GameSummary]
    fearless_pool: list[str]        # cumulative picks across all completed games
    current_draft: DraftState | None
```

### REST endpoints (`app/routers/series.py`)

```
POST /series/new
  body: SeriesConfig
  returns: {
    series_id: str,
    blue_url:       "https://drafter.emberesports.com/draft/{id}?token={raw_blue_token}",
    red_url:        "https://drafter.emberesports.com/draft/{id}?token={raw_red_token}",
    spectator_url:  "https://drafter.emberesports.com/draft/{id}?token={raw_spectator_token}"
  }
  note: raw tokens shown ONCE here only — never stored raw, never returned again

GET /series/{id}?token={token}
  returns: SeriesState (role-appropriate view)
  requires: valid token

POST /series/{id}/next-game
  body: { winner: "blue"|"red", first_pick_override?: "blue"|"red" }
  auth: blue or red token (not spectator)
  - persists game winner, updates scores
  - creates next Game row if series not over
  - determines next game first_pick_side via alternation or override
  - broadcasts SERIES_SYNC to all connections in room

GET /series/{id}/history?token={token}
  returns: list of completed Game objects with full draft snapshots
```

---

## Phase 7 — WebSocket Layer

### Connection manager (`app/ws/manager.py`)

```python
class ConnectionManager:
    # rooms: { series_id: { role: WebSocket } }
    rooms: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, series_id: str, role: str, ws: WebSocket)
    async def disconnect(self, series_id: str, role: str)
    async def broadcast(self, series_id: str, message: dict)
        # Sends to ALL connections in a room (blue + red + spectator)
    async def send_to(self, series_id: str, role: str, message: dict)
        # Sends to ONE specific role in a room
```

### WS handler (`app/ws/handler.py`)

Endpoint: `WS /ws/{series_id}?token={token}`

```
On connect:
  1. Load series from DB (or in-memory store if active)
  2. resolve_role(series, token) — closes with 4001 if invalid
  3. Register connection in ConnectionManager
  4. Send SYNC (current DraftState + SeriesState)

On READY:
  - Mark blue_ready or red_ready on state
  - Broadcast SYNC
  - If both ready: start timer task, advance phase from WAITING to BAN_1

On LOCK_IN { champion_id }:
  - Verify acting side matches token role — reject if not their turn
  - Validate champion_id against known champion list
  - apply_action(state, champion_id, role, fearless_pool)
  - Reset timer task
  - Broadcast SYNC
  - If phase == COMPLETE: persist to DB, broadcast GAME_COMPLETE

On REPORT_WINNER { winner }:
  - Blue or red token only (not spectator)
  - series_repo.complete_game(game_id, winner, draft_state, fearless_pool)
  - Update series scores
  - Broadcast SERIES_SYNC

On START_NEXT_GAME { first_pick_override? }:
  - Captain only
  - Create new Game row with next game number + determined first_pick_side
  - Build fresh DraftState from generate_draft_order(first_pick_side)
  - Broadcast NEXT_GAME_STARTING

On PING: send PONG (keepalive)
```

### Timer task (`app/logic/timer.py`)

```python
async def run_room_timer(series_id: str, timer_seconds: int, store, manager):
    """
    Runs as asyncio.Task per active game.
    Each second: decrement timer, broadcast TIMER_TICK.
    On 0:
      - Ban slot: auto-pass (champion_id=None, slot locked, advance)
      - Pick slot: auto-pick random legal champion
                   (not banned, not already picked, not fearless-locked)
    Cancelled and restarted on each LOCK_IN.
    Cancelled when game reaches COMPLETE.
    """
```

---

## Phase 8 — Frontend Types

`src/types/draft.ts`:
```typescript
export type Side = 'blue' | 'red';
export type ActionType = 'ban' | 'pick';
export type DraftPhase = 'WAITING' | 'BAN_1' | 'PICK_1' | 'BAN_2' | 'PICK_2' | 'COMPLETE';

export interface SlotState {
  slot_index: number;
  side: Side;
  action_type: ActionType;
  champion_id: string | null;
  locked: boolean;
}

export interface DraftState {
  game_id: string;
  series_id: string;
  game_number: number;
  phase: DraftPhase;
  current_slot_index: number;       // 0–19
  slots: SlotState[];               // exactly 20
  first_pick_side: Side;
  blue_ready: boolean;
  red_ready: boolean;
  timer_seconds_remaining: number;
  fearless_pool: string[];          // champion_ids, empty if fearless=false
  fearless_mode: boolean;
}
```

`src/types/series.ts`:
```typescript
export type SeriesFormat = 'bo1' | 'bo3' | 'bo5';

export interface GameSummary {
  game_number: number;
  winner: Side | null;
  first_pick_side: Side;
  draft_state: DraftState;
}

export interface SeriesState {
  series_id: string;
  format: SeriesFormat;
  fearless: boolean;
  current_game_number: number;
  max_games: number;
  games_needed_to_win: number;
  blue_score: number;
  red_score: number;
  blue_team_name: string | null;
  red_team_name: string | null;
  status: 'pending' | 'in_progress' | 'complete';
  games: GameSummary[];
  fearless_pool: string[];
  current_draft: DraftState | null;
}
```

---

## Phase 9 — WebSocket Message Protocol

```typescript
// Client → Server
type ClientMessage =
  | { type: 'READY' }
  | { type: 'HOVER';           payload: { champion_id: string } }
  | { type: 'LOCK_IN';         payload: { champion_id: string } }
  | { type: 'REPORT_WINNER';   payload: { winner: Side } }
  | { type: 'START_NEXT_GAME'; payload: { first_pick_override?: Side } }
  | { type: 'PING' }

// Server → Client
type ServerMessage =
  | { type: 'SYNC';               payload: { draft: DraftState; series: SeriesState } }
  | { type: 'TIMER_TICK';         payload: { seconds_remaining: number } }
  | { type: 'HOVER_UPDATE';       payload: { champion_id: string; side: Side } }
  | { type: 'SERIES_SYNC';        payload: SeriesState }
  | { type: 'GAME_COMPLETE';      payload: { game_number: number; winner: Side; series: SeriesState } }
  | { type: 'SERIES_COMPLETE';    payload: { winner: Side; blue_score: number; red_score: number } }
  | { type: 'NEXT_GAME_STARTING'; payload: { game_number: number; first_pick_side: Side; fearless_pool: string[] } }
  | { type: 'ERROR';              payload: { code: string; message: string } }
  | { type: 'PONG' }
```

---

## Phase 10 — Visual Design (Streetwear)

### Typography
- **Bebas Neue** — all caps condensed. Hero text, team names, phase labels, champion names in pick slots, series score display
- **Space Mono** — monospaced technical. Timer digits, patch version badge, slot indices, stat numbers
- **Inter** — body copy only (landing page description text)
- Self-host all three in `public/fonts/` — no Google Fonts requests

### Draft board layout
```
[BLUE SIDE column]     [CENTER panel]      [RED SIDE column]
─────────────────      ──────────────      ────────────────
Ban row (5 slots)      Series header       Ban row (5 slots)
                       Team scores
Pick slot 1            Phase label         Pick slot 1
Pick slot 2            DraftTimer          Pick slot 2
Pick slot 3            ChampionGrid        Pick slot 3
Pick slot 4            ActionBar           Pick slot 4
Pick slot 5            (Lock In btn)       Pick slot 5
```

### Tailwind config (`tailwind.config.ts`)
```typescript
import { BRAND } from './src/constants/brand';

export default {
  theme: {
    extend: {
      colors: {
        primary:   BRAND.colors.primary,
        secondary: BRAND.colors.secondary,
        'draft-bg':      BRAND.colors.bg,
        'draft-surface': BRAND.colors.surface,
        'draft-border':  BRAND.colors.border,
        'blue-side':     BRAND.colors.blueSide,
        'red-side':      BRAND.colors.redSide,
        'gold':          BRAND.colors.gold,
        'fearless':      BRAND.colors.fearless,
        'fearless-text': '#FCA5A5',
        'muted':         BRAND.colors.muted,
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono:    ['Space Mono', 'monospace'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
}
```

### Landing page
```
[EMBER LOGO]

DRAFT.        ← Bebas Neue, ~180px, white
DOMINATE.
WIN.

"Create a series, share the links, draft live."
← Space Mono, small, muted

[CREATE DRAFT →]   ← Bebas Neue, primary bg (Ember orange), black text

── HOW IT WORKS ──────────────────────────────
1. Create a series (Bo1 / Bo3 / Bo5)
2. Share Blue and Red links with captains
3. Draft live — changes sync in real time

── FEATURES ──────────────────────────────────
Fearless Draft · Flexible First Pick · Real-Time Sync · Series History

── footer ────────────────────────────────────
Ember Esports Draft Tool · Not affiliated with Riot Games
```

### Pick slot states
- **Empty:** dark surface card + faint role icon outline (Top/Jg/Mid/Bot/Sup), Bebas Neue "PICK" label
- **Active (your turn):** `box-shadow: 0 0 0 2px #EAB308, 0 0 20px #EAB308` pulse keyframe
- **Filled:** champion splash art cropped top-center, Bebas Neue champion name at bottom on 50% black gradient overlay
- **Locked (other team):** same filled state, no glow

### Ban slot states
- **Empty:** dark 48×48 square with dashed border
- **Filled:** champion icon, greyscale, `#DC2626` X overlay

---

## Phase 11 — Hosting & Infrastructure

### Docker Compose (`infra/docker-compose.yml`)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ember_drafter
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_SUPERUSER_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/scripts/init_db_user.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    # No ports exposed — internal Docker network only

  backend:
    build: ./backend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      MIGRATION_DATABASE_URL: ${MIGRATION_DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
    depends_on: [postgres]
    restart: unless-stopped
    command: >
      sh -c "alembic -x url=$MIGRATION_DATABASE_URL upgrade head &&
             uvicorn app.main:app --host 0.0.0.0 --port 8000"

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE: https://drafter.emberesports.com
    restart: unless-stopped
    # No ports exposed — Nginx proxies internally

  nginx:
    image: nginx:alpine
    ports: ["80:80","443:443"]
    volumes:
      - ./infra/nginx/ember-drafter.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [backend, frontend]
    restart: unless-stopped

volumes:
  postgres_data:
```

### Nginx config (`infra/nginx/ember-drafter.conf`)

```nginx
server {
    listen 443 ssl;
    server_name drafter.emberesports.com;

    ssl_certificate     /etc/letsencrypt/live/drafter.emberesports.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drafter.emberesports.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header X-XSS-Protection          "1; mode=block" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

    # Frontend SPA — all routes fall back to index.html
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
    }

    # REST API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host             $host;
        proxy_set_header X-Real-IP        $remote_addr;
        proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
    }

    # WebSocket — must upgrade connection
    location /ws/ {
        proxy_pass             http://backend:8000/ws/;
        proxy_http_version     1.1;
        proxy_set_header       Upgrade    $http_upgrade;
        proxy_set_header       Connection "upgrade";
        proxy_set_header       Host       $host;
        proxy_set_header       X-Real-IP  $remote_addr;
        proxy_read_timeout     3600s;     # keep WS alive through long drafts
    }
}

server {
    listen 80;
    server_name drafter.emberesports.com;
    return 301 https://$host$request_uri;
}
```

### Deploy script (`infra/scripts/deploy.sh`)

```bash
#!/bin/bash
set -e
echo "Pulling latest..."
git pull origin main

echo "Building images..."
docker compose -f infra/docker-compose.yml build

echo "Starting services..."
docker compose -f infra/docker-compose.yml up -d

echo "Waiting for health check..."
sleep 5
curl -sf https://drafter.emberesports.com/api/health \
  && echo "Deploy OK" \
  || echo "HEALTH CHECK FAILED — check logs"
```

### DB backup (`infra/scripts/backup_db.sh`)

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose -f /opt/ember-drafter/infra/docker-compose.yml \
  exec -T postgres pg_dump -U drafter_app ember_drafter \
  | gzip > /backups/ember_drafter_${TIMESTAMP}.sql.gz
find /backups -name "ember_drafter_*.sql.gz" -mtime +14 -delete
echo "Backup complete: ember_drafter_${TIMESTAMP}.sql.gz"
```

Cron entry (run `crontab -e` on VPS):
```
0 3 * * * /opt/ember-drafter/infra/scripts/backup_db.sh >> /var/log/drafter-backup.log 2>&1
```

---

## Implementation Order for Claude Code

Run as separate tasks in order. Each task = one Claude Code conversation.

1. `scaffold` — Full directory structure, all empty files, package.json, requirements.txt, .env.example, brand.ts with placeholder Ember values
2. `db-schema` — ORM models with all CHECK constraints, init_db_user.sql, Alembic init + first migration
3. `security-core` — tokens.py (generate/hash/verify), rate_limit.py, test_security.py
4. `draft-order` — generate_draft_order(first_pick_side) + determine_first_pick() + full tests for both sides
5. `draft-engine` — apply_action() with all validation + fearless check + compute_phase() + test suite
6. `fearless-logic` — build_fearless_pool() + validate + test_fearless.py
7. `series-repo` — series_repo.py: create_series, get_series, create_game, complete_game, get_series_games, get_active_series
8. `ws-backend` — manager.py + handler.py (token verify, all message types) + timer.py + lifespan startup reload
9. `rest-routes` — all REST endpoints with rate limiting + token auth, champion cache endpoint
10. `ts-types` — All TypeScript types in src/types/ mirroring backend models exactly
11. `champion-hook` — useChampions.ts + DataDragon proxy + champion_cache_repo.py
12. `ws-frontend` — useWebSocket.ts + useDraft.ts + useSeries.ts (Zustand stores)
13. `draft-board` — DraftBoard.tsx 3-column layout + TeamColumn.tsx + BanSlot.tsx + PickSlot.tsx
14. `champion-grid` — ChampionGrid.tsx + ChampionCard.tsx (3 visual states) + SearchBar.tsx + RoleFilter.tsx
15. `timer` — DraftTimer.tsx (SVG arc, color shifts) + useTimer.ts
16. `action-bar` — ActionBar.tsx Lock In flow + ReadyGate.tsx overlay
17. `series-ui` — SeriesHeader.tsx + GameHistory.tsx + FearlessPool.tsx
18. `landing-page` — LandingPage.tsx with create series form (Bo1/3/5, fearless toggle, first-pick selector, timer)
19. `visual-polish` — Self-host fonts, draft board diagonal texture, active slot glow, splash art in pick slots, ban slot icons
20. `overlays` — HoverPreview.tsx + SideCoinFlip.tsx + game complete overlay + series winner screen + BannedChampionToast.tsx
21. `infra` — docker-compose.yml + ember-drafter.conf + deploy.sh + backup_db.sh

---

## Key Notes for Claude Code

- **Branding is hardcoded** in `src/constants/brand.ts`. No DB theme system, no org slugs, no runtime CSS var injection from API. Tailwind config imports BRAND directly.
- **No multi-tenant system.** No Orgs table, no feature flags, no billing. Removed entirely.
- **First-pick ≠ column.** Blue column always left, red always right. `generate_draft_order()` controls who acts first. Active glow follows the actor, not the column.
- **Fearless applies to picks only.** Fearless-locked champions can still be banned. Bo1 + fearless rejected at Pydantic validation and DB CHECK constraint level.
- **Tokens hashed in DB.** Raw tokens shown once in POST /series/new response. `verify_token()` on every WS connect and protected REST call.
- **Two DB users.** `drafter_app` has DML only. `drafter_migrate` for Alembic. App never connects as a user that can DROP tables.
- **Lifespan startup** reloads in-progress series from DB into memory so drafts survive server restarts.
- **Timer is server-authoritative.** Client interpolates between TIMER_TICK messages. Auto-advance: bans pass (null champion), picks get random legal champion.
- **DataDragon URLs:** base `https://ddragon.leagueoflegends.com/cdn/{patch}/` — splash: `img/champion/splash/{Name}_0.jpg`, icon: `img/champion/{Name}.png`, latest patch: `https://ddragon.leagueoflegends.com/api/versions.json`
- **Room IDs:** 8-char nanoid. Never expose token hashes. URL format: `/draft/{series_id}?token={raw_token}`
- **`X-Frame-Options: SAMEORIGIN`** set in Nginx — fine for a single-domain tool with no iframe embedding needed.

---

## Local Dev

```bash
# Postgres
docker run -d --name ember-pg \
  -e POSTGRES_DB=ember_drafter \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=devpass \
  -p 5432:5432 postgres:16

# Backend
cd backend && cp .env.example .env  # fill in local values
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm run dev           # :5173, proxies to :8000
```

Vite proxy (`vite.config.ts`):
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8000',
    '/ws':  { target: 'ws://localhost:8000', ws: true },
  }
}
```

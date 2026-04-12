# Ember Esports — Main Site Implementation Plan
> Full org website for Ember Esports. Hosted on Ember's VPS at emberesports.com. Four LoL leagues: Cinder, Blaze, Scorch, Magma. Staff admin panel with email/password + Discord OAuth. Streetwear aesthetic using Ember brand colors.

---

## Product Overview

The main Ember Esports website. Public-facing pages for fans and teams, plus a staff admin panel for managing everything. No payment processing, no external dependencies beyond Discord OAuth and optional Google Sheets import.

**Public features:**
- Home page with news/announcements, featured matches, Twitch embed
- Standings page with league filter (Cinder / Blaze / Scorch / Magma)
- Scores/results page with league filter
- VODs page (YouTube embeds + Twitch clips)
- Team application form (per league)
- About page with org info and socials

**Admin features:**
- Staff login: email/password OR Discord OAuth
- Review and approve/deny team applications
- Manage standings and scores (manual entry + Google Sheets import)
- Post news and announcements
- Set Twitch channel, social links
- Manage VODs
- Manage individual player profiles

---

## Branding

All values hardcoded in `src/constants/brand.ts` — no DB theme system.

```typescript
export const BRAND = {
  name: 'Ember Esports',
  logoUrl: '/assets/ember-logo.png',       // place ember-new-logo.png here
  colors: {
    // Primary flame palette
    crimson:    '#CC1A1A',                  // deep red
    flame:      '#E63000',                  // bright red-orange
    gold:       '#F5A800',                  // amber
    yellow:     '#FFD700',                  // highlight yellow
    steel:      '#8A9099',                  // grey trim
    // Base
    bg:         '#0D0D0D',                  // near-black
    surface:    '#141414',                  // card bg
    surfaceAlt: '#1C1C1C',                  // elevated surface
    border:     '#2A2A2A',                  // subtle borders
    text:       '#FFFFFF',
    muted:      '#666666',
  },
  leagues: [
    { id: 'cinder',  name: 'Cinder',  tier: 1, color: '#FFD700' },  // top tier — gold
    { id: 'blaze',   name: 'Blaze',   tier: 2, color: '#F5A800' },  // amber
    { id: 'scorch',  name: 'Scorch',  tier: 3, color: '#E63000' },  // orange-red
    { id: 'magma',   name: 'Magma',   tier: 4, color: '#CC1A1A' },  // deep red
  ],
  socials: {
    twitch:   '',   // set by admin
    twitter:  '',
    discord:  '',
    youtube:  '',
    instagram: '',
  },
} as const;
```

**Typography:**
- **Bebas Neue** — headers, league names, scores, nav items
- **Space Mono** — stats, ranks, timestamps, op.gg links
- **Inter** — body copy, form labels, descriptions
- Self-host all three in `public/fonts/`

---

## Repository Structure

```
ember-site/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Navbar.tsx              # Top nav: logo, links, Twitch live badge
│   │   │   │   ├── Footer.tsx              # Socials, league links, copyright
│   │   │   │   └── PageWrapper.tsx         # Consistent page padding + bg
│   │   │   ├── Home/
│   │   │   │   ├── HeroSection.tsx         # Full-bleed logo + tagline + CTA
│   │   │   │   ├── NewsGrid.tsx            # Latest announcements grid
│   │   │   │   ├── FeaturedMatch.tsx       # Upcoming/recent featured match card
│   │   │   │   ├── TwitchEmbed.tsx         # Live Twitch player or offline card
│   │   │   │   └── LeagueCards.tsx         # 4 league cards linking to standings
│   │   │   ├── Standings/
│   │   │   │   ├── StandingsPage.tsx       # Full standings with league filter tabs
│   │   │   │   ├── LeagueFilter.tsx        # Cinder/Blaze/Scorch/Magma tab bar
│   │   │   │   ├── StandingsTable.tsx      # Team, W, L, W%, point diff, streak
│   │   │   │   └── TeamRow.tsx             # Single row: logo, name, record, trend
│   │   │   ├── Scores/
│   │   │   │   ├── ScoresPage.tsx          # Results + upcoming with league filter
│   │   │   │   ├── MatchCard.tsx           # Score card: team A vs team B, date, result
│   │   │   │   └── MatchDetail.tsx         # Expanded: game-by-game scores, VOD link
│   │   │   ├── Vods/
│   │   │   │   ├── VodsPage.tsx            # VOD grid with league filter
│   │   │   │   ├── VodCard.tsx             # Thumbnail, title, league badge, date
│   │   │   │   └── VodModal.tsx            # YouTube/Twitch embed lightbox
│   │   │   ├── Apply/
│   │   │   │   ├── ApplyPage.tsx           # League selector + application form
│   │   │   │   ├── LeagueSelector.tsx      # Pick which league to apply to
│   │   │   │   ├── ApplicationForm.tsx     # Full form (see schema below)
│   │   │   │   ├── PlayerRow.tsx           # Individual player entry (op.gg + role)
│   │   │   │   └── LogoUpload.tsx          # Team logo upload with preview
│   │   │   ├── About/
│   │   │   │   └── AboutPage.tsx           # Org description, staff list, socials
│   │   │   └── Admin/
│   │   │       ├── AdminLayout.tsx         # Admin sidebar + protected route wrapper
│   │   │       ├── LoginPage.tsx           # Email/password + Discord OAuth button
│   │   │       ├── Dashboard.tsx           # Overview: pending apps, recent activity
│   │   │       ├── Applications/
│   │   │       │   ├── ApplicationsList.tsx  # Table: pending/approved/denied + filter
│   │   │       │   └── ApplicationDetail.tsx # Full app view with approve/deny buttons
│   │   │       ├── Standings/
│   │   │       │   ├── StandingsManager.tsx  # Edit standings per league
│   │   │       │   └── SheetsImport.tsx      # Google Sheets URL import flow
│   │   │       ├── Scores/
│   │   │       │   ├── ScoresManager.tsx     # Add/edit match results
│   │   │       │   └── MatchForm.tsx         # Form: teams, scores, date, VOD link
│   │   │       ├── News/
│   │   │       │   ├── NewsManager.tsx       # List of posts with edit/delete
│   │   │       │   └── NewsForm.tsx          # Create/edit announcement
│   │   │       ├── Vods/
│   │   │       │   └── VodsManager.tsx       # Add/edit/delete VOD entries
│   │   │       ├── Players/
│   │   │       │   ├── PlayersManager.tsx    # Player profiles list
│   │   │       │   └── PlayerForm.tsx        # Edit player: IGN, role, op.gg, socials
│   │   │       └── Settings/
│   │   │           └── SiteSettings.tsx      # Twitch channel, socials, org bio
│   │   ├── hooks/
│   │   │   ├── useAuth.ts                  # Auth state, login, logout, Discord OAuth
│   │   │   ├── useStandings.ts             # Fetch standings by league
│   │   │   ├── useScores.ts                # Fetch match results + upcoming
│   │   │   ├── useNews.ts                  # Fetch announcements
│   │   │   ├── useVods.ts                  # Fetch VOD list
│   │   │   └── useApplications.ts          # Admin: fetch + manage applications
│   │   ├── types/
│   │   │   ├── league.ts                   # League, Team, Standing, Match, Player
│   │   │   ├── application.ts              # TeamApplication, PlayerEntry, AppStatus
│   │   │   ├── news.ts                     # NewsPost, Announcement
│   │   │   ├── vod.ts                      # Vod, VodPlatform
│   │   │   └── auth.ts                     # StaffUser, AuthState, Role
│   │   ├── utils/
│   │   │   ├── opgg.ts                     # Validate + format op.gg URLs
│   │   │   └── sheets.ts                   # Parse Google Sheets CSV export
│   │   ├── constants/
│   │   │   └── brand.ts                    # Ember colors, league config, socials
│   │   ├── context/
│   │   │   └── AuthContext.tsx             # Staff auth state provider
│   │   ├── pages/                          # Route entry points (thin wrappers)
│   │   │   ├── index.tsx                   # /
│   │   │   ├── standings.tsx               # /standings
│   │   │   ├── scores.tsx                  # /scores
│   │   │   ├── vods.tsx                    # /vods
│   │   │   ├── apply.tsx                   # /apply
│   │   │   ├── about.tsx                   # /about
│   │   │   └── admin/
│   │   │       └── [...].tsx               # /admin/* all handled by AdminLayout
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   ├── assets/
│   │   │   └── ember-logo.png              # Drop logo here
│   │   └── fonts/                          # Bebas Neue, Space Mono, Inter
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py                       # pydantic-settings, reads .env
│   │   ├── routers/
│   │   │   ├── auth.py                     # POST /auth/login, /auth/discord, /auth/logout
│   │   │   ├── standings.py                # GET /standings?league=, PUT (admin)
│   │   │   ├── scores.py                   # GET /matches?league=, POST/PUT/DELETE (admin)
│   │   │   ├── news.py                     # GET /news, POST/PUT/DELETE (admin)
│   │   │   ├── vods.py                     # GET /vods?league=, POST/PUT/DELETE (admin)
│   │   │   ├── applications.py             # POST /apply, GET/PATCH (admin)
│   │   │   ├── players.py                  # GET /players?league=, POST/PUT/DELETE (admin)
│   │   │   ├── settings.py                 # GET /settings (public), PUT (admin)
│   │   │   ├── upload.py                   # POST /upload/logo (team logo uploads)
│   │   │   └── sheets.py                   # POST /admin/sheets/import
│   │   ├── models/
│   │   │   ├── league.py                   # Team, Standing, Match, Player (Pydantic)
│   │   │   ├── application.py              # TeamApplication, PlayerEntry
│   │   │   ├── news.py                     # NewsPost
│   │   │   ├── vod.py                      # Vod
│   │   │   └── auth.py                     # StaffUser, TokenData
│   │   ├── db/
│   │   │   ├── database.py                 # SQLAlchemy async engine
│   │   │   ├── models.py                   # ORM tables (see schema below)
│   │   │   └── repos/
│   │   │       ├── standings_repo.py
│   │   │       ├── scores_repo.py
│   │   │       ├── news_repo.py
│   │   │       ├── vods_repo.py
│   │   │       ├── applications_repo.py
│   │   │       ├── players_repo.py
│   │   │       └── settings_repo.py
│   │   ├── security/
│   │   │   ├── auth.py                     # JWT creation/verification, bcrypt passwords
│   │   │   ├── discord_oauth.py            # Discord OAuth2 flow
│   │   │   └── rate_limit.py               # slowapi limiters
│   │   └── storage/
│   │       └── uploads.py                  # Logo upload handler, file validation
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── alembic.ini
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_applications.py
│   │   ├── test_standings.py
│   │   └── test_sheets_import.py
│   ├── .env.example
│   ├── requirements.txt
│   └── pyproject.toml
│
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/
│   │   └── ember-site.conf
│   └── scripts/
│       ├── deploy.sh
│       ├── backup_db.sh
│       └── init_db_user.sql
│
├── SECURITY.md
└── README.md
```

---

## Database Schema

```python
# Staff users — admins and moderators
class StaffUser(Base):
    __tablename__ = "staff_users"
    id: str                         # nanoid PK
    email: str                      # unique, max 254 chars
    password_hash: str | None       # bcrypt — null if Discord-only login
    discord_id: str | None          # unique — null if email-only login
    discord_username: str | None
    display_name: str               # shown in admin UI
    role: str                       # "admin" | "moderator"
    is_active: bool                 # can be deactivated without deletion
    created_at: datetime
    last_login: datetime | None

    __table_args__ = (
        CheckConstraint("role IN ('admin','moderator')", name="ck_staff_role"),
    )

# Teams — approved teams in a league
class Team(Base):
    __tablename__ = "teams"
    id: str
    league_id: str                  # "cinder"|"blaze"|"scorch"|"magma"
    name: str                       # max 100 chars
    logo_url: str | None            # uploaded logo path
    bio: str | None                 # max 500 chars
    is_active: bool
    created_at: datetime

    __table_args__ = (
        CheckConstraint(
            "league_id IN ('cinder','blaze','scorch','magma')",
            name="ck_team_league"
        ),
    )

# Players — linked to a team
class Player(Base):
    __tablename__ = "players"
    id: str
    team_id: str                    # FK -> teams.id
    summoner_name: str              # max 50 chars
    opgg_url: str                   # validated https://op.gg URL
    role: str                       # "top"|"jungle"|"mid"|"bot"|"support"
    is_captain: bool
    discord_handle: str | None
    created_at: datetime

    __table_args__ = (
        CheckConstraint(
            "role IN ('top','jungle','mid','bot','support')",
            name="ck_player_role"
        ),
    )

# Standings — one row per team per season
class Standing(Base):
    __tablename__ = "standings"
    id: str
    team_id: str                    # FK -> teams.id
    league_id: str                  # "cinder"|"blaze"|"scorch"|"magma"
    season: str                     # e.g. "S1", "S2" — max 10 chars
    wins: int
    losses: int
    point_diff: int                 # total game score differential
    streak: int                     # positive = win streak, negative = loss streak
    updated_at: datetime

# Matches — scores and results
class Match(Base):
    __tablename__ = "matches"
    id: str
    league_id: str
    season: str
    blue_team_id: str               # FK -> teams.id
    red_team_id: str                # FK -> teams.id
    blue_score: int | None          # null = match not yet played
    red_score: int | None
    winner_id: str | None           # FK -> teams.id
    scheduled_at: datetime
    played_at: datetime | None
    vod_url: str | None             # YouTube or Twitch URL
    status: str                     # "scheduled"|"completed"|"cancelled"
    imported_from_sheets: bool      # track which rows came from import

    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled','completed','cancelled')",
            name="ck_match_status"
        ),
        CheckConstraint(
            "league_id IN ('cinder','blaze','scorch','magma')",
            name="ck_match_league"
        ),
    )

# TeamApplications — submitted by teams, reviewed by staff
class TeamApplication(Base):
    __tablename__ = "team_applications"
    id: str
    league_id: str                  # which league they're applying to
    team_name: str                  # max 100 chars
    logo_url: str | None            # uploaded during application
    bio: str                        # max 500 chars, required
    contact_name: str               # max 100 chars
    contact_email: str              # max 254 chars
    contact_discord: str            # max 100 chars
    status: str                     # "pending"|"approved"|"denied"
    reviewed_by: str | None         # FK -> staff_users.id
    review_note: str | None         # internal staff note, max 500 chars
    submitted_at: datetime
    reviewed_at: datetime | None

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','approved','denied')",
            name="ck_app_status"
        ),
        CheckConstraint(
            "league_id IN ('cinder','blaze','scorch','magma')",
            name="ck_app_league"
        ),
    )

# ApplicationPlayers — players submitted with an application (min 5)
class ApplicationPlayer(Base):
    __tablename__ = "application_players"
    id: str
    application_id: str             # FK -> team_applications.id ON DELETE CASCADE
    summoner_name: str              # max 50 chars
    opgg_url: str                   # validated https://op.gg URL
    role: str                       # "top"|"jungle"|"mid"|"bot"|"support"
    is_captain: bool

    __table_args__ = (
        CheckConstraint(
            "role IN ('top','jungle','mid','bot','support')",
            name="ck_appplayer_role"
        ),
    )

# NewsPosts — announcements and updates
class NewsPost(Base):
    __tablename__ = "news_posts"
    id: str
    title: str                      # max 200 chars
    slug: str                       # unique URL slug, max 200 chars
    body: str                       # markdown content
    league_id: str | None           # null = org-wide post
    author_id: str                  # FK -> staff_users.id
    is_published: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

# Vods — YouTube and Twitch clip library
class Vod(Base):
    __tablename__ = "vods"
    id: str
    title: str                      # max 200 chars
    league_id: str | None           # null = org-wide
    url: str                        # YouTube or Twitch URL
    platform: str                   # "youtube"|"twitch"
    thumbnail_url: str | None
    match_id: str | None            # FK -> matches.id (optional link)
    created_at: datetime

    __table_args__ = (
        CheckConstraint(
            "platform IN ('youtube','twitch')",
            name="ck_vod_platform"
        ),
    )

# SiteSettings — key/value store for org-level config
class SiteSetting(Base):
    __tablename__ = "site_settings"
    key: str                        # PK: "twitch_channel", "twitter", "discord_invite", etc.
    value: str | None
    updated_at: datetime
    updated_by: str | None          # FK -> staff_users.id
```

---

## Phase 1 — Auth System

### JWT + bcrypt (`app/security/auth.py`)

```python
# Password hashing
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())

# JWT tokens — short-lived access tokens
def create_access_token(staff_id: str, role: str) -> str:
    payload = {
        "sub": staff_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=8),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def verify_access_token(token: str) -> TokenData:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    return TokenData(staff_id=payload["sub"], role=payload["role"])

# FastAPI dependency — use on every protected route
async def get_current_staff(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> StaffUser: ...

# Admin-only dependency
async def require_admin(staff = Depends(get_current_staff)) -> StaffUser:
    if staff.role != "admin":
        raise HTTPException(403, "Admin access required")
    return staff
```

### Discord OAuth flow (`app/security/discord_oauth.py`)

```python
# Step 1: Frontend redirects to Discord
# GET /auth/discord/redirect
# → redirect to: https://discord.com/api/oauth2/authorize
#   ?client_id={DISCORD_CLIENT_ID}
#   &redirect_uri={DISCORD_REDIRECT_URI}
#   &response_type=code
#   &scope=identify%20email

# Step 2: Discord redirects back with code
# GET /auth/discord/callback?code={code}
# → exchange code for access token with Discord API
# → fetch user from Discord: GET https://discord.com/api/users/@me
# → look up StaffUser by discord_id
# → if found + is_active: issue JWT
# → if not found: return 403 "Not authorized — contact an admin"

# Only pre-existing staff accounts can log in via Discord
# Admins add staff manually — no self-registration
```

### Auth endpoints (`app/routers/auth.py`)

```
POST /auth/login
  body: { email, password }
  returns: { access_token, token_type: "bearer", staff: { id, display_name, role } }
  rate limit: 10/minute per IP

GET  /auth/discord/redirect
  returns: { url: "https://discord.com/oauth2/authorize?..." }

GET  /auth/discord/callback?code=
  returns: { access_token, token_type: "bearer", staff: { ... } }

POST /auth/logout
  auth: Bearer token
  invalidates token (add to deny list in Redis or just use short expiry)

GET  /auth/me
  auth: Bearer token
  returns: current staff user info
```

---

## Phase 2 — Team Applications

### Application form fields (`ApplicationForm.tsx`)

```
League selector (required)
  → Cinder / Blaze / Scorch / Magma (radio cards with league colors)

Team Info:
  Team Name (text, max 100)
  Team Logo (image upload — PNG/JPG, max 2MB)
  Team Bio (textarea, max 500 chars with counter)

Contact Info:
  Contact Name (text, max 100)
  Contact Email (email input)
  Contact Discord (text, max 100, format: username or user#1234)

Roster (minimum 5 players, maximum 7):
  For each player:
    Summoner Name (text, max 50)
    op.gg URL (url input — validated format)
    Role (Top / Jungle / Mid / Bot / Support — select)
    Captain toggle (only one per team)
  [+ Add Player] button up to 7 total
  [- Remove] on any row beyond the 5th

Submit button — disabled until all required fields valid
```

### op.gg URL validation (`src/utils/opgg.ts`)

```typescript
// Valid formats:
// https://www.op.gg/summoners/na/SummonerName
// https://op.gg/summoners/na/SummonerName
// https://www.op.gg/summoners/euw/SummonerName (any region)

export function validateOpggUrl(url: string): boolean {
  return /^https:\/\/(www\.)?op\.gg\/summoners\/[a-z0-9_]+\/.+$/i.test(url);
}
```

### Logo upload (`app/storage/uploads.py`)

```python
ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

async def save_logo(file: UploadFile) -> str:
    """
    Validate type + size.
    Save to /uploads/logos/{nanoid}.{ext}
    Return public URL path.
    Never execute uploaded files — store as static assets only.
    """
```

### Admin application review (`ApplicationDetail.tsx`)

Shows full submitted info:
- Team name, logo, bio
- Contact info
- Full roster table: summoner name, op.gg link (clickable), role, captain flag
- Status badge (pending / approved / denied)
- Internal review note (textarea — only visible to staff)
- **Approve** button (green) — creates Team + Player rows, sets status="approved"
- **Deny** button (red) — sets status="denied", optionally sends denial note

---

## Phase 3 — Standings & Scores

### Standings page

- League filter tabs at top: Cinder | Blaze | Scorch | Magma
- Default: Cinder (top tier)
- Table columns: Rank, Team (logo + name), W, L, W%, Point Diff, Streak
- Streak shown as colored pill: `W3` (green) or `L2` (red)
- Clicking a team row expands their recent match results

### Scores page

- League filter tabs (same as standings)
- Two sections: **Upcoming** and **Results**
- Match card: Team A logo + name vs Team B logo + name, date/time, score or "TBD"
- Completed matches show score + winner highlight + VOD link if available
- Clicking a match opens `MatchDetail` modal with game-by-game breakdown

### Admin standings manager

Manual entry:
```
League selector → team list for that league
For each team: editable W / L / Point Diff fields
[Save Changes] button
```

Google Sheets import (`SheetsImport.tsx`):
```
1. Admin pastes Google Sheets URL or CSV export URL
2. Frontend sends to POST /admin/sheets/import
3. Backend fetches sheet as CSV (sheets must be published to web)
4. Parses rows: Team Name | W | L | Point Diff columns
5. Matches team names to existing teams in DB (fuzzy match + manual confirm)
6. Preview table shown: "These rows will be updated — confirm?"
7. Admin confirms → standings updated
8. Rows that don't match any team shown as warnings
```

Sheet parsing (`app/routers/sheets.py`):
```python
async def import_from_sheets(url: str, league_id: str, db):
    """
    Accepts:
    - Google Sheets published CSV URL:
      https://docs.google.com/spreadsheets/d/{id}/export?format=csv
    - Or direct CSV URL
    Fetches, parses, validates, returns preview.
    Never auto-applies — always requires admin confirmation step.
    """
```

---

## Phase 4 — News & Announcements

### News post fields
- Title (max 200)
- Body (Markdown — render with `react-markdown` on frontend)
- League tag (optional — tag to a specific league or leave as org-wide)
- Published toggle (draft vs live)
- Published date (auto-set on first publish, editable)

### Public news display
- Home page: 3 most recent published posts in a grid
- Each card: title, league badge (if tagged), date, excerpt (first 150 chars of body)
- Clicking opens full post page at `/news/{slug}`

---

## Phase 5 — VODs

### VOD entry fields (admin)
- Title (max 200)
- URL (YouTube or Twitch — auto-detect platform from URL)
- League tag (optional)
- Link to match (optional dropdown of matches)
- Thumbnail URL (auto-fetched from YouTube oEmbed if YouTube URL)

### Public VODs page
- Grid layout: thumbnail, title, league badge, date
- League filter tabs
- Clicking opens `VodModal` with embedded player (YouTube iframe or Twitch clip embed)

---

## Phase 6 — Site Settings (Admin)

Managed via `/admin/settings` → stored in `site_settings` table as key/value:

| Key | Description |
|-----|-------------|
| `twitch_channel` | Twitch username for live embed on home page |
| `twitter_url` | Full Twitter/X profile URL |
| `discord_invite` | Discord server invite link |
| `youtube_channel` | YouTube channel URL |
| `instagram_url` | Instagram profile URL |
| `org_bio` | About page description (markdown) |
| `current_season` | e.g. "S1" — used as default season filter |
| `applications_open` | "true"/"false" — show/hide apply CTA |

The `TwitchEmbed.tsx` component checks `twitch_channel` setting:
- If set and channel is live: shows embedded player
- If set but offline: shows offline card with last stream thumbnail
- If not set: shows placeholder "Stream coming soon"

---

## Phase 7 — Visual Design

### Page designs

**Home page:**
```
[NAVBAR — logo left, links right, LIVE badge if Twitch live]

[HERO — full bleed, ember logo large center]
  EMBER ESPORTS          ← Bebas Neue, massive
  FORGE YOUR LEGACY      ← Bebas Neue, subtitle
  [APPLY NOW] [STANDINGS]  ← CTA buttons

[TWITCH EMBED — live player or offline card]

[NEWS GRID — 3 cards, latest announcements]

[LEAGUE CARDS — 4 cards: Cinder/Blaze/Scorch/Magma]
  Each card: league name in Bebas Neue, league color accent,
  current season record, link to standings

[FOOTER — socials row, league links, copyright]
```

**Standings page:**
```
[LEAGUE TABS — Cinder | Blaze | Scorch | Magma]
  Active tab: league color underline + glow

[STANDINGS TABLE]
  #  Team               W   L   W%    +/-   Streak
  1  [logo] Team Name   8   2   80%   +23   W3
  ...
  Row hover: surface highlight
  1st place row: gold left border accent
```

**Scores page:**
```
[LEAGUE TABS]

[UPCOMING section]
  Match cards in a row: date/time, Team A vs Team B

[RESULTS section]
  Match cards: Team A [score] - [score] Team B
  Winner side: brighter, loser: dimmed
  VOD link icon if available
```

**Apply page:**
```
[LEAGUE SELECTOR — 4 large cards]
  Click to select league → form slides in below

[APPLICATION FORM]
  Clean two-column layout on desktop, single column mobile
  Red asterisks on required fields
  Player rows: add/remove dynamically
  Live validation on op.gg URLs
  Submit: disabled until valid, shows loading state
```

**Admin panel:**
```
[SIDEBAR — always visible on desktop]
  Ember logo top
  Nav links: Dashboard, Applications, Standings, Scores, News, VODs, Players, Settings
  Staff name + role badge at bottom
  Logout button

[CONTENT AREA — right of sidebar]
  Page-specific content
  Data tables with sort + filter
  Inline edit forms
```

### Tailwind config
```typescript
// tailwind.config.ts
import { BRAND } from './src/constants/brand';

export default {
  theme: {
    extend: {
      colors: {
        crimson:    BRAND.colors.crimson,
        flame:      BRAND.colors.flame,
        gold:       BRAND.colors.gold,
        'ember-yellow': BRAND.colors.yellow,
        steel:      BRAND.colors.steel,
        'site-bg':  BRAND.colors.bg,
        surface:    BRAND.colors.surface,
        'surface-alt': BRAND.colors.surfaceAlt,
        border:     BRAND.colors.border,
        muted:      BRAND.colors.muted,
        cinder:     '#FFD700',
        blaze:      '#F5A800',
        scorch:     '#E63000',
        magma:      '#CC1A1A',
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

---

## Phase 8 — Hosting & Infrastructure

### Docker Compose (`infra/docker-compose.yml`)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ember_site
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_SUPERUSER_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/scripts/init_db_user.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      MIGRATION_DATABASE_URL: ${MIGRATION_DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET}
      DISCORD_REDIRECT_URI: ${DISCORD_REDIRECT_URI}
      UPLOAD_DIR: /uploads
    volumes:
      - uploads_data:/uploads                # persisted logo uploads
    depends_on: [postgres]
    restart: unless-stopped
    command: >
      sh -c "alembic -x url=$MIGRATION_DATABASE_URL upgrade head &&
             uvicorn app.main:app --host 0.0.0.0 --port 8000"

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE: https://emberesports.com
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./infra/nginx/ember-site.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - uploads_data:/uploads:ro             # serve uploaded logos as static files
    depends_on: [backend, frontend]
    restart: unless-stopped

volumes:
  postgres_data:
  uploads_data:                              # shared between backend + nginx
```

### Nginx config (`infra/nginx/ember-site.conf`)

```nginx
server {
    listen 443 ssl;
    server_name emberesports.com www.emberesports.com;

    ssl_certificate     /etc/letsencrypt/live/emberesports.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/emberesports.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header X-XSS-Protection          "1; mode=block" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

    # Uploaded team logos — served as static files by Nginx directly
    location /uploads/ {
        alias /uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # REST API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host            $host;
        proxy_set_header X-Real-IP       $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Limit upload size
        client_max_body_size 3M;
    }

    # Frontend SPA — all other routes
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name emberesports.com www.emberesports.com;
    return 301 https://emberesports.com$request_uri;
}
```

### Environment variables (`.env.example`)

```
# Database
DATABASE_URL=postgresql+asyncpg://ember_app:APP_PASSWORD@postgres:5432/ember_site
MIGRATION_DATABASE_URL=postgresql+asyncpg://ember_migrate:MIGRATE_PASSWORD@postgres:5432/ember_site
POSTGRES_SUPERUSER_PASSWORD=SUPERUSER_PASSWORD
APP_DB_PASSWORD=APP_PASSWORD
MIGRATE_DB_PASSWORD=MIGRATE_PASSWORD

# App
SECRET_KEY=                       # python3 -c "import secrets; print(secrets.token_hex(32))"
CORS_ORIGINS=["https://emberesports.com","https://www.emberesports.com"]

# Discord OAuth
DISCORD_CLIENT_ID=                # from Discord Developer Portal
DISCORD_CLIENT_SECRET=            # from Discord Developer Portal
DISCORD_REDIRECT_URI=https://emberesports.com/auth/discord/callback
```

---

## Implementation Order for Claude Code

Run as separate tasks in order:

1. `scaffold` — Full directory structure, all empty files, package.json, requirements.txt, .env.example, brand.ts with Ember colors + league config
2. `db-schema` — All ORM models with CHECK constraints, init_db_user.sql, Alembic init + first migration
3. `auth-backend` — JWT/bcrypt auth, Discord OAuth flow, /auth routes, staff middleware
4. `auth-frontend` — LoginPage.tsx, useAuth.ts, AuthContext.tsx, AdminLayout.tsx protected routes
5. `settings` — SiteSettings ORM, settings_repo, GET/PUT /settings, SiteSettings admin page
6. `applications-backend` — TeamApplication + ApplicationPlayer models, upload handler, /apply + admin routes
7. `applications-frontend` — ApplyPage, LeagueSelector, ApplicationForm, PlayerRow, LogoUpload, op.gg validation
8. `applications-admin` — ApplicationsList.tsx, ApplicationDetail.tsx (approve/deny flow)
9. `teams-players` — Team + Player ORM, repos, /players routes, PlayersManager + PlayerForm admin pages
10. `standings-backend` — Standing ORM, standings_repo, GET /standings, PUT (admin), Sheets import endpoint
11. `standings-frontend` — StandingsPage, LeagueFilter tabs, StandingsTable, TeamRow
12. `standings-admin` — StandingsManager, SheetsImport component + flow
13. `scores-backend` — Match ORM, scores_repo, GET /matches, POST/PUT/DELETE (admin)
14. `scores-frontend` — ScoresPage, MatchCard, MatchDetail modal
15. `scores-admin` — ScoresManager, MatchForm
16. `news-backend` — NewsPost ORM, news_repo, GET /news + /news/{slug}, POST/PUT/DELETE (admin)
17. `news-frontend` — NewsGrid on home, full post page at /news/{slug}, NewsManager + NewsForm admin
18. `vods-backend` — Vod ORM, vods_repo, GET /vods, POST/PUT/DELETE (admin)
19. `vods-frontend` — VodsPage, VodCard, VodModal (YouTube/Twitch embed), VodsManager admin
20. `home-page` — HeroSection, TwitchEmbed, LeagueCards, full HomePage assembly
21. `navbar-footer` — Navbar with live Twitch badge, Footer with socials
22. `about-page` — AboutPage with org bio from settings + staff list
23. `visual-polish` — Fonts, league color system, table row hovers, match card winner highlight, streak pills, responsive layout
24. `admin-dashboard` — Dashboard.tsx: pending apps count, recent activity feed, quick links
25. `infra` — docker-compose.yml, Nginx config, deploy.sh, backup_db.sh

---

## Key Notes for Claude Code

- **Logo file:** Place `ember-new-logo.png` at `frontend/public/assets/ember-logo.png` before running the frontend
- **League IDs** are always lowercase strings: `"cinder"`, `"blaze"`, `"scorch"`, `"magma"` — enforced by CHECK constraints and Literal types
- **No self-registration for staff** — admins create staff accounts manually. Discord OAuth only works for pre-existing staff rows with a matching `discord_id`
- **Logo uploads** stored in a named Docker volume (`uploads_data`) shared between backend and Nginx. Backend writes, Nginx serves as static files at `/uploads/`
- **Google Sheets import** always requires a confirmation step — never auto-applies. Sheet must be published to web as CSV
- **op.gg URL validation** on both frontend (live) and backend (on submit) — never trust client validation alone
- **Markdown** for news post bodies — use `react-markdown` on frontend, store raw markdown in DB
- **JWT expiry:** 8 hours — staff stays logged in for a working day, must re-authenticate next session
- **Two DB users** — `ember_app` (DML only) for runtime, `ember_migrate` (DDL) for Alembic. App cannot drop tables
- **`applications_open` setting** controls whether the Apply page shows the form or a "Applications closed" message — check this setting on the ApplyPage before rendering the form
- **Streak calculation:** positive int = win streak, negative = loss streak. e.g. `3` = W3, `-2` = L2. Recalculate when scores are updated

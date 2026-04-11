# Ember Esports Draft Tool — Security Checklist & Procedures

---

## Token Security

- [ ] Tokens generated with `secrets.token_urlsafe(32)` — 256 bits of entropy
- [ ] Raw tokens returned **once only** in `POST /series/new` response — never again
- [ ] Tokens stored as bcrypt hashes (`rounds=12`) in DB — never plaintext
- [ ] `GET /series/{id}` requires a valid token query param — no public read access
- [ ] WS connections verify token hash before assigning role (blue/red/spectator)
- [ ] Invalid tokens close WS with code 4001 — no role hint given in error
- [ ] REPORT_WINNER and START_NEXT_GAME reject spectator tokens server-side

---

## Database Security

- [ ] PostgreSQL not exposed externally — internal Docker network only
- [ ] No `-p 5432:5432` in docker-compose.yml (internal only)
- [ ] Two DB users created via `init_db_user.sql`:
  - `drafter_app` — SELECT, INSERT, UPDATE, DELETE only. No DROP, CREATE, ALTER.
  - `drafter_migrate` — DDL privileges for Alembic migrations only
- [ ] FastAPI uses `drafter_app` at runtime via `DATABASE_URL`
- [ ] Alembic uses `drafter_migrate` via `MIGRATION_DATABASE_URL`
- [ ] CHECK constraints enforced at DB level (not just application):
  - `format IN ('bo1','bo3','bo5')`
  - `status IN ('pending','in_progress','complete')`
  - `game1_first_pick IN ('blue','red')`
  - `winner IS NULL OR winner IN ('blue','red')`
  - `timer_seconds BETWEEN 10 AND 120`
  - `NOT (format = 'bo1' AND fearless = true)`
- [ ] All JSONB fields (`draft_state_json`, `fearless_pool_json`) validated through Pydantic before write
- [ ] Connection pool configured: `pool_size=10, max_overflow=20, pool_timeout=30, pool_recycle=1800`
- [ ] Nightly backups via `backup_db.sh` — 14-day retention in `/backups/`
- [ ] Backups stored on host filesystem, outside Docker volume

---

## Input Validation

- [ ] All Pydantic models enforce `max_length` on every free-text field:
  - `series.name` max 200 chars
  - `blue_team_name` / `red_team_name` max 100 chars
  - `patch` max 20 chars
- [ ] `timer_seconds` validated `ge=10, le=120` in Pydantic and DB CHECK
- [ ] `champion_id` in LOCK_IN validated against known DataDragon champion list before processing
- [ ] `fearless=True` + `format="bo1"` rejected at Pydantic `model_validator` layer
- [ ] `format`, `game1_first_pick`, `winner` are `Literal` types — no free strings accepted

---

## Rate Limiting

- [ ] `slowapi` installed with `get_remote_address` key function
- [ ] `POST /series/new` — 20 requests/hour per IP
- [ ] `GET /series/{id}` — 120 requests/minute per IP
- [ ] `GET /champions` — 60 requests/minute per IP
- [ ] 429 responses include `Retry-After` header

---

## WebSocket Security

- [ ] Token verified on every new WS connection before any state is sent
- [ ] LOCK_IN action verifies `acting_side == role_from_token` — can't spoof turns
- [ ] REPORT_WINNER only accepted from blue or red token — spectator rejected
- [ ] START_NEXT_GAME only accepted from blue or red token
- [ ] WS connections cleaned up from ConnectionManager on disconnect
- [ ] Timer tasks cancelled cleanly on game COMPLETE and server shutdown

---

## HTTP Security Headers (Nginx)

- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains` — HTTPS enforced
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: SAMEORIGIN` — no external iframing (single domain tool)
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] TLS 1.2 minimum — TLS 1.0/1.1 disabled
- [ ] HTTP → HTTPS redirect on port 80

---

## Secrets & Environment

- [ ] `.env` in `.gitignore` from day one — never committed to repo
- [ ] `.env.example` committed with placeholder values only — no real secrets
- [ ] `SECRET_KEY` is 256-bit random: `python3 -c "import secrets; print(secrets.token_hex(32))"`
- [ ] Separate passwords for `drafter_app` and `drafter_migrate` DB users
- [ ] No secrets in Docker image layers — all via environment variables at runtime
- [ ] Backend and frontend containers not exposed externally — Nginx only

---

## Infrastructure

- [ ] Only ports 80 and 443 exposed on host via Nginx
- [ ] SSH key-only auth on VPS — password auth disabled (`PasswordAuthentication no` in sshd_config)
- [ ] Unattended security upgrades enabled: `apt install unattended-upgrades`
- [ ] Let's Encrypt cert auto-renewal via certbot cron
- [ ] `deploy.sh` always runs migrations before restarting — never skips
- [ ] `/backups/` directory outside Docker volume — survives `docker compose down -v`
- [ ] Firewall: `ufw allow OpenSSH`, `ufw allow 80`, `ufw allow 443`, `ufw enable`

---

## Secret Rotation Procedures

### Rotate SECRET_KEY
1. Generate: `python3 -c "import secrets; print(secrets.token_hex(32))"`
2. Update `SECRET_KEY` in `.env` on server
3. `docker compose restart backend`
4. **Effect:** No session tokens use SECRET_KEY directly in this app (tokens are bcrypt hashed). Safe to rotate at any time without invalidating existing draft links.

### Rotate DB passwords
1. `docker compose exec postgres psql -U postgres`
2. `ALTER USER drafter_app WITH PASSWORD 'new_strong_password';`
3. `ALTER USER drafter_migrate WITH PASSWORD 'new_strong_password';`
4. Update `APP_DB_PASSWORD` and `MIGRATE_DB_PASSWORD` in `.env`
5. `docker compose restart backend`

### Rotate SSL certificate (manual if auto-renewal fails)
```bash
sudo certbot renew --force-renewal -d drafter.emberesports.com
docker compose restart nginx
```

---

## What We Deliberately Don't Do

- **No card storage** — no payment processing in this tool at all
- **No user accounts** — no passwords to store or manage, no auth flows beyond draft tokens
- **No raw token storage** — bcrypt hashed at rest, shown raw exactly once at series creation
- **No superuser DB connection from app** — `drafter_app` can't drop tables even if the app is compromised
- **No secrets in source code** — all via environment variables, never hardcoded
- **No public read access to draft state** — every read endpoint requires a valid token

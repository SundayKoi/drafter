# Ember Esports Site — Security Checklist & Procedures

---

## Authentication Security

- [ ] Staff passwords hashed with bcrypt `rounds=12` — never stored plaintext
- [ ] JWT access tokens expire after 8 hours — short enough to limit exposure
- [ ] `SECRET_KEY` is 256-bit random — used to sign JWTs
- [ ] Discord OAuth only works for pre-existing staff accounts — no self-registration
- [ ] Discord callback validates `state` parameter to prevent CSRF on OAuth flow
- [ ] Failed login attempts rate limited: 10/minute per IP
- [ ] `is_active` flag on staff accounts — deactivate without deleting history
- [ ] `/auth/me` endpoint verifies token on every admin page load
- [ ] Admin-only routes use `require_admin` dependency — moderators cannot access them

---

## File Upload Security

- [ ] Uploaded files validated by MIME type — only PNG, JPEG, WebP accepted
- [ ] Max file size enforced: 2MB in application + 3MB in Nginx (`client_max_body_size`)
- [ ] Files saved with nanoid filename — original filename never used (path traversal prevention)
- [ ] Uploaded files stored in `/uploads/` volume — never in the app directory
- [ ] Nginx serves `/uploads/` as static files — backend never executes them
- [ ] File extension validated against MIME type — no `.php` or `.js` disguised as images
- [ ] Upload directory not web-executable — `noexec` mount option if possible

---

## Database Security

- [ ] PostgreSQL not exposed externally — internal Docker network only
- [ ] Two DB users via `init_db_user.sql`:
  - `ember_app` — SELECT, INSERT, UPDATE, DELETE only
  - `ember_migrate` — DDL for Alembic only
- [ ] CHECK constraints on all enum columns (league_id, status, role, platform)
- [ ] All JSONB-equivalent fields validated through Pydantic before write
- [ ] Connection pool: `pool_size=10, max_overflow=20, pool_timeout=30, pool_recycle=1800`
- [ ] Nightly backups — 14-day retention

---

## Input Validation

- [ ] All Pydantic models enforce `max_length` on every string field
- [ ] op.gg URLs validated by regex on frontend AND backend — never trust client only
- [ ] Team application requires minimum 5 players — enforced server-side (count ApplicationPlayer rows)
- [ ] News post slugs auto-generated from title + sanitized (alphanumeric + hyphens only)
- [ ] Markdown bodies sanitized before render — use `rehype-sanitize` with `react-markdown`
- [ ] Google Sheets import always requires admin confirmation — never auto-applies
- [ ] Sheets URL validated as Google Sheets or CSV URL before fetching

---

## Rate Limiting

- [ ] `POST /auth/login` — 10/minute per IP
- [ ] `POST /apply` — 5/hour per IP (prevent application spam)
- [ ] `POST /upload/logo` — 10/hour per IP
- [ ] `POST /admin/sheets/import` — 20/hour per IP
- [ ] Public GET endpoints — 120/minute per IP

---

## HTTP Security Headers (Nginx)

- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] TLS 1.2 minimum enforced
- [ ] HTTP → HTTPS redirect on port 80

---

## Secrets & Environment

- [ ] `.env` in `.gitignore` from day one
- [ ] `.env.example` has placeholder values only — no real secrets
- [ ] `SECRET_KEY` is 256-bit random
- [ ] `DISCORD_CLIENT_SECRET` never exposed to frontend
- [ ] Discord OAuth `redirect_uri` whitelisted in Discord Developer Portal
- [ ] No secrets in Docker image layers — all via environment variables

---

## Infrastructure

- [ ] Only ports 80 and 443 exposed on host
- [ ] SSH key-only auth on VPS — password auth disabled
- [ ] Unattended security upgrades enabled
- [ ] Let's Encrypt auto-renewal via certbot cron
- [ ] `uploads_data` Docker volume persists across deployments — never wiped on `docker compose down`
- [ ] `/backups/` on host filesystem outside Docker volume

---

## Secret Rotation Procedures

### Rotate SECRET_KEY
1. `python3 -c "import secrets; print(secrets.token_hex(32))"`
2. Update in `.env`
3. `docker compose restart backend`
4. **Effect:** All active JWT sessions invalidated — staff must log in again

### Rotate Discord OAuth secret
1. Go to Discord Developer Portal → your app → OAuth2 → reset secret
2. Update `DISCORD_CLIENT_SECRET` in `.env`
3. `docker compose restart backend`

### Rotate DB passwords
1. `docker compose exec postgres psql -U postgres`
2. `ALTER USER ember_app WITH PASSWORD 'new_password';`
3. `ALTER USER ember_migrate WITH PASSWORD 'new_password';`
4. Update `.env`, restart backend

### Deactivate a staff member
1. Admin panel → Settings → Staff
2. Toggle `is_active` to false
3. Their JWT will still work until it expires (8 hours max)
4. For immediate lockout: rotate `SECRET_KEY` (invalidates all sessions)

---

## What We Deliberately Don't Do

- **No card storage** — no payment processing on this site
- **No public user accounts** — only staff have accounts, no fan registration
- **No raw password logging** — passwords never appear in logs or error messages
- **No auto-applying imported data** — Google Sheets import always requires confirmation
- **No executing uploaded files** — logos served as static assets by Nginx only
- **No superuser DB connection from app** — `ember_app` cannot drop tables

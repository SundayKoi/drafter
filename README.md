# Ember Draft Tool

Real-time League of Legends draft simulator for Ember Esports. Supports Bo1/Bo3/Bo5 series, fearless draft mode, flexible first-pick side assignment, and real-time WebSocket sync.

## Local Development

```bash
# Start Postgres
docker compose -f infra/docker-compose.dev.yml up -d

# Backend
cd backend
cp .env.example .env    # edit with local values
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev             # :5173, proxies to :8000
```

## Production Deploy

```bash
# On VPS
cd /opt/ember-drafter
./infra/scripts/deploy.sh
```

## Stats Page

`stats/index.html` is the page served at `/stats/`. Nginx reads it from
`/opt/ember-stats/` on the VPS, so `deploy.sh` does not update it. To publish:

```bash
cd /opt/ember-drafter
git pull origin main
cp /opt/ember-stats/index.html /root/stats-backup.html
cp stats/index.html /opt/ember-stats/index.html
```

Undo with `cp /root/stats-backup.html /opt/ember-stats/index.html`.

Team logos on the Teams tab come from the Google Sheet's `Config` tab: add a
row with key `teamLogo_<Team Name>` and an `https://` image URL as the value.

## DB Backup

```bash
# Manual
./infra/scripts/backup_db.sh

# Cron (add via crontab -e)
0 3 * * * /opt/ember-drafter/infra/scripts/backup_db.sh >> /var/log/drafter-backup.log 2>&1
```

## Tests

```bash
cd backend
python -m pytest tests/ -v
```

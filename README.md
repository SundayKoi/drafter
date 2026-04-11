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

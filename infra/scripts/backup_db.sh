#!/bin/bash
set -e

BACKUP_DIR="/backups"
COMPOSE_FILE="/opt/ember-drafter/infra/docker-compose.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="ember_drafter_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup: $FILENAME"
docker compose -f "$COMPOSE_FILE" \
  exec -T postgres pg_dump -U drafter_app ember_drafter \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup complete: ${BACKUP_DIR}/${FILENAME}"
echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"

# Remove backups older than 14 days
DELETED=$(find "$BACKUP_DIR" -name "ember_drafter_*.sql.gz" -mtime +14 -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "Cleaned up $DELETED old backup(s)"
fi

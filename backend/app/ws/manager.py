import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # { series_id: { role: WebSocket } }
        self.rooms: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, series_id: str, role: str, ws: WebSocket) -> None:
        await ws.accept()
        if series_id not in self.rooms:
            self.rooms[series_id] = {}
        # Disconnect existing connection for this role if any
        existing = self.rooms[series_id].get(role)
        if existing:
            try:
                await existing.close(code=4002, reason="Replaced by new connection")
            except Exception:
                pass
        self.rooms[series_id][role] = ws
        logger.info("Connected: series=%s role=%s", series_id, role)

    async def disconnect(self, series_id: str, role: str) -> None:
        if series_id in self.rooms:
            self.rooms[series_id].pop(role, None)
            if not self.rooms[series_id]:
                del self.rooms[series_id]
        logger.info("Disconnected: series=%s role=%s", series_id, role)

    async def broadcast(self, series_id: str, message: dict) -> None:
        if series_id not in self.rooms:
            return
        data = json.dumps(message)
        disconnected = []
        for role, ws in self.rooms[series_id].items():
            try:
                await ws.send_text(data)
            except Exception:
                disconnected.append(role)
        for role in disconnected:
            await self.disconnect(series_id, role)

    async def send_to(self, series_id: str, role: str, message: dict) -> None:
        if series_id not in self.rooms:
            return
        ws = self.rooms[series_id].get(role)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                await self.disconnect(series_id, role)


manager = ConnectionManager()

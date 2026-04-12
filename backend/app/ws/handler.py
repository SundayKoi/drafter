import asyncio
import json
import logging
from typing import Literal

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.db.database import AsyncSessionLocal
from app.db.repos import series_repo
from app.logic.draft_engine import DraftValidationError, apply_action
from app.logic.draft_order import determine_first_pick
from app.logic.fearless import build_fearless_pool
from app.logic.timer import run_room_timer
from app.models.draft import DraftPhase, DraftState, SlotState
from app.models.messages import (
    error_message,
    game_complete_message,
    hover_update_message,
    next_game_starting_message,
    pong_message,
    series_complete_message,
    sync_message,
)
from app.security.tokens import verify_token
from app.store import rooms as store
from app.store.rooms import DraftRoom
from app.ws.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()

FORMAT_MAX_GAMES = {"bo1": 1, "bo3": 3, "bo5": 5}


async def resolve_role(
    series, presented_token: str,
) -> Literal["blue", "red", "spectator"] | None:
    if verify_token(presented_token, series.blue_token_hash):
        return "blue"
    if verify_token(presented_token, series.red_token_hash):
        return "red"
    if verify_token(presented_token, series.spectator_token_hash):
        return "spectator"
    return None


def build_series_state_dict(series, games, current_draft: DraftState | None, fearless_pool: list[str]) -> dict:
    max_games = FORMAT_MAX_GAMES[series.format]
    games_needed = (max_games // 2) + 1

    game_summaries = []
    for g in games:
        game_summaries.append({
            "game_number": g.game_number,
            "winner": g.winner,
            "first_pick_side": g.first_pick_side,
            "draft_state": g.draft_state_json,
        })

    current_game_number = max((g.game_number for g in games), default=1) if games else 1

    return {
        "series_id": series.id,
        "format": series.format,
        "fearless": series.fearless,
        "current_game_number": current_game_number,
        "max_games": max_games,
        "games_needed_to_win": games_needed,
        "blue_score": series.blue_score,
        "red_score": series.red_score,
        "blue_team_name": series.blue_team_name,
        "red_team_name": series.red_team_name,
        "status": series.status,
        "timer_seconds": series.timer_seconds,
        "games": game_summaries,
        "fearless_pool": fearless_pool,
        "current_draft": current_draft.model_dump() if current_draft else None,
    }


async def broadcast_sync(series_id: str, room: DraftRoom, mgr) -> None:
    async with AsyncSessionLocal() as db:
        series = await series_repo.get_series(db, series_id)
        games = await series_repo.get_series_games(db, series_id)
    fearless_pool = list(room.fearless_pool)
    series_dict = build_series_state_dict(series, games, room.state, fearless_pool)
    draft_dict = room.state.model_dump()
    await mgr.broadcast(series_id, sync_message(draft_dict, series_dict))


async def _save_draft_state(series_id: str, game_id: str):
    """Returns a callback to save draft state to DB."""
    async def callback(draft_state_json: dict):
        async with AsyncSessionLocal() as db:
            games = await series_repo.get_series_games(db, series_id)
            game = next((g for g in games if g.id == game_id), None)
            if game:
                await series_repo.save_draft_state(db, game, draft_state_json)
    return callback


def _start_timer(series_id: str, room: DraftRoom, game_id: str):
    """Cancel existing timer and start a new one."""
    if room.timer_task and not room.timer_task.done():
        room.timer_task.cancel()

    async def db_save(draft_json):
        async with AsyncSessionLocal() as db:
            games = await series_repo.get_series_games(db, series_id)
            game = next((g for g in games if g.id == game_id), None)
            if game:
                await series_repo.save_draft_state(db, game, draft_json)

    room.timer_task = asyncio.create_task(
        run_room_timer(
            series_id,
            room.series.timer_seconds,
            room,
            manager,
            db_save,
        )
    )


@router.websocket("/ws/{series_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    series_id: str,
    token: str = Query(...),
):
    # Load series
    async with AsyncSessionLocal() as db:
        series = await series_repo.get_series(db, series_id)
        if not series:
            await websocket.close(code=4004, reason="Series not found")
            return

        role = await resolve_role(series, token)
        if not role:
            await websocket.close(code=4001, reason="Invalid token")
            return

        games = await series_repo.get_series_games(db, series_id)

    # Get or create room
    if series_id not in store.rooms:
        current_game = next(
            (g for g in reversed(games) if g.status in ("pending", "in_progress")),
            games[-1] if games else None,
        )
        if current_game and current_game.draft_state_json:
            state = DraftState.model_validate(current_game.draft_state_json)
        else:
            # Should not happen — create_series always makes game 1
            await websocket.close(code=4005, reason="No active game")
            return

        completed = [
            {"draft_state_json": g.draft_state_json}
            for g in games
            if g.status == "complete"
        ]
        fearless_pool = build_fearless_pool(completed) if series.fearless else set()

        store.rooms[series_id] = DraftRoom(
            series=series,
            state=state,
            fearless_pool=fearless_pool,
        )

    room = store.rooms[series_id]

    # Connect
    await manager.connect(series_id, role, websocket)

    # Send initial SYNC
    fearless_list = list(room.fearless_pool)
    series_dict = build_series_state_dict(series, games, room.state, fearless_list)
    draft_dict = room.state.model_dump()
    await manager.send_to(series_id, role, sync_message(draft_dict, series_dict))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_to(
                    series_id, role, error_message("INVALID_JSON", "Invalid JSON")
                )
                continue

            msg_type = data.get("type")
            payload = data.get("payload", {})

            if msg_type == "PING":
                await manager.send_to(series_id, role, pong_message())

            elif msg_type == "READY":
                await _handle_ready(series_id, room, role)

            elif msg_type == "HOVER":
                champion_id = payload.get("champion_id")
                if champion_id and role in ("blue", "red"):
                    await manager.broadcast(
                        series_id, hover_update_message(champion_id, role)
                    )

            elif msg_type == "LOCK_IN":
                await _handle_lock_in(series_id, room, role, payload)

            elif msg_type == "REPORT_WINNER":
                await _handle_report_winner(series_id, room, role, payload)

            elif msg_type == "START_NEXT_GAME":
                await _handle_start_next_game(series_id, room, role, payload)

            else:
                await manager.send_to(
                    series_id, role,
                    error_message("UNKNOWN_TYPE", f"Unknown message type: {msg_type}"),
                )

    except WebSocketDisconnect:
        logger.info("WS disconnected normally: series=%s role=%s", series_id, role)
    except Exception:
        import traceback
        traceback.print_exc()
        logger.exception("WS error: series=%s role=%s", series_id, role)
    finally:
        await manager.disconnect(series_id, role)


async def _handle_ready(series_id: str, room: DraftRoom, role: str) -> None:
    if role == "spectator":
        await manager.send_to(
            series_id, role, error_message("SPECTATOR_ACTION", "Spectators cannot ready up")
        )
        return

    if role == "blue":
        room.blue_ready = True
    elif role == "red":
        room.red_ready = True

    room.state = room.state.model_copy(update={
        "blue_ready": room.blue_ready,
        "red_ready": room.red_ready,
    })

    await broadcast_sync(series_id, room, manager)

    # Both ready — start the draft
    if room.blue_ready and room.red_ready:
        room.state = room.state.model_copy(update={"phase": DraftPhase.BAN_1})

        # Update series + game status
        async with AsyncSessionLocal() as db:
            series = await series_repo.get_series(db, series_id)
            if series and series.status == "pending":
                await series_repo.update_series_status(db, series, "in_progress")
                room.series = series

            games = await series_repo.get_series_games(db, series_id)
            current_game = next(
                (g for g in games if g.status == "pending"), None
            )
            if current_game:
                await series_repo.start_game(db, current_game)
                _start_timer(series_id, room, current_game.id)

        await broadcast_sync(series_id, room, manager)


async def _handle_lock_in(
    series_id: str, room: DraftRoom, role: str, payload: dict,
) -> None:
    if role == "spectator":
        await manager.send_to(
            series_id, role, error_message("SPECTATOR_ACTION", "Spectators cannot lock in")
        )
        return

    champion_id = payload.get("champion_id")
    if not champion_id:
        await manager.send_to(
            series_id, role, error_message("MISSING_CHAMPION", "champion_id required")
        )
        return

    try:
        new_state = apply_action(room.state, champion_id, role, room.fearless_pool)
    except DraftValidationError as e:
        await manager.send_to(series_id, role, error_message(e.code, e.message))
        return

    room.state = new_state

    # Save to DB
    async with AsyncSessionLocal() as db:
        games = await series_repo.get_series_games(db, series_id)
        current_game = next(
            (g for g in games if g.status == "in_progress"), None
        )
        if current_game:
            await series_repo.save_draft_state(db, current_game, room.state.model_dump())

    # Reset timer
    if room.state.phase != DraftPhase.COMPLETE:
        async with AsyncSessionLocal() as db:
            games = await series_repo.get_series_games(db, series_id)
            current_game = next((g for g in games if g.status == "in_progress"), None)
            if current_game:
                _start_timer(series_id, room, current_game.id)
    else:
        # Draft complete — cancel timer
        if room.timer_task and not room.timer_task.done():
            room.timer_task.cancel()
            room.timer_task = None

    await broadcast_sync(series_id, room, manager)


async def _handle_report_winner(
    series_id: str, room: DraftRoom, role: str, payload: dict,
) -> None:
    if role == "spectator":
        await manager.send_to(
            series_id, role, error_message("SPECTATOR_ACTION", "Spectators cannot report winner")
        )
        return

    winner = payload.get("winner")
    if winner not in ("blue", "red"):
        await manager.send_to(
            series_id, role, error_message("INVALID_WINNER", "winner must be 'blue' or 'red'")
        )
        return

    async with AsyncSessionLocal() as db:
        series = await series_repo.get_series(db, series_id)
        games = await series_repo.get_series_games(db, series_id)
        current_game = next((g for g in games if g.status == "in_progress"), None)

        if not current_game:
            await manager.send_to(
                series_id, role, error_message("NO_ACTIVE_GAME", "No in-progress game")
            )
            return

        # Build fearless pool including this game
        completed_dicts = [
            {"draft_state_json": g.draft_state_json} for g in games if g.status == "complete"
        ]
        completed_dicts.append({"draft_state_json": room.state.model_dump()})
        new_fearless_pool = build_fearless_pool(completed_dicts) if series.fearless else set()

        await series_repo.complete_game(
            db, current_game, winner,
            room.state.model_dump(),
            list(new_fearless_pool),
        )

        # Update scores
        blue_score = series.blue_score + (1 if winner == "blue" else 0)
        red_score = series.red_score + (1 if winner == "red" else 0)

        max_games = FORMAT_MAX_GAMES[series.format]
        games_needed = (max_games // 2) + 1
        series_over = blue_score >= games_needed or red_score >= games_needed

        new_status = "complete" if series_over else "in_progress"
        await series_repo.update_series_score(db, series, blue_score, red_score, new_status)
        room.series = series
        room.fearless_pool = new_fearless_pool

    # Broadcast
    async with AsyncSessionLocal() as db:
        series = await series_repo.get_series(db, series_id)
        games = await series_repo.get_series_games(db, series_id)

    fearless_list = list(room.fearless_pool)
    series_dict = build_series_state_dict(series, games, room.state, fearless_list)

    await manager.broadcast(
        series_id,
        game_complete_message(current_game.game_number, winner, series_dict),
    )

    if series_over:
        series_winner = "blue" if blue_score >= games_needed else "red"
        await manager.broadcast(
            series_id,
            series_complete_message(series_winner, blue_score, red_score),
        )

        # Send results to Discord
        from app.notifications import send_series_complete_to_discord
        winner_team = series.blue_team_name if series_winner == "blue" else series.red_team_name
        loser_team = series.red_team_name if series_winner == "blue" else series.blue_team_name
        game_dicts = [
            {
                "game_number": g.game_number,
                "winner": g.winner,
                "draft_state": g.draft_state_json,
            }
            for g in games
        ]
        # Include the just-completed game
        game_dicts.append({
            "game_number": current_game.game_number,
            "winner": winner,
            "draft_state": room.state.model_dump(),
        })
        await send_series_complete_to_discord(
            series_name=series.name,
            winner_team=winner_team or series_winner.title(),
            loser_team=loser_team or ("Red" if series_winner == "blue" else "Blue"),
            blue_score=blue_score,
            red_score=red_score,
            games=game_dicts,
            series_format=series.format,
            fearless=series.fearless,
        )


async def _handle_start_next_game(
    series_id: str, room: DraftRoom, role: str, payload: dict,
) -> None:
    if role == "spectator":
        await manager.send_to(
            series_id, role,
            error_message("SPECTATOR_ACTION", "Spectators cannot start next game"),
        )
        return

    async with AsyncSessionLocal() as db:
        series = await series_repo.get_series(db, series_id)
        games = await series_repo.get_series_games(db, series_id)

        if series.status == "complete":
            await manager.send_to(
                series_id, role, error_message("SERIES_COMPLETE", "Series is already complete")
            )
            return

        last_game = games[-1] if games else None
        if last_game and last_game.status != "complete":
            await manager.send_to(
                series_id, role,
                error_message("GAME_NOT_COMPLETE", "Current game is not complete"),
            )
            return

        next_game_number = (last_game.game_number + 1) if last_game else 1

        # Swap sides if requested — swap team names AND scores so they follow the team
        swap_sides = payload.get("swap_sides", False)
        if swap_sides:
            old_blue_name = series.blue_team_name
            old_red_name = series.red_team_name
            old_blue_score = series.blue_score
            old_red_score = series.red_score
            series.blue_team_name = old_red_name
            series.red_team_name = old_blue_name
            series.blue_score = old_red_score
            series.red_score = old_blue_score
            await db.commit()
            await db.refresh(series)
            room.series = series

        # Determine first pick — override or alternate
        first_pick_override = payload.get("first_pick_override")
        if first_pick_override in ("blue", "red"):
            first_pick_side = first_pick_override
        else:
            first_pick_side = determine_first_pick(
                series.game1_first_pick, next_game_number
            )

        fearless_list = list(room.fearless_pool)

        new_game = await series_repo.create_game(
            db,
            series_id=series_id,
            game_number=next_game_number,
            first_pick_side=first_pick_side,
            fearless_mode=series.fearless,
            fearless_pool=fearless_list,
            blue_team_name=series.blue_team_name,
            red_team_name=series.red_team_name,
        )

    # Update room state
    room.state = DraftState.model_validate(new_game.draft_state_json)
    room.blue_ready = False
    room.red_ready = False

    await manager.broadcast(
        series_id,
        next_game_starting_message(next_game_number, first_pick_side, fearless_list),
    )
    await broadcast_sync(series_id, room, manager)

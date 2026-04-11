import asyncio
import logging
import random

from app.logic.draft_engine import DraftValidationError, apply_action
from app.models.draft import DraftPhase, DraftState
from app.models.messages import timer_tick_message

logger = logging.getLogger(__name__)


def _pick_random_legal_champion(
    state: DraftState,
    fearless_pool: set[str],
    all_champion_ids: list[str],
) -> str | None:
    """Pick a random champion that is legal for the current slot."""
    used = {s.champion_id for s in state.slots if s.locked and s.champion_id}
    current_slot = state.slots[state.current_slot_index]

    candidates = []
    for cid in all_champion_ids:
        if cid in used:
            continue
        if current_slot.action_type == "pick" and cid in fearless_pool:
            continue
        candidates.append(cid)

    if not candidates:
        return None
    return random.choice(candidates)


async def run_room_timer(
    series_id: str,
    timer_seconds: int,
    room,  # DraftRoom — avoid circular import
    manager,  # ConnectionManager
    db_save_callback=None,
    all_champion_ids: list[str] | None = None,
) -> None:
    """
    Runs as asyncio.Task per active game.
    Each second: decrement timer, broadcast TIMER_TICK.
    On 0:
      - Ban slot: auto-pass (champion_id=None, slot locked, advance)
      - Pick slot: auto-pick random legal champion
    Cancelled and restarted on each LOCK_IN.
    Cancelled when game reaches COMPLETE.
    """
    try:
        remaining = timer_seconds
        room.state = room.state.model_copy(update={"timer_seconds_remaining": remaining})

        while remaining > 0:
            await asyncio.sleep(1)
            remaining -= 1
            room.state = room.state.model_copy(update={"timer_seconds_remaining": remaining})
            await manager.broadcast(series_id, timer_tick_message(remaining))

        # Timer expired — auto-advance
        if room.state.phase == DraftPhase.COMPLETE:
            return

        current_slot = room.state.slots[room.state.current_slot_index]
        acting_side = current_slot.side

        if current_slot.action_type == "ban":
            # Auto-pass: lock slot with no champion, advance index
            new_slots = [s.model_copy() for s in room.state.slots]
            new_slots[room.state.current_slot_index] = current_slot.model_copy(
                update={"champion_id": None, "locked": True}
            )
            next_index = room.state.current_slot_index + 1
            next_phase = DraftPhase.COMPLETE if next_index >= 20 else _compute_phase_import(next_index)
            room.state = room.state.model_copy(update={
                "slots": new_slots,
                "current_slot_index": next_index,
                "phase": next_phase,
            })
        else:
            # Auto-pick random legal champion
            champion_ids = all_champion_ids or []
            champ = _pick_random_legal_champion(room.state, room.fearless_pool, champion_ids)
            if champ:
                try:
                    room.state = apply_action(
                        room.state, champ, acting_side, room.fearless_pool
                    )
                except DraftValidationError:
                    logger.warning("Auto-pick failed for %s in %s", champ, series_id)
                    return

        # Broadcast updated state after auto-advance
        from app.ws.handler import broadcast_sync
        await broadcast_sync(series_id, room, manager)

        # Save to DB if callback provided
        if db_save_callback:
            await db_save_callback(room.state.model_dump())

        # If not complete, restart timer for next slot
        if room.state.phase != DraftPhase.COMPLETE:
            room.timer_task = asyncio.create_task(
                run_room_timer(
                    series_id, timer_seconds, room, manager,
                    db_save_callback, all_champion_ids,
                )
            )

    except asyncio.CancelledError:
        pass
    except Exception:
        logger.exception("Timer error for series %s", series_id)


def _compute_phase_import(slot_index: int):
    """Avoid circular import by deferring."""
    from app.logic.draft_engine import compute_phase
    return compute_phase(slot_index)

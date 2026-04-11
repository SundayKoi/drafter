import asyncio
import logging

from app.models.draft import DraftPhase
from app.models.messages import timer_tick_message

logger = logging.getLogger(__name__)


async def run_room_timer(
    series_id: str,
    timer_seconds: int,
    room,  # DraftRoom — avoid circular import
    manager,  # ConnectionManager
    db_save_callback=None,
) -> None:
    """
    Runs as asyncio.Task per active game.
    Each second: decrement timer, broadcast TIMER_TICK.
    On 0: auto-pass — lock the slot with no champion and advance.
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

        # Timer expired — auto-pass (skip this action)
        if room.state.phase == DraftPhase.COMPLETE:
            return

        if room.state.current_slot_index >= len(room.state.slots):
            return

        current_slot = room.state.slots[room.state.current_slot_index]

        # Lock the slot with no champion and advance
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
                    db_save_callback,
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

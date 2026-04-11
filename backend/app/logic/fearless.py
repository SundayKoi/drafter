def build_fearless_pool(completed_games: list[dict]) -> set[str]:
    """
    Collects all PICKED champion_ids from completed games.
    Bans do NOT carry over — only picks are fearless-locked.
    Champions in the pool can still be banned in later games.

    Args:
        completed_games: list of Game-like dicts, each with a
            "draft_state_json" key containing {"slots": [...]}.

    Returns:
        Set of champion_ids that cannot be picked again this series.
    """
    pool: set[str] = set()
    for game in completed_games:
        draft_state = game.get("draft_state_json") or {}
        for slot in draft_state.get("slots", []):
            if slot.get("action_type") == "pick" and slot.get("champion_id"):
                pool.add(slot["champion_id"])
    return pool


def validate_fearless_pick(
    champion_id: str,
    fearless_pool: set[str],
) -> str | None:
    """
    Returns an error message if the champion is fearless-locked,
    or None if the pick is allowed.
    """
    if champion_id in fearless_pool:
        return f"{champion_id} was already picked in a previous game this series"
    return None

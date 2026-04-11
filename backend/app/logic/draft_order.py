from typing import Literal

# fp = first-pick team, sp = second-pick team
# Sequence never changes — only which team is "fp" changes per game
ABSTRACT_DRAFT_ORDER: list[tuple[str, str]] = [
    ("fp", "ban"),  ("sp", "ban"),  ("fp", "ban"),  ("sp", "ban"),  ("fp", "ban"),  ("sp", "ban"),
    ("fp", "pick"), ("sp", "pick"), ("sp", "pick"), ("fp", "pick"), ("fp", "pick"), ("sp", "pick"),
    ("sp", "ban"),  ("fp", "ban"),  ("sp", "ban"),  ("fp", "ban"),
    ("sp", "pick"), ("fp", "pick"), ("fp", "pick"), ("sp", "pick"),
]


def generate_draft_order(
    first_pick_side: Literal["blue", "red"],
) -> list[tuple[str, str]]:
    """
    Substitutes concrete sides into the abstract sequence.

    first_pick_side="blue" -> blue bans first, blue picks first
    first_pick_side="red"  -> red bans first, red picks first

    UI columns are ALWAYS Blue (left) / Red (right).
    first_pick_side only controls who acts first in the sequence.

    Returns list of ("blue"|"red", "ban"|"pick") tuples, length 20.
    """
    sp = "red" if first_pick_side == "blue" else "blue"
    role_map = {"fp": first_pick_side, "sp": sp}
    return [(role_map[r], a) for r, a in ABSTRACT_DRAFT_ORDER]


def determine_first_pick(
    game1_first_pick: Literal["blue", "red"],
    game_number: int,
) -> Literal["blue", "red"]:
    """
    Strict alternation starting from game1_first_pick.
    Game 1: assigned side. Game 2: opposite. Game 3: back. Etc.
    """
    if game_number % 2 == 1:
        return game1_first_pick
    return "red" if game1_first_pick == "blue" else "blue"

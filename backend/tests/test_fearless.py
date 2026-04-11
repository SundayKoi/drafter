from app.logic.fearless import build_fearless_pool, validate_fearless_pick


def _make_game(picks: list[str], bans: list[str] | None = None) -> dict:
    """Helper to build a game dict with draft_state_json."""
    slots = []
    for champ in (bans or []):
        slots.append({"action_type": "ban", "champion_id": champ})
    for champ in picks:
        slots.append({"action_type": "pick", "champion_id": champ})
    return {"draft_state_json": {"slots": slots}}


# --- build_fearless_pool ---


class TestBuildFearlessPool:
    def test_empty_games(self):
        assert build_fearless_pool([]) == set()

    def test_single_game_picks_only(self):
        game = _make_game(picks=["Ahri", "Zed", "Jinx"])
        pool = build_fearless_pool([game])
        assert pool == {"Ahri", "Zed", "Jinx"}

    def test_bans_excluded(self):
        game = _make_game(picks=["Ahri"], bans=["Yasuo", "Yone"])
        pool = build_fearless_pool([game])
        assert pool == {"Ahri"}
        assert "Yasuo" not in pool
        assert "Yone" not in pool

    def test_multiple_games_accumulate(self):
        g1 = _make_game(picks=["Ahri", "Zed"])
        g2 = _make_game(picks=["Jinx", "Caitlyn"])
        pool = build_fearless_pool([g1, g2])
        assert pool == {"Ahri", "Zed", "Jinx", "Caitlyn"}

    def test_full_draft_10_picks(self):
        blue_picks = ["Ahri", "Zed", "Jinx", "Caitlyn", "Thresh"]
        red_picks = ["Yasuo", "Yone", "Lux", "Leona", "Jhin"]
        game = _make_game(picks=blue_picks + red_picks)
        pool = build_fearless_pool([game])
        assert pool == set(blue_picks + red_picks)
        assert len(pool) == 10

    def test_three_games_bo5(self):
        g1 = _make_game(picks=["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"])
        g2 = _make_game(picks=["K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"])
        g3 = _make_game(picks=["U", "V", "W", "X", "Y", "Z", "AA", "BB", "CC", "DD"])
        pool = build_fearless_pool([g1, g2, g3])
        assert len(pool) == 30

    def test_null_draft_state_json(self):
        game = {"draft_state_json": None}
        assert build_fearless_pool([game]) == set()

    def test_missing_draft_state_json(self):
        game = {}
        assert build_fearless_pool([game]) == set()

    def test_empty_slots(self):
        game = {"draft_state_json": {"slots": []}}
        assert build_fearless_pool([game]) == set()

    def test_null_champion_id_skipped(self):
        game = {"draft_state_json": {"slots": [
            {"action_type": "pick", "champion_id": None},
            {"action_type": "pick", "champion_id": "Ahri"},
        ]}}
        pool = build_fearless_pool([game])
        assert pool == {"Ahri"}

    def test_bans_with_same_champ_as_pick_in_other_game(self):
        """A champ banned in game 1 and picked in game 2 should be in the pool."""
        g1 = _make_game(picks=["Zed"], bans=["Ahri"])
        g2 = _make_game(picks=["Ahri"], bans=["Zed"])
        pool = build_fearless_pool([g1, g2])
        assert pool == {"Zed", "Ahri"}


# --- validate_fearless_pick ---


class TestValidateFearlessPick:
    def test_allowed_pick(self):
        assert validate_fearless_pick("Ahri", set()) is None

    def test_allowed_pick_different_champ(self):
        assert validate_fearless_pick("Ahri", {"Zed", "Jinx"}) is None

    def test_blocked_pick(self):
        result = validate_fearless_pick("Ahri", {"Ahri", "Zed"})
        assert result is not None
        assert "Ahri" in result

    def test_empty_pool_always_allowed(self):
        assert validate_fearless_pick("AnyChamp", set()) is None

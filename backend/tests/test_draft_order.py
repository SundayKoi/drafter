from app.logic.draft_order import (
    ABSTRACT_DRAFT_ORDER,
    determine_first_pick,
    generate_draft_order,
)


class TestAbstractOrder:
    def test_length_is_20(self):
        assert len(ABSTRACT_DRAFT_ORDER) == 20

    def test_ban_count(self):
        bans = [s for s in ABSTRACT_DRAFT_ORDER if s[1] == "ban"]
        assert len(bans) == 10

    def test_pick_count(self):
        picks = [s for s in ABSTRACT_DRAFT_ORDER if s[1] == "pick"]
        assert len(picks) == 10

    def test_fp_ban_count(self):
        fp_bans = [s for s in ABSTRACT_DRAFT_ORDER if s == ("fp", "ban")]
        assert len(fp_bans) == 5

    def test_sp_ban_count(self):
        sp_bans = [s for s in ABSTRACT_DRAFT_ORDER if s == ("sp", "ban")]
        assert len(sp_bans) == 5

    def test_fp_pick_count(self):
        fp_picks = [s for s in ABSTRACT_DRAFT_ORDER if s == ("fp", "pick")]
        assert len(fp_picks) == 5

    def test_sp_pick_count(self):
        sp_picks = [s for s in ABSTRACT_DRAFT_ORDER if s == ("sp", "pick")]
        assert len(sp_picks) == 5

    def test_phase_structure(self):
        """Ban phase 1 (6), Pick phase 1 (6), Ban phase 2 (4), Pick phase 2 (4)."""
        actions = [a for _, a in ABSTRACT_DRAFT_ORDER]
        assert actions[:6] == ["ban"] * 6
        assert actions[6:12] == ["pick"] * 6
        assert actions[12:16] == ["ban"] * 4
        assert actions[16:20] == ["pick"] * 4


class TestGenerateDraftOrderBlueFP:
    def setup_method(self):
        self.order = generate_draft_order("blue")

    def test_length(self):
        assert len(self.order) == 20

    def test_first_action_is_blue_ban(self):
        assert self.order[0] == ("blue", "ban")

    def test_second_action_is_red_ban(self):
        assert self.order[1] == ("red", "ban")

    def test_first_pick_is_blue(self):
        assert self.order[6] == ("blue", "pick")

    def test_second_pick_is_red(self):
        assert self.order[7] == ("red", "pick")

    def test_third_pick_is_red(self):
        """Second-pick gets two consecutive picks."""
        assert self.order[8] == ("red", "pick")

    def test_blue_bans_total(self):
        blue_bans = [s for s in self.order if s == ("blue", "ban")]
        assert len(blue_bans) == 5

    def test_red_bans_total(self):
        red_bans = [s for s in self.order if s == ("red", "ban")]
        assert len(red_bans) == 5

    def test_blue_picks_total(self):
        blue_picks = [s for s in self.order if s == ("blue", "pick")]
        assert len(blue_picks) == 5

    def test_red_picks_total(self):
        red_picks = [s for s in self.order if s == ("red", "pick")]
        assert len(red_picks) == 5

    def test_only_valid_sides(self):
        for side, _ in self.order:
            assert side in ("blue", "red")

    def test_only_valid_actions(self):
        for _, action in self.order:
            assert action in ("ban", "pick")


class TestGenerateDraftOrderRedFP:
    def setup_method(self):
        self.order = generate_draft_order("red")

    def test_length(self):
        assert len(self.order) == 20

    def test_first_action_is_red_ban(self):
        assert self.order[0] == ("red", "ban")

    def test_second_action_is_blue_ban(self):
        assert self.order[1] == ("blue", "ban")

    def test_first_pick_is_red(self):
        assert self.order[6] == ("red", "pick")

    def test_second_pick_is_blue(self):
        assert self.order[7] == ("blue", "pick")

    def test_third_pick_is_blue(self):
        """Second-pick gets two consecutive picks."""
        assert self.order[8] == ("blue", "pick")

    def test_red_bans_total(self):
        red_bans = [s for s in self.order if s == ("red", "ban")]
        assert len(red_bans) == 5

    def test_blue_bans_total(self):
        blue_bans = [s for s in self.order if s == ("blue", "ban")]
        assert len(blue_bans) == 5

    def test_red_picks_total(self):
        red_picks = [s for s in self.order if s == ("red", "pick")]
        assert len(red_picks) == 5

    def test_blue_picks_total(self):
        blue_picks = [s for s in self.order if s == ("blue", "pick")]
        assert len(blue_picks) == 5


class TestSymmetry:
    def test_blue_and_red_are_mirrors(self):
        """Swapping blue/red in the output should produce the other order."""
        blue_order = generate_draft_order("blue")
        red_order = generate_draft_order("red")
        swap = {"blue": "red", "red": "blue"}
        blue_swapped = [(swap[s], a) for s, a in blue_order]
        assert blue_swapped == red_order


class TestDetermineFirstPick:
    def test_game1_blue_returns_blue(self):
        assert determine_first_pick("blue", 1) == "blue"

    def test_game2_blue_returns_red(self):
        assert determine_first_pick("blue", 2) == "red"

    def test_game3_blue_returns_blue(self):
        assert determine_first_pick("blue", 3) == "blue"

    def test_game4_blue_returns_red(self):
        assert determine_first_pick("blue", 4) == "red"

    def test_game5_blue_returns_blue(self):
        assert determine_first_pick("blue", 5) == "blue"

    def test_game1_red_returns_red(self):
        assert determine_first_pick("red", 1) == "red"

    def test_game2_red_returns_blue(self):
        assert determine_first_pick("red", 2) == "blue"

    def test_game3_red_returns_red(self):
        assert determine_first_pick("red", 3) == "red"

    def test_game4_red_returns_blue(self):
        assert determine_first_pick("red", 4) == "blue"

    def test_game5_red_returns_red(self):
        assert determine_first_pick("red", 5) == "red"

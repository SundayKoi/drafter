import logging

import aiohttp

from app.config import settings

logger = logging.getLogger(__name__)


async def send_series_complete_to_discord(
    series_name: str,
    winner_team: str,
    loser_team: str,
    blue_score: int,
    red_score: int,
    games: list[dict],
    series_format: str,
    fearless: bool,
) -> None:
    """Post series results to Discord via webhook."""
    if not settings.DISCORD_WEBHOOK_URL:
        return

    # Build game-by-game summary
    game_lines = []
    for g in games:
        if not g.get("winner"):
            continue
        game_num = g["game_number"]
        draft = g.get("draft_state") or {}
        blue_name = draft.get("blue_team_name") or "Blue"
        red_name = draft.get("red_team_name") or "Red"
        winner_name = blue_name if g["winner"] == "blue" else red_name

        # Get picks
        slots = draft.get("slots") or []
        blue_picks = [s["champion_id"] for s in slots if s.get("side") == "blue" and s.get("action_type") == "pick" and s.get("champion_id")]
        red_picks = [s["champion_id"] for s in slots if s.get("side") == "red" and s.get("action_type") == "pick" and s.get("champion_id")]

        blue_str = ", ".join(blue_picks) if blue_picks else "—"
        red_str = ", ".join(red_picks) if red_picks else "—"

        game_lines.append(
            f"**Game {game_num}** — {winner_name} win\n"
            f"> {blue_name}: {blue_str}\n"
            f"> {red_name}: {red_str}"
        )

    games_text = "\n\n".join(game_lines) if game_lines else "No game data"

    tags = []
    tags.append(series_format.upper())
    if fearless:
        tags.append("Fearless")
    tags_str = " · ".join(tags)

    embed = {
        "title": f"{winner_team} wins the series!",
        "description": f"**{series_name}**\n{tags_str}\n\n**Final Score: {blue_score} - {red_score}**\n\n{games_text}",
        "color": 0xFF6B00,  # Ember orange
    }

    payload = {"embeds": [embed]}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.DISCORD_WEBHOOK_URL,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status >= 400:
                    body = await resp.text()
                    logger.error("Discord webhook failed: %s %s", resp.status, body)
                else:
                    logger.info("Discord webhook sent for series: %s", series_name)
    except Exception:
        logger.exception("Failed to send Discord webhook")

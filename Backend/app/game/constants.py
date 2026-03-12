from __future__ import annotations

from .types import Player, Terrain

BOARD_SIZE = 13
COLUMN_LABELS = list("ABCDEFGHIJKLM")
HUNTER_COLUMNS = (2, 3, 4, 5, 7, 8, 9, 10)
TERRAIN_ROWS = (
    "WWLLLLLLLLLWW",
    "WWLLLLLLLLLWW",
    "WWLLLLLLWWLWW",
    "WWWLLLWWWWWWW",
    "LWWWWWWWWWWWL",
    "LLWLLLLLLLWLL",
    "LLWLLLLLLWWLL",
    "LLWWWLLLLLWLL",
    "LWWWWWWWWWWWL",
    "WWWWWWWLLLWWW",
    "WWLWWLLLLLLWW",
    "WWLLLLLLLLLWW",
    "WWLLLLLLLLLWW",
)

terrain_map: list[list[Terrain]] = [
    ["water" if cell == "W" else "land" for cell in row] for row in TERRAIN_ROWS
]

CARDINAL_DIRECTIONS = (
    {"row": -1, "col": 0},
    {"row": 1, "col": 0},
    {"row": 0, "col": -1},
    {"row": 0, "col": 1},
)

PLAYER_LABELS: dict[Player, str] = {
    "marauders": "Marauders",
    "vikings": "Vikings",
}

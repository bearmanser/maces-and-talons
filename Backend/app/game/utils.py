from __future__ import annotations

from .constants import BOARD_SIZE, COLUMN_LABELS
from .types import Player, Position


def positions_match(first: Position, second: Position) -> bool:
    return first["row"] == second["row"] and first["col"] == second["col"]


def is_in_bounds(row: int, col: int) -> bool:
    return 0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE


def other_player(player: Player) -> Player:
    return "vikings" if player == "marauders" else "marauders"


def is_adjacent(first: Position, second: Position) -> bool:
    return max(abs(first["row"] - second["row"]), abs(first["col"] - second["col"])) == 1


def format_square(position: Position) -> str:
    return f"{COLUMN_LABELS[position['col']]}{position['row'] + 1}"

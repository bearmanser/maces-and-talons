from __future__ import annotations

from .constants import CARDINAL_DIRECTIONS, terrain_map
from .selectors import (
    get_piece_at,
    get_piece_controller,
    get_ship_at,
    get_ship_footprint,
    has_traitor_token,
)
from .types import GameState, Piece, Position, Ship
from .utils import is_in_bounds, other_player


def get_hunter_style_moves(piece: Piece, state: GameState) -> list[Position]:
    valid_moves: list[Position] = []

    for direction in CARDINAL_DIRECTIONS:
        distance = 1

        while True:
            target = {
                "row": piece["position"]["row"] + direction["row"] * distance,
                "col": piece["position"]["col"] + direction["col"] * distance,
            }

            if not is_in_bounds(target["row"], target["col"]):
                break

            if has_traitor_token(state, target) or get_piece_at(state, target):
                break

            ship = get_ship_at(state, target)

            if terrain_map[target["row"]][target["col"]] == "water":
                if not ship or ship["kind"] != "longship":
                    break

            valid_moves.append(target)
            distance += 1

    return valid_moves


def get_chief_moves(piece: Piece, state: GameState) -> list[Position]:
    if not piece["owner"]:
        return []

    valid_moves: list[Position] = []

    for direction in CARDINAL_DIRECTIONS:
        for distance in range(1, 3):
            target = {
                "row": piece["position"]["row"] + direction["row"] * distance,
                "col": piece["position"]["col"] + direction["col"] * distance,
            }

            if not is_in_bounds(target["row"], target["col"]):
                break

            if has_traitor_token(state, target) or get_piece_at(state, target):
                break

            if terrain_map[target["row"]][target["col"]] == "water":
                ship = get_ship_at(state, target)

                if not ship or ship["kind"] != "chiefship":
                    break

            valid_moves.append(target)

    return valid_moves


def has_adjacent_allied_piece(state: GameState, piece: Piece) -> bool:
    for direction in CARDINAL_DIRECTIONS:
        neighbor = {
            "row": piece["position"]["row"] + direction["row"],
            "col": piece["position"]["col"] + direction["col"],
        }

        if not is_in_bounds(neighbor["row"], neighbor["col"]):
            continue

        neighbor_piece = get_piece_at(state, neighbor)

        if (
            neighbor_piece
            and neighbor_piece["id"] != piece["id"]
            and get_piece_controller(neighbor_piece, state) == piece["owner"]
        ):
            return True

    return False


def get_dragon_moves(piece: Piece, state: GameState) -> list[Position]:
    controller = state["dragonController"]

    if not controller:
        return []

    valid_moves: list[Position] = []

    for direction in CARDINAL_DIRECTIONS:
        for distance in range(1, 4):
            target = {
                "row": piece["position"]["row"] + direction["row"] * distance,
                "col": piece["position"]["col"] + direction["col"] * distance,
            }

            if not is_in_bounds(target["row"], target["col"]):
                break

            if has_traitor_token(state, target):
                continue

            target_piece = get_piece_at(state, target)

            if not target_piece:
                valid_moves.append(target)
                continue

            target_owner = get_piece_controller(target_piece, state)

            if target_owner == controller:
                continue

            if (
                target_piece["kind"] == "hunter"
                and target_piece["owner"] == other_player(controller)
                and not has_adjacent_allied_piece(state, target_piece)
            ):
                valid_moves.append(target)

            break

    return valid_moves


def get_piece_moves(piece: Piece, state: GameState) -> list[Position]:
    if piece["kind"] in ("hunter", "traitor"):
        return get_hunter_style_moves(piece, state)
    if piece["kind"] == "chief":
        return get_chief_moves(piece, state)

    return get_dragon_moves(piece, state)


def get_ship_moves(ship: Ship, state: GameState) -> list[Position]:
    occupied = any(
        get_piece_at(state, cell) for cell in get_ship_footprint(ship["kind"], ship["position"])
    )

    if occupied:
        return []

    valid_moves: list[Position] = []

    for direction in CARDINAL_DIRECTIONS:
        distance = 1

        while True:
            target = {
                "row": ship["position"]["row"] + direction["row"] * distance,
                "col": ship["position"]["col"] + direction["col"] * distance,
            }
            footprint = get_ship_footprint(ship["kind"], target)
            blocked = False

            for cell in footprint:
                if not is_in_bounds(cell["row"], cell["col"]):
                    blocked = True
                    break

                if terrain_map[cell["row"]][cell["col"]] != "water":
                    blocked = True
                    break

                if get_piece_at(state, cell) or get_ship_at(state, cell, ship["id"]):
                    blocked = True
                    break

            if blocked:
                break

            valid_moves.append(target)
            distance += 1

    return valid_moves

from __future__ import annotations

from .constants import PLAYER_LABELS
from .types import GameState, Piece, Player, Position, Ship, ShipKind
from .utils import other_player, positions_match


def get_ship_footprint(_kind: ShipKind, position: Position) -> list[Position]:
    return [{"row": position["row"], "col": position["col"]}]


def get_piece_controller(piece: Piece, state: GameState) -> Player | None:
    if piece["kind"] == "dragon":
        return state["dragonController"]

    return piece["owner"]


def get_piece_at(state: GameState, position: Position) -> Piece | None:
    return next(
        (piece for piece in state["pieces"] if positions_match(piece["position"], position)),
        None,
    )


def get_ship_at(
    state: GameState, position: Position, excluded_id: str | None = None
) -> Ship | None:
    return next(
        (
            ship
            for ship in state["ships"]
            if ship["id"] != excluded_id
            and any(
                positions_match(cell, position)
                for cell in get_ship_footprint(ship["kind"], ship["position"])
            )
        ),
        None,
    )


def get_ground_mace_at(state: GameState, position: Position):
    return next(
        (
            mace
            for mace in state["maces"]
            if not mace["carriedBy"] and positions_match(mace["position"], position)
        ),
        None,
    )


def has_traitor_token(state: GameState, position: Position) -> bool:
    return state["traitorTokenPosition"] is not None and positions_match(
        state["traitorTokenPosition"], position
    )


def get_chief(state: GameState, owner: Player) -> Piece | None:
    return next(
        (
            piece
            for piece in state["pieces"]
            if piece["kind"] == "chief" and piece["owner"] == owner
        ),
        None,
    )


def get_piece_controller_at(state: GameState, position: Position) -> Player | None:
    piece = get_piece_at(state, position)
    return get_piece_controller(piece, state) if piece else None


def can_be_sandwich_captured(piece: Piece) -> bool:
    return piece["kind"] in ("hunter", "traitor")


def get_piece_role_label(piece: Piece) -> str:
    kind = piece["kind"]

    if kind == "hunter":
        return "Hunter"
    if kind == "chief":
        return "Chief"
    if kind == "dragon":
        return "Dragon"

    return "Traitor"


def get_ship_role_label(ship: Ship) -> str:
    return "Longship" if ship["kind"] == "longship" else "Chiefship"


def get_piece_label(piece: Piece, state: GameState) -> str:
    controller = get_piece_controller(piece, state)

    if piece["kind"] == "dragon":
        return f"{PLAYER_LABELS[controller]} Dragon" if controller else "Dragon"

    if piece["owner"]:
        return f"{PLAYER_LABELS[piece['owner']]} {get_piece_role_label(piece)}"

    return get_piece_role_label(piece)


def get_ship_label(ship: Ship) -> str:
    return f"{PLAYER_LABELS[ship['owner']]} {get_ship_role_label(ship)}"


def is_traitor_available(state: GameState, player: Player) -> bool:
    return (
        state["traitorClaimedBy"] == player
        and not state["traitorAbilityUsed"][player]
        and any(
            piece["kind"] == "hunter" and piece["owner"] == other_player(player)
            for piece in state["pieces"]
        )
    )

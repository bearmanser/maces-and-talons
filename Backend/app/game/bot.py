from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from functools import lru_cache
from random import SystemRandom
from typing import Literal

from .actions import resolve_piece_move, resolve_ship_move, resolve_traitor_ability
from .constants import CARDINAL_DIRECTIONS, terrain_map
from .moves import get_piece_moves, get_ship_moves
from .selectors import get_chief, get_piece_controller, is_traitor_available
from .types import GameState, Piece, Player, Position
from .utils import is_in_bounds, other_player, positions_match

BotDifficulty = Literal["easy", "medium", "hard"]

_RNG = SystemRandom()
_WIN_SCORE = 100_000
_SHIP_CONTROL_VALUE = 28
_DRAGON_CONTROL_VALUE = 220
_TRAITOR_CLAIM_VALUE = 180
_TRAITOR_READY_VALUE = 120
_MACE_CARRIER_VALUE = 85
_EXACT_REVERSAL_PENALTY = 90
_NEUTRAL_MOVE_PENALTY = 12


@dataclass(frozen=True)
class BotAction:
    type: Literal["move_piece", "move_ship", "use_traitor"]
    piece_id: str | None = None
    ship_id: str | None = None
    target: Position | None = None
    target_hunter_id: str | None = None


@dataclass(frozen=True)
class DifficultyProfile:
    depth: int
    candidate_pool: int
    score_window: int


DIFFICULTY_PROFILES: dict[BotDifficulty, DifficultyProfile] = {
    "easy": DifficultyProfile(depth=1, candidate_pool=6, score_window=120),
    "medium": DifficultyProfile(depth=1, candidate_pool=1, score_window=0),
    "hard": DifficultyProfile(depth=1, candidate_pool=1, score_window=0),
}


def choose_bot_action(state: GameState, player: Player, difficulty: BotDifficulty) -> BotAction | None:
    legal_actions = get_legal_actions(state, player)

    if not legal_actions:
        return None

    profile = DIFFICULTY_PROFILES[difficulty]
    ranked_children = _rank_children(state, legal_actions, player, reverse=True)
    scored_actions: list[tuple[BotAction, int, int, int]] = []

    for action, child_state, heuristic_score, action_priority in ranked_children:
        score = _search(
            child_state,
            depth=profile.depth - 1,
            alpha=-_WIN_SCORE * 2,
            beta=_WIN_SCORE * 2,
            bot_player=player,
        )
        scored_actions.append((action, score, action_priority, heuristic_score))

    scored_actions.sort(key=lambda item: (item[1], item[2], item[3]), reverse=True)
    best_score = scored_actions[0][1]
    viable_actions = [
        action
        for action, score, _, _ in scored_actions
        if best_score - score <= profile.score_window
    ][: profile.candidate_pool]

    return _RNG.choice(viable_actions or [scored_actions[0][0]])


def apply_bot_action(state: GameState, action: BotAction) -> GameState:
    if action.type == "move_piece" and action.piece_id and action.target:
        return resolve_piece_move(state, action.piece_id, action.target)

    if action.type == "move_ship" and action.ship_id and action.target:
        return resolve_ship_move(state, action.ship_id, action.target)

    if action.type == "use_traitor" and action.target_hunter_id:
        return resolve_traitor_ability(state, action.target_hunter_id)

    return state


def get_legal_actions(state: GameState, player: Player) -> list[BotAction]:
    actions: list[BotAction] = []

    for piece in state["pieces"]:
        if get_piece_controller(piece, state) != player:
            continue

        for target in get_piece_moves(piece, state):
            actions.append(
                BotAction(
                    type="move_piece",
                    piece_id=piece["id"],
                    target={"row": target["row"], "col": target["col"]},
                )
            )

    for ship in state["ships"]:
        if ship["owner"] != player:
            continue

        for target in get_ship_moves(ship, state):
            actions.append(
                BotAction(
                    type="move_ship",
                    ship_id=ship["id"],
                    target={"row": target["row"], "col": target["col"]},
                )
            )

    if is_traitor_available(state, player):
        enemy = other_player(player)

        for piece in state["pieces"]:
            if piece["kind"] == "hunter" and piece["owner"] == enemy:
                actions.append(BotAction(type="use_traitor", target_hunter_id=piece["id"]))

    return actions


def _search(state: GameState, depth: int, alpha: int, beta: int, bot_player: Player) -> int:
    if state["winner"] or depth == 0:
        return _evaluate_state(state, bot_player, depth)

    current_player = state["currentTurn"]
    legal_actions = get_legal_actions(state, current_player)

    if not legal_actions:
        return _evaluate_state(state, bot_player, depth)

    maximizing = current_player == bot_player
    ranked_children = _rank_children(state, legal_actions, bot_player, reverse=maximizing)

    if maximizing:
        best_score = -_WIN_SCORE * 2

        for _, child_state, _, _ in ranked_children:
            best_score = max(best_score, _search(child_state, depth - 1, alpha, beta, bot_player))
            alpha = max(alpha, best_score)

            if alpha >= beta:
                break

        return best_score

    best_score = _WIN_SCORE * 2

    for _, child_state, _, _ in ranked_children:
        best_score = min(best_score, _search(child_state, depth - 1, alpha, beta, bot_player))
        beta = min(beta, best_score)

        if beta <= alpha:
            break

    return best_score


def _rank_children(
    state: GameState,
    actions: list[BotAction],
    bot_player: Player,
    reverse: bool,
) -> list[tuple[BotAction, GameState, int, int]]:
    ranked_children: list[tuple[BotAction, GameState, int, int]] = []

    for action in actions:
        child_state = apply_bot_action(state, action)
        heuristic_score = _evaluate_state(child_state, bot_player, 0)
        action_priority = _score_action(state, child_state, action, bot_player)
        ranked_children.append((action, child_state, heuristic_score, action_priority))

    ranked_children.sort(key=lambda item: (item[2], item[3]), reverse=reverse)
    return ranked_children


def _evaluate_state(state: GameState, bot_player: Player, depth_remaining: int) -> int:
    opponent = other_player(bot_player)

    if state["winner"] == bot_player:
        return _WIN_SCORE + depth_remaining

    if state["winner"] == opponent:
        return -_WIN_SCORE - depth_remaining

    player_chief = get_chief(state, bot_player)
    opponent_chief = get_chief(state, opponent)
    unclaimed_maces = [mace for mace in state["maces"] if not mace["carriedBy"]]
    dragon = _get_dragon(state)
    score = _material_balance(state, bot_player)
    score += _evaluate_player_plan(
        state,
        bot_player,
        player_chief,
        opponent_chief,
        unclaimed_maces,
        dragon,
    )
    score -= _evaluate_player_plan(
        state,
        opponent,
        opponent_chief,
        player_chief,
        unclaimed_maces,
        dragon,
    )
    return score


def _score_action(
    state: GameState,
    child_state: GameState,
    action: BotAction,
    bot_player: Player,
) -> int:
    opponent = other_player(bot_player)

    if child_state["winner"] == bot_player:
        return _WIN_SCORE

    if child_state["winner"] == opponent:
        return -_WIN_SCORE

    acting_player = state["currentTurn"]
    sign = 1 if acting_player == bot_player else -1
    material_gain = _material_balance(child_state, acting_player) - _material_balance(state, acting_player)
    control_gain = _control_score_for_player(child_state, acting_player) - _control_score_for_player(
        state, acting_player
    )
    progress_delta = _action_progress_delta(state, child_state, action, acting_player)
    priority = sign * (material_gain * 4 + control_gain * 2 + progress_delta)

    if _is_exact_reversal(state, action, acting_player) and material_gain <= 0 and control_gain <= 0:
        priority -= sign * _EXACT_REVERSAL_PENALTY

    if action.type in ("move_piece", "move_ship") and progress_delta <= 0 and material_gain <= 0 and control_gain <= 0:
        priority -= sign * _NEUTRAL_MOVE_PENALTY

    return priority


def _evaluate_player_plan(
    state: GameState,
    player: Player,
    chief: Piece | None,
    enemy_chief: Piece | None,
    unclaimed_maces: list[dict[str, object]],
    dragon: Piece | None,
) -> int:
    hunters = _controlled_pieces(state, player, ("hunter", "traitor"))
    enemy_hunters = _controlled_pieces(state, other_player(player), ("hunter", "traitor"))
    mace_carriers = [piece for piece in hunters if piece["carriesMace"]]
    score = 0

    if chief and dragon and state["dragonController"] is None:
        score += _distance_reward(_manhattan_distance(chief["position"], dragon["position"]), 18, 14)

    if chief and state["traitorTokenPosition"]:
        score += _distance_reward(
            _manhattan_distance(chief["position"], state["traitorTokenPosition"]),
            18,
            12,
        )

    score += _chief_route_support_score_for_player(state, player)

    if state["dragonController"] == player:
        score += _DRAGON_CONTROL_VALUE

        if dragon and enemy_hunters:
            nearest_enemy = min(
                _manhattan_distance(dragon["position"], enemy_piece["position"])
                for enemy_piece in enemy_hunters
            )
            score += _distance_reward(nearest_enemy, 12, 10)

    if state["traitorClaimedBy"] == player:
        score += _TRAITOR_CLAIM_VALUE

    if is_traitor_available(state, player):
        score += _TRAITOR_READY_VALUE

    score += len(mace_carriers) * _MACE_CARRIER_VALUE
    score += _hunter_route_support_score_for_player(state, player)

    if mace_carriers and enemy_chief:
        best_attack = min(
            _manhattan_distance(piece["position"], enemy_chief["position"])
            for piece in mace_carriers
        )
        score += _distance_reward(best_attack, 20, 18)
    elif hunters and unclaimed_maces:
        best_mace_race = min(
            _manhattan_distance(piece["position"], mace["position"])
            for piece in hunters
            for mace in unclaimed_maces
        )
        score += _distance_reward(best_mace_race, 14, 14)

    for piece in hunters:
        score += _forward_progress(piece["position"], player) * 5

    if chief:
        score += _forward_progress(chief["position"], player) * 3

    if hunters and enemy_chief:
        closest_hunter_to_chief = min(
            _manhattan_distance(piece["position"], enemy_chief["position"])
            for piece in hunters
        )
        score += _distance_reward(closest_hunter_to_chief, 16, 4)

    if hunters and enemy_hunters:
        closest_engagement = min(
            _manhattan_distance(piece["position"], enemy_piece["position"])
            for piece in hunters
            for enemy_piece in enemy_hunters
        )
        score += _distance_reward(closest_engagement, 10, 5)

    return score


def _material_balance(state: GameState, player: Player) -> int:
    opponent = other_player(player)
    score = 0

    for piece in state["pieces"]:
        controller = get_piece_controller(piece, state)

        if controller == player:
            score += _piece_value(piece["kind"], piece["carriesMace"])
        elif controller == opponent:
            score -= _piece_value(piece["kind"], piece["carriesMace"])

    for ship in state["ships"]:
        score += _SHIP_CONTROL_VALUE if ship["owner"] == player else -_SHIP_CONTROL_VALUE

    return score


def _control_score_for_player(state: GameState, player: Player) -> int:
    mace_carriers = [
        piece
        for piece in _controlled_pieces(state, player, ("hunter", "traitor"))
        if piece["carriesMace"]
    ]
    score = len(mace_carriers) * _MACE_CARRIER_VALUE

    if state["dragonController"] == player:
        score += _DRAGON_CONTROL_VALUE

    if state["traitorClaimedBy"] == player:
        score += _TRAITOR_CLAIM_VALUE

    if is_traitor_available(state, player):
        score += _TRAITOR_READY_VALUE

    return score


def _action_progress_delta(
    state: GameState,
    child_state: GameState,
    action: BotAction,
    acting_player: Player,
) -> int:
    if action.type == "move_piece" and action.piece_id and action.target:
        moved_piece = _get_piece_by_id(state, action.piece_id)

        if not moved_piece:
            return 0

        if moved_piece["kind"] in ("hunter", "traitor"):
            return _hunter_progress_delta(moved_piece, action.target, state, acting_player)

        if moved_piece["kind"] == "chief":
            return _chief_progress_delta(moved_piece, action.target, state, acting_player)

        return _dragon_progress_delta(moved_piece, action.target, state, acting_player)

    if action.type == "move_ship" and action.ship_id:
        ship = next((candidate for candidate in state["ships"] if candidate["id"] == action.ship_id), None)

        if not ship:
            return 0

        if ship["kind"] == "chiefship":
            return (
                _chief_route_support_score_for_player(child_state, acting_player)
                - _chief_route_support_score_for_player(state, acting_player)
            ) * 3

        return (
            _hunter_route_support_score_for_player(child_state, acting_player)
            - _hunter_route_support_score_for_player(state, acting_player)
        ) * 2

    if action.type == "use_traitor" and action.target_hunter_id:
        target_hunter = _get_piece_by_id(state, action.target_hunter_id)

        if not target_hunter:
            return 0

        bonus = 40

        if target_hunter["carriesMace"]:
            bonus += 80

        return bonus

    return 0


def _hunter_progress_delta(
    piece: Piece,
    target: Position,
    state: GameState,
    acting_player: Player,
) -> int:
    enemy_chief = get_chief(state, other_player(acting_player))
    enemy_hunters = _controlled_pieces(state, other_player(acting_player), ("hunter", "traitor"))
    unclaimed_maces = [mace for mace in state["maces"] if not mace["carriedBy"]]
    delta = (_forward_progress(target, acting_player) - _forward_progress(piece["position"], acting_player)) * 5

    if piece["carriesMace"] and enemy_chief:
        delta += (
            _manhattan_distance(piece["position"], enemy_chief["position"])
            - _manhattan_distance(target, enemy_chief["position"])
        ) * 18
    elif unclaimed_maces:
        before = min(_manhattan_distance(piece["position"], mace["position"]) for mace in unclaimed_maces)
        after = min(_manhattan_distance(target, mace["position"]) for mace in unclaimed_maces)
        delta += (before - after) * 14

    if enemy_chief:
        delta += (
            _manhattan_distance(piece["position"], enemy_chief["position"])
            - _manhattan_distance(target, enemy_chief["position"])
        ) * (6 if piece["carriesMace"] else 4)

    if enemy_hunters:
        before = min(_manhattan_distance(piece["position"], enemy_piece["position"]) for enemy_piece in enemy_hunters)
        after = min(_manhattan_distance(target, enemy_piece["position"]) for enemy_piece in enemy_hunters)
        delta += (before - after) * 5

    return delta


def _chief_progress_delta(
    piece: Piece,
    target: Position,
    state: GameState,
    acting_player: Player,
) -> int:
    dragon = _get_dragon(state)
    delta = (_forward_progress(target, acting_player) - _forward_progress(piece["position"], acting_player)) * 3

    if dragon and state["dragonController"] is None:
        delta += (
            _manhattan_distance(piece["position"], dragon["position"])
            - _manhattan_distance(target, dragon["position"])
        ) * 14

    if state["traitorTokenPosition"]:
        delta += (
            _manhattan_distance(piece["position"], state["traitorTokenPosition"])
            - _manhattan_distance(target, state["traitorTokenPosition"])
        ) * 12

    return delta


def _dragon_progress_delta(
    piece: Piece,
    target: Position,
    state: GameState,
    acting_player: Player,
) -> int:
    enemy_hunters = _controlled_pieces(state, other_player(acting_player), ("hunter",))

    if not enemy_hunters:
        return 0

    before = min(_manhattan_distance(piece["position"], enemy_piece["position"]) for enemy_piece in enemy_hunters)
    after = min(_manhattan_distance(target, enemy_piece["position"]) for enemy_piece in enemy_hunters)
    return (before - after) * 12


def _chief_route_support_score_for_player(state: GameState, player: Player) -> int:
    chief = get_chief(state, player)
    dragon = _get_dragon(state)
    route_scores: list[int] = []

    if chief and dragon and state["dragonController"] is None:
        route_scores.append(_route_reward(_chief_plan_steps_to_adjacent(state, player, dragon["position"]), 12, 34))

    if chief and state["traitorTokenPosition"]:
        route_scores.append(
            _route_reward(_chief_plan_steps_to_adjacent(state, player, state["traitorTokenPosition"]), 12, 30)
        )

    if not route_scores:
        return 0

    if len(route_scores) == 1:
        return route_scores[0]

    return max(route_scores) + min(route_scores) // 5


def _hunter_route_support_score_for_player(state: GameState, player: Player) -> int:
    hunters = _controlled_pieces(state, player, ("hunter", "traitor"))

    if not hunters:
        return 0

    enemy_chief = get_chief(state, other_player(player))
    unclaimed_maces = [mace for mace in state["maces"] if not mace["carriedBy"]]
    mace_carriers = [piece for piece in hunters if piece["carriesMace"]]
    score = 0

    if unclaimed_maces and not mace_carriers:
        best_mace_steps = _best_fixed_route_steps_to_square(
            state,
            hunters,
            [mace["position"] for mace in unclaimed_maces],
        )
        score += _route_reward(best_mace_steps, 10, 18)

    if enemy_chief:
        attackers = mace_carriers or hunters
        best_attack_steps = _best_fixed_route_steps_to_adjacent(state, attackers, enemy_chief["position"])
        score += _route_reward(best_attack_steps, 12, 20 if mace_carriers else 12)

    if state["dragonController"] != player and state["traitorClaimedBy"] != player:
        score //= 2

    return score


def _best_fixed_route_steps_to_square(
    state: GameState,
    pieces: list[Piece],
    targets: list[Position],
) -> int | None:
    best_steps: int | None = None

    for piece in pieces:
        for target in targets:
            steps = _fixed_piece_route_steps(state, piece, target, goal_mode="square")

            if steps is None:
                continue

            if best_steps is None or steps < best_steps:
                best_steps = steps

    return best_steps


def _best_fixed_route_steps_to_adjacent(
    state: GameState,
    pieces: list[Piece],
    target: Position,
) -> int | None:
    best_steps: int | None = None

    for piece in pieces:
        steps = _fixed_piece_route_steps(state, piece, target, goal_mode="adjacent")

        if steps is None:
            continue

        if best_steps is None or steps < best_steps:
            best_steps = steps

    return best_steps


def _fixed_piece_route_steps(
    state: GameState,
    piece: Piece,
    target: Position,
    goal_mode: Literal["square", "adjacent"],
) -> int | None:
    blocked_positions = tuple(
        sorted(
            _position_tuple(other_piece["position"])
            for other_piece in state["pieces"]
            if other_piece["id"] != piece["id"]
        )
    )
    bridge_positions = tuple(
        sorted(
            _position_tuple(ship["position"])
            for ship in state["ships"]
            if ship["kind"] == ("chiefship" if piece["kind"] == "chief" else "longship")
        )
    )
    traitor_position = _position_tuple(state["traitorTokenPosition"]) if state["traitorTokenPosition"] else None

    return _cached_fixed_piece_route_steps(
        piece["kind"],
        _position_tuple(piece["position"]),
        blocked_positions,
        bridge_positions,
        traitor_position,
        _position_tuple(target),
        goal_mode,
    )


@lru_cache(maxsize=4096)
def _cached_fixed_piece_route_steps(
    piece_kind: str,
    start: tuple[int, int],
    blocked_positions: tuple[tuple[int, int], ...],
    bridge_positions: tuple[tuple[int, int], ...],
    traitor_position: tuple[int, int] | None,
    target: tuple[int, int],
    goal_mode: Literal["square", "adjacent"],
) -> int | None:
    blocked = set(blocked_positions)
    bridges = set(bridge_positions)
    queue = deque([(start, 0)])
    visited = {start}

    while queue:
        current, steps = queue.popleft()

        if goal_mode == "square":
            if current == target:
                return steps
        elif _tuple_is_adjacent(current, target):
            return steps

        for next_position in _route_moves(piece_kind, current, blocked, bridges, traitor_position):
            if next_position in visited:
                continue
            visited.add(next_position)
            queue.append((next_position, steps + 1))

    return None


def _chief_plan_steps_to_adjacent(state: GameState, player: Player, target: Position) -> int | None:
    chief = get_chief(state, player)

    if not chief:
        return None

    movable_chiefship = next(
        (
            _position_tuple(ship["position"])
            for ship in state["ships"]
            if ship["kind"] == "chiefship" and ship["owner"] == player
        ),
        None,
    )
    static_chiefships = tuple(
        sorted(
            _position_tuple(ship["position"])
            for ship in state["ships"]
            if ship["kind"] == "chiefship" and _position_tuple(ship["position"]) != movable_chiefship
        )
    )
    blocked_ship_positions = tuple(
        sorted(
            _position_tuple(ship["position"])
            for ship in state["ships"]
            if _position_tuple(ship["position"]) != movable_chiefship
        )
    )
    blocked_positions = tuple(
        sorted(
            _position_tuple(piece["position"])
            for piece in state["pieces"]
            if piece["id"] != chief["id"]
        )
    )
    traitor_position = _position_tuple(state["traitorTokenPosition"]) if state["traitorTokenPosition"] else None

    return _cached_chief_plan_steps_to_adjacent(
        _position_tuple(chief["position"]),
        movable_chiefship,
        static_chiefships,
        blocked_ship_positions,
        blocked_positions,
        traitor_position,
        _position_tuple(target),
    )


@lru_cache(maxsize=2048)
def _cached_chief_plan_steps_to_adjacent(
    chief_start: tuple[int, int],
    movable_chiefship: tuple[int, int] | None,
    static_chiefships: tuple[tuple[int, int], ...],
    blocked_ship_positions: tuple[tuple[int, int], ...],
    blocked_positions: tuple[tuple[int, int], ...],
    traitor_position: tuple[int, int] | None,
    target: tuple[int, int],
) -> int | None:
    static_bridges = set(static_chiefships)
    blocked_ships = set(blocked_ship_positions)
    fixed_blocked_positions = set(blocked_positions)
    queue = deque([((chief_start, movable_chiefship), 0)])
    visited = {(chief_start, movable_chiefship)}

    while queue:
        (chief_position, chiefship_position), steps = queue.popleft()

        if _tuple_is_adjacent(chief_position, target):
            return steps

        bridge_positions = set(static_bridges)
        if chiefship_position is not None:
            bridge_positions.add(chiefship_position)

        for next_chief_position in _route_moves(
            "chief",
            chief_position,
            fixed_blocked_positions,
            bridge_positions,
            traitor_position,
        ):
            next_state = (next_chief_position, chiefship_position)
            if next_state in visited:
                continue
            visited.add(next_state)
            queue.append((next_state, steps + 1))

        if chiefship_position is None or chief_position == chiefship_position:
            continue

        dynamic_blocked_positions = set(fixed_blocked_positions)
        dynamic_blocked_positions.add(chief_position)

        for next_chiefship_position in _ship_route_moves(
            chiefship_position,
            dynamic_blocked_positions,
            blocked_ships,
        ):
            next_state = (chief_position, next_chiefship_position)
            if next_state in visited:
                continue
            visited.add(next_state)
            queue.append((next_state, steps + 1))

    return None


def _route_moves(
    piece_kind: str,
    start: tuple[int, int],
    blocked_positions: set[tuple[int, int]],
    bridge_positions: set[tuple[int, int]],
    traitor_position: tuple[int, int] | None,
) -> list[tuple[int, int]]:
    moves: list[tuple[int, int]] = []

    if piece_kind in ("hunter", "traitor"):
        for direction in CARDINAL_DIRECTIONS:
            distance = 1

            while True:
                row = start[0] + direction["row"] * distance
                col = start[1] + direction["col"] * distance
                position = (row, col)

                if not is_in_bounds(row, col):
                    break

                if position == traitor_position or position in blocked_positions:
                    break

                if terrain_map[row][col] == "water" and position not in bridge_positions:
                    break

                moves.append(position)
                distance += 1

        return moves

    if piece_kind != "chief":
        return moves

    for direction in CARDINAL_DIRECTIONS:
        for distance in range(1, 3):
            row = start[0] + direction["row"] * distance
            col = start[1] + direction["col"] * distance
            position = (row, col)

            if not is_in_bounds(row, col):
                break

            if position == traitor_position or position in blocked_positions:
                break

            if terrain_map[row][col] == "water" and position not in bridge_positions:
                break

            moves.append(position)

    return moves


def _ship_route_moves(
    start: tuple[int, int],
    blocked_piece_positions: set[tuple[int, int]],
    blocked_ship_positions: set[tuple[int, int]],
) -> list[tuple[int, int]]:
    moves: list[tuple[int, int]] = []

    for direction in CARDINAL_DIRECTIONS:
        distance = 1

        while True:
            row = start[0] + direction["row"] * distance
            col = start[1] + direction["col"] * distance
            position = (row, col)

            if not is_in_bounds(row, col):
                break

            if terrain_map[row][col] != "water":
                break

            if position in blocked_piece_positions or position in blocked_ship_positions:
                break

            moves.append(position)
            distance += 1

    return moves


def _route_reward(steps: int | None, horizon: int, value_per_step: int) -> int:
    if steps is None:
        return 0

    return max(0, horizon - steps) * value_per_step


def _tuple_is_adjacent(first: tuple[int, int], second: tuple[int, int]) -> bool:
    return max(abs(first[0] - second[0]), abs(first[1] - second[1])) == 1


def _position_tuple(position: Position | None) -> tuple[int, int] | None:
    if position is None:
        return None

    return position["row"], position["col"]


def _is_exact_reversal(state: GameState, action: BotAction, acting_player: Player) -> bool:
    if action.type not in ("move_piece", "move_ship") or not action.target:
        return False

    recent_action = _last_action_for_player(state, acting_player)

    if not recent_action or recent_action["type"] != action.type:
        return False

    subject_id = action.piece_id if action.type == "move_piece" else action.ship_id

    if (
        not subject_id
        or recent_action["subjectId"] != subject_id
        or recent_action["fromPosition"] is None
        or recent_action["toPosition"] is None
    ):
        return False

    current_position = _action_subject_position(state, action)

    if current_position is None:
        return False

    return positions_match(current_position, recent_action["toPosition"]) and positions_match(
        action.target,
        recent_action["fromPosition"],
    )


def _action_subject_position(state: GameState, action: BotAction) -> Position | None:
    if action.type == "move_piece" and action.piece_id:
        piece = _get_piece_by_id(state, action.piece_id)
        return piece["position"] if piece else None

    if action.type == "move_ship" and action.ship_id:
        ship = next((candidate for candidate in state["ships"] if candidate["id"] == action.ship_id), None)
        return ship["position"] if ship else None

    return None


def _last_action_for_player(state: GameState, player: Player):
    for action in reversed(state["recentActions"]):
        if action["player"] == player:
            return action

    return None


def _controlled_pieces(
    state: GameState,
    player: Player,
    kinds: tuple[str, ...],
) -> list[Piece]:
    return [
        piece
        for piece in state["pieces"]
        if piece["kind"] in kinds and get_piece_controller(piece, state) == player
    ]


def _get_piece_by_id(state: GameState, piece_id: str) -> Piece | None:
    return next((piece for piece in state["pieces"] if piece["id"] == piece_id), None)


def _get_dragon(state: GameState) -> Piece | None:
    return next((piece for piece in state["pieces"] if piece["kind"] == "dragon"), None)


def _distance_reward(distance: int, reach: int, value_per_step: int) -> int:
    return max(0, reach - distance) * value_per_step


def _forward_progress(position: Position, player: Player) -> int:
    return position["row"] if player == "marauders" else 12 - position["row"]


def _piece_value(kind: str, carries_mace: bool) -> int:
    if kind == "hunter":
        return 100 + (80 if carries_mace else 0)

    if kind == "traitor":
        return 150 + (80 if carries_mace else 0)

    if kind == "dragon":
        return 170

    return 0


def _manhattan_distance(first: Position, second: Position) -> int:
    return abs(first["row"] - second["row"]) + abs(first["col"] - second["col"])



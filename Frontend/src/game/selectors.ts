import { PLAYER_LABELS } from "./constants.ts";
import type {
  GameState,
  Piece,
  Player,
  PlayerStats,
  Position,
  Ship,
  ShipKind,
} from "./types.ts";
import { positionsMatch } from "./utils.ts";

export const getShipFootprint = (
  _kind: ShipKind,
  position: Position
): Position[] => [position];

export const getPieceController = (
  piece: Piece,
  state: GameState
): Player | null => {
  if (piece.kind === "dragon") {
    return state.dragonController;
  }

  return piece.owner;
};

export const getPieceAt = (state: GameState, position: Position) =>
  state.pieces.find((piece) => positionsMatch(piece.position, position));

export const getShipAt = (
  state: GameState,
  position: Position,
  excludedId?: string
) =>
  state.ships.find(
    (ship) =>
      ship.id !== excludedId &&
      getShipFootprint(ship.kind, ship.position).some((cell) =>
        positionsMatch(cell, position)
      )
  );

export const getGroundMaceAt = (state: GameState, position: Position) =>
  state.maces.find(
    (mace) => !mace.carriedBy && positionsMatch(mace.position, position)
  );

export const hasTraitorToken = (state: GameState, position: Position) =>
  state.traitorTokenPosition !== null &&
  positionsMatch(state.traitorTokenPosition, position);

export const getChief = (state: GameState, owner: Player) =>
  state.pieces.find((piece) => piece.kind === "chief" && piece.owner === owner);

export const getPieceControllerAt = (
  state: GameState,
  position: Position
): Player | null => {
  const piece = getPieceAt(state, position);

  return piece ? getPieceController(piece, state) : null;
};

export const isSelectablePiece = (piece: Piece, state: GameState) =>
  !state.winner && getPieceController(piece, state) === state.currentTurn;

export const isSelectableShip = (ship: Ship, state: GameState) =>
  !state.winner && ship.owner === state.currentTurn;

export const canBeSandwichCaptured = (piece: Piece) =>
  piece.kind === "hunter" || piece.kind === "traitor";

export const getPieceMarker = (piece: Piece) => {
  switch (piece.kind) {
    case "hunter":
      return "H";
    case "chief":
      return "C";
    case "dragon":
      return "D";
    case "traitor":
      return "T";
  }
};

export const getPieceRoleLabel = (piece: Pick<Piece, "kind">) => {
  switch (piece.kind) {
    case "hunter":
      return "Hunter";
    case "chief":
      return "Chief";
    case "dragon":
      return "Dragon";
    case "traitor":
      return "Traitor";
  }
};

export const getShipRoleLabel = (ship: Pick<Ship, "kind">) =>
  ship.kind === "longship" ? "Longship" : "Chiefship";

export const getPieceLabel = (piece: Piece, state: GameState) => {
  const controller = getPieceController(piece, state);

  if (piece.kind === "dragon") {
    return controller ? `${PLAYER_LABELS[controller]} Dragon` : "Dragon";
  }

  if (piece.owner) {
    return `${PLAYER_LABELS[piece.owner]} ${getPieceRoleLabel(piece)}`;
  }

  return getPieceRoleLabel(piece);
};

export const getShipLabel = (ship: Ship) =>
  `${PLAYER_LABELS[ship.owner]} ${getShipRoleLabel(ship)}`;

export const getPlayerStats = (
  state: GameState,
  player: Player
): PlayerStats => ({
  hunters: state.pieces.filter(
    (piece) => piece.kind === "hunter" && piece.owner === player
  ).length,
  maceBearers: state.pieces.filter(
    (piece) => piece.owner === player && piece.carriesMace
  ).length,
  hasTraitorPiece: state.pieces.some(
    (piece) => piece.kind === "traitor" && piece.owner === player
  ),
});

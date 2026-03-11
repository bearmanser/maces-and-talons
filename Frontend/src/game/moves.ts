import { CARDINAL_DIRECTIONS, terrainMap } from "./constants.ts";
import {
  getPieceAt,
  getPieceController,
  getShipAt,
  getShipFootprint,
  hasTraitorToken,
} from "./selectors.ts";
import type { GameState, Piece, Position, Ship } from "./types.ts";
import { isInBounds, otherPlayer } from "./utils.ts";

export const getHunterStyleMoves = (
  piece: Piece,
  state: GameState
): Position[] => {
  const validMoves: Position[] = [];

  for (const direction of CARDINAL_DIRECTIONS) {
    let distance = 1;

    while (true) {
      const target = {
        row: piece.position.row + direction.row * distance,
        col: piece.position.col + direction.col * distance,
      };

      if (!isInBounds(target.row, target.col)) {
        break;
      }

      if (hasTraitorToken(state, target)) {
        break;
      }

      if (getPieceAt(state, target)) {
        break;
      }

      const ship = getShipAt(state, target);

      if (terrainMap[target.row][target.col] === "water") {
        if (!ship || ship.kind !== "longship") {
          break;
        }
      }

      validMoves.push(target);
      distance += 1;
    }
  }

  return validMoves;
};

export const getChiefMoves = (piece: Piece, state: GameState): Position[] => {
  if (!piece.owner) {
    return [];
  }

  const validMoves: Position[] = [];

  for (const direction of CARDINAL_DIRECTIONS) {
    for (let distance = 1; distance <= 2; distance += 1) {
      const target = {
        row: piece.position.row + direction.row * distance,
        col: piece.position.col + direction.col * distance,
      };

      if (!isInBounds(target.row, target.col)) {
        break;
      }

      if (hasTraitorToken(state, target) || getPieceAt(state, target)) {
        break;
      }

      if (terrainMap[target.row][target.col] === "water") {
        const ship = getShipAt(state, target);

        if (!ship || ship.kind !== "chiefship") {
          break;
        }
      }

      validMoves.push(target);
    }
  }

  return validMoves;
};

const hasAdjacentAlliedPiece = (state: GameState, piece: Piece) =>
  CARDINAL_DIRECTIONS.some((direction) => {
    const neighbor = {
      row: piece.position.row + direction.row,
      col: piece.position.col + direction.col,
    };

    if (!isInBounds(neighbor.row, neighbor.col)) {
      return false;
    }

    const neighborPiece = getPieceAt(state, neighbor);
    return Boolean(
      neighborPiece &&
        neighborPiece.id !== piece.id &&
        getPieceController(neighborPiece, state) === piece.owner
    );
  });

export const getDragonMoves = (piece: Piece, state: GameState): Position[] => {
  const controller = state.dragonController;

  if (!controller) {
    return [];
  }

  const validMoves: Position[] = [];

  for (const direction of CARDINAL_DIRECTIONS) {
    for (let distance = 1; distance <= 3; distance += 1) {
      const target = {
        row: piece.position.row + direction.row * distance,
        col: piece.position.col + direction.col * distance,
      };

      if (!isInBounds(target.row, target.col)) {
        break;
      }

      if (hasTraitorToken(state, target)) {
        continue;
      }

      const targetPiece = getPieceAt(state, target);

      if (!targetPiece) {
        validMoves.push(target);
        continue;
      }

      const targetOwner = getPieceController(targetPiece, state);

      if (targetOwner === controller) {
        continue;
      }

      if (
        targetPiece.kind === "hunter" &&
        targetPiece.owner === otherPlayer(controller) &&
        !hasAdjacentAlliedPiece(state, targetPiece)
      ) {
        validMoves.push(target);
      }

      break;
    }
  }

  return validMoves;
};

export const getPieceMoves = (piece: Piece, state: GameState): Position[] => {
  switch (piece.kind) {
    case "hunter":
    case "traitor":
      return getHunterStyleMoves(piece, state);
    case "chief":
      return getChiefMoves(piece, state);
    case "dragon":
      return getDragonMoves(piece, state);
  }
};

export const getShipMoves = (ship: Ship, state: GameState): Position[] => {
  const occupied = getShipFootprint(ship.kind, ship.position).some((cell) =>
    getPieceAt(state, cell)
  );

  if (occupied) {
    return [];
  }

  const validMoves: Position[] = [];

  for (const direction of CARDINAL_DIRECTIONS) {
    let distance = 1;

    while (true) {
      const target = {
        row: ship.position.row + direction.row * distance,
        col: ship.position.col + direction.col * distance,
      };

      const footprint = getShipFootprint(ship.kind, target);

      const blocked = footprint.some((cell) => {
        if (!isInBounds(cell.row, cell.col)) {
          return true;
        }

        if (terrainMap[cell.row][cell.col] !== "water") {
          return true;
        }

        if (getPieceAt(state, cell)) {
          return true;
        }

        return Boolean(getShipAt(state, cell, ship.id));
      });

      if (blocked) {
        break;
      }

      validMoves.push(target);
      distance += 1;
    }
  }

  return validMoves;
};

import { BOARD_SIZE, COLUMN_LABELS } from "./constants.ts";
import type { Player, Position } from "./types.ts";

export const positionsMatch = (first: Position, second: Position) =>
  first.row === second.row && first.col === second.col;

export const isInBounds = (row: number, col: number) =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export const toPositionKey = (position: Position) =>
  `${position.row}:${position.col}`;

export const otherPlayer = (player: Player): Player =>
  player === "marauders" ? "vikings" : "marauders";

export const isAdjacent = (first: Position, second: Position) =>
  Math.max(
    Math.abs(first.row - second.row),
    Math.abs(first.col - second.col)
  ) === 1;

export const formatSquare = (position: Position) =>
  `${COLUMN_LABELS[position.col]}${position.row + 1}`;

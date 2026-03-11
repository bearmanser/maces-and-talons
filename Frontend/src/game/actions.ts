import { BOARD_SIZE, PLAYER_LABELS } from "./constants.ts";
import {
  canBeSandwichCaptured,
  getChief,
  getGroundMaceAt,
  getPieceAt,
  getPieceController,
  getPieceControllerAt,
  getPieceLabel,
  getShipAt,
  getShipLabel,
  getShipRoleLabel,
} from "./selectors.ts";
import type { GameState, Piece, Player, Position, Ship } from "./types.ts";
import { formatSquare, isAdjacent, isInBounds, otherPlayer } from "./utils.ts";

const capturePieces = (state: GameState, pieceIds: string[]): GameState => {
  if (pieceIds.length === 0) {
    return state;
  }

  const removed = state.pieces.filter((piece) => pieceIds.includes(piece.id));
  const nextMaces = state.maces.map((mace) => {
    const carrier = removed.find((piece) => piece.id === mace.carriedBy);

    if (!carrier) {
      return mace;
    }

    return {
      ...mace,
      carriedBy: null,
      position: carrier.position,
    };
  });

  return {
    ...state,
    pieces: state.pieces.filter((piece) => !pieceIds.includes(piece.id)),
    maces: nextMaces,
  };
};

const hasLShapeCaptureSupport = (
  state: GameState,
  position: Position,
  owner: Player
) =>
  [
    [
      { row: -1, col: 0 },
      { row: 0, col: -1 },
    ],
    [
      { row: -1, col: 0 },
      { row: 0, col: 1 },
    ],
    [
      { row: 1, col: 0 },
      { row: 0, col: -1 },
    ],
    [
      { row: 1, col: 0 },
      { row: 0, col: 1 },
    ],
  ].some((pair) =>
    pair.every((offset) => {
      const neighbor = {
        row: position.row + offset.row,
        col: position.col + offset.col,
      };

      return (
        isInBounds(neighbor.row, neighbor.col) &&
        getPieceControllerAt(state, neighbor) === owner
      );
    })
  );

const applySandwichCaptures = (state: GameState) => {
  const capturedIds = new Set<string>();

  for (const owner of ["marauders", "vikings"] as const) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const start = { row, col };

        if (getPieceControllerAt(state, start) !== owner) {
          continue;
        }

        for (const direction of [
          { row: 0, col: 1 },
          { row: 1, col: 0 },
        ]) {
          const line: Piece[] = [];
          let distance = 1;

          while (true) {
            const target = {
              row: start.row + direction.row * distance,
              col: start.col + direction.col * distance,
            };

            if (!isInBounds(target.row, target.col)) {
              break;
            }

            const piece = getPieceAt(state, target);

            if (
              piece &&
              canBeSandwichCaptured(piece) &&
              getPieceController(piece, state) === otherPlayer(owner)
            ) {
              line.push(piece);
              distance += 1;
              continue;
            }

            if (
              line.length > 0 &&
              getPieceControllerAt(state, target) === owner
            ) {
              line.forEach((captured) => capturedIds.add(captured.id));
            }

            break;
          }
        }
      }
    }

    for (const piece of state.pieces) {
      if (
        canBeSandwichCaptured(piece) &&
        getPieceController(piece, state) === otherPlayer(owner) &&
        hasLShapeCaptureSupport(state, piece.position, owner)
      ) {
        capturedIds.add(piece.id);
      }
    }
  }

  const captured = state.pieces.filter((piece) => capturedIds.has(piece.id));

  return {
    state: capturePieces(state, [...capturedIds]),
    captured,
  };
};

const syncCarriedMace = (
  state: GameState,
  pieceId: string,
  position: Position
): GameState => ({
  ...state,
  maces: state.maces.map((mace) =>
    mace.carriedBy === pieceId ? { ...mace, position } : mace
  ),
});

const givePieceGroundMace = (
  state: GameState,
  pieceId: string
): { state: GameState; pickedUp: boolean } => {
  const piece = state.pieces.find((candidate) => candidate.id === pieceId);

  if (!piece || (piece.kind !== "hunter" && piece.kind !== "traitor")) {
    return { state, pickedUp: false };
  }

  if (piece.carriesMace) {
    return {
      state: syncCarriedMace(state, pieceId, piece.position),
      pickedUp: false,
    };
  }

  const groundMace = getGroundMaceAt(state, piece.position);

  if (!groundMace) {
    return { state, pickedUp: false };
  }

  return {
    pickedUp: true,
    state: {
      ...state,
      pieces: state.pieces.map((candidate) =>
        candidate.id === pieceId
          ? { ...candidate, carriesMace: true }
          : candidate
      ),
      maces: state.maces.map((mace) =>
        mace.id === groundMace.id
          ? { ...mace, carriedBy: pieceId, position: piece.position }
          : mace
      ),
    },
  };
};

const claimShipAt = (
  state: GameState,
  position: Position,
  owner: Player
): { state: GameState; claimedShip: Ship | null } => {
  const ship = getShipAt(state, position);

  if (!ship || ship.owner === owner) {
    return { state, claimedShip: null };
  }

  return {
    claimedShip: ship,
    state: {
      ...state,
      ships: state.ships.map((candidate) =>
        candidate.id === ship.id ? { ...candidate, owner } : candidate
      ),
    },
  };
};

const applyChiefClaims = (state: GameState, chief: Piece) => {
  let nextState = state;
  const notes: string[] = [];
  const owner = chief.owner;
  const dragon = state.pieces.find((piece) => piece.kind === "dragon");

  if (
    owner &&
    dragon &&
    isAdjacent(chief.position, dragon.position) &&
    state.dragonController !== owner
  ) {
    nextState = {
      ...nextState,
      dragonController: owner,
    };
    notes.push(`The Dragon now answers to ${PLAYER_LABELS[owner]}.`);
  }

  if (
    owner &&
    nextState.traitorTokenPosition &&
    isAdjacent(chief.position, nextState.traitorTokenPosition)
  ) {
    nextState = {
      ...nextState,
      traitorClaimedBy: owner,
      traitorTokenPosition: null,
    };
    notes.push(`${PLAYER_LABELS[owner]} claimed the Traitor.`);
  }

  return { state: nextState, notes };
};

const checkMaceVictory = (
  state: GameState,
  piece: Piece,
  actingOwner: Player
) => {
  if (
    (piece.kind !== "hunter" && piece.kind !== "traitor") ||
    !piece.carriesMace
  ) {
    return null;
  }

  const enemyChief = getChief(state, otherPlayer(actingOwner));

  if (!enemyChief) {
    return null;
  }

  return isAdjacent(piece.position, enemyChief.position)
    ? `${PLAYER_LABELS[actingOwner]} slew the enemy Chief with a Mace.`
    : null;
};

export const resolvePieceMove = (
  state: GameState,
  pieceId: string,
  target: Position
): GameState => {
  const movingPiece = state.pieces.find((piece) => piece.id === pieceId);

  if (!movingPiece) {
    return state;
  }

  const actingOwner = getPieceController(movingPiece, state);

  if (!actingOwner) {
    return state;
  }

  let nextState = state;
  const notes: string[] = [];

  if (movingPiece.kind === "dragon") {
    const targetPiece = getPieceAt(nextState, target);

    if (
      targetPiece &&
      targetPiece.kind === "hunter" &&
      targetPiece.owner === otherPlayer(actingOwner)
    ) {
      nextState = capturePieces(nextState, [targetPiece.id]);
      notes.push(
        `The Dragon scorched ${
          PLAYER_LABELS[targetPiece.owner]
        } at ${formatSquare(target)}.`
      );
    }
  }

  nextState = {
    ...nextState,
    pieces: nextState.pieces.map((piece) =>
      piece.id === pieceId ? { ...piece, position: target } : piece
    ),
  };

  nextState = syncCarriedMace(nextState, pieceId, target);

  const shipClaimResult = claimShipAt(nextState, target, actingOwner);
  nextState = shipClaimResult.state;

  if (shipClaimResult.claimedShip) {
    notes.push(
      `${PLAYER_LABELS[actingOwner]} seized the ${getShipRoleLabel(
        shipClaimResult.claimedShip
      )} at ${formatSquare(target)}.`
    );
  }

  const pickupResult = givePieceGroundMace(nextState, pieceId);
  nextState = pickupResult.state;

  if (pickupResult.pickedUp) {
    const updatedPiece = nextState.pieces.find((piece) => piece.id === pieceId);

    if (updatedPiece) {
      notes.push(`${getPieceLabel(updatedPiece, nextState)} picked up a Mace.`);
    }
  }

  let updatedPiece = nextState.pieces.find((piece) => piece.id === pieceId);

  if (!updatedPiece) {
    return state;
  }

  if (updatedPiece.kind === "chief") {
    const claimResult = applyChiefClaims(nextState, updatedPiece);
    nextState = claimResult.state;
    notes.push(...claimResult.notes);
    updatedPiece =
      nextState.pieces.find((piece) => piece.id === pieceId) ?? updatedPiece;
  }

  if (updatedPiece.kind === "dragon") {
    const enemyChief = getChief(nextState, otherPlayer(actingOwner));

    if (enemyChief && isAdjacent(updatedPiece.position, enemyChief.position)) {
      nextState = {
        ...nextState,
        dragonController: otherPlayer(actingOwner),
      };
      notes.push(
        `The Dragon shifted its loyalty to ${
          PLAYER_LABELS[otherPlayer(actingOwner)]
        }.`
      );
      updatedPiece =
        nextState.pieces.find((piece) => piece.id === pieceId) ?? updatedPiece;
    }
  }

  const movedPieceLabel = getPieceLabel(updatedPiece, nextState);
  const captureResult = applySandwichCaptures(nextState);
  nextState = captureResult.state;

  if (captureResult.captured.length > 0) {
    notes.push(
      `Sandwich captures removed ${captureResult.captured.length} piece${
        captureResult.captured.length === 1 ? "" : "s"
      }.`
    );
  }

  updatedPiece = nextState.pieces.find((piece) => piece.id === pieceId);

  if (updatedPiece) {
    const victoryText = checkMaceVictory(nextState, updatedPiece, actingOwner);

    if (victoryText) {
      return {
        ...nextState,
        winner: actingOwner,
        status: victoryText,
      };
    }
  }

  return {
    ...nextState,
    currentTurn: otherPlayer(actingOwner),
    status: `${movedPieceLabel} moved to ${formatSquare(target)}.${
      notes.length > 0 ? ` ${notes.join(" ")}` : ""
    }`,
  };
};

export const resolveShipMove = (
  state: GameState,
  shipId: string,
  target: Position
): GameState => {
  const ship = state.ships.find((candidate) => candidate.id === shipId);

  if (!ship) {
    return state;
  }

  let nextState: GameState = {
    ...state,
    ships: state.ships.map((candidate) =>
      candidate.id === shipId ? { ...candidate, position: target } : candidate
    ),
  };

  const movedShip =
    nextState.ships.find((candidate) => candidate.id === shipId) ?? ship;
  const captureResult = applySandwichCaptures(nextState);

  nextState = captureResult.state;

  return {
    ...nextState,
    currentTurn: otherPlayer(ship.owner),
    status: `${getShipLabel(movedShip)} sailed to ${formatSquare(target)}.${
      captureResult.captured.length > 0
        ? ` Sandwich captures removed ${captureResult.captured.length} piece${
            captureResult.captured.length === 1 ? "" : "s"
          }.`
        : ""
    }`,
  };
};

export const resolveTraitorAbility = (
  state: GameState,
  targetHunterId: string
): GameState => {
  const actingOwner = state.currentTurn;
  const targetHunter = state.pieces.find(
    (piece) =>
      piece.id === targetHunterId &&
      piece.kind === "hunter" &&
      piece.owner === otherPlayer(actingOwner)
  );

  if (!targetHunter) {
    return state;
  }

  let nextState: GameState = {
    ...state,
    pieces: state.pieces.map((piece) =>
      piece.id === targetHunterId
        ? {
            id: "traitor-piece",
            kind: "traitor",
            owner: actingOwner,
            position: piece.position,
            carriesMace: piece.carriesMace,
          }
        : piece
    ),
    maces: state.maces.map((mace) =>
      mace.carriedBy === targetHunterId
        ? {
            ...mace,
            carriedBy: "traitor-piece",
            position: targetHunter.position,
          }
        : mace
    ),
    traitorAbilityUsed: {
      ...state.traitorAbilityUsed,
      [actingOwner]: true,
    },
  };

  const captureResult = applySandwichCaptures(nextState);
  nextState = captureResult.state;

  return {
    ...nextState,
    currentTurn: otherPlayer(actingOwner),
    status: `${
      PLAYER_LABELS[actingOwner]
    } activated the Traitor at ${formatSquare(targetHunter.position)}.${
      captureResult.captured.length > 0
        ? ` Sandwich captures removed ${captureResult.captured.length} piece${
            captureResult.captured.length === 1 ? "" : "s"
          }.`
        : ""
    }`,
  };
};

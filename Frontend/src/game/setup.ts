import { HUNTER_COLUMNS } from "./constants.ts";
import type { GameState, Piece } from "./types.ts";

export const createInitialPieces = (): Piece[] => {
  const marauderHunters = HUNTER_COLUMNS.map((col) => ({
    id: `marauders-hunter-${col}`,
    kind: "hunter" as const,
    owner: "marauders" as const,
    position: { row: 0, col },
    carriesMace: false,
  }));

  const vikingHunters = HUNTER_COLUMNS.map((col) => ({
    id: `vikings-hunter-${col}`,
    kind: "hunter" as const,
    owner: "vikings" as const,
    position: { row: 12, col },
    carriesMace: false,
  }));

  return [
    {
      id: "marauders-chief",
      kind: "chief",
      owner: "marauders",
      position: { row: 0, col: 6 },
      carriesMace: false,
    },
    ...marauderHunters,
    {
      id: "dragon",
      kind: "dragon",
      owner: null,
      position: { row: 6, col: 0 },
      carriesMace: false,
    },
    {
      id: "vikings-chief",
      kind: "chief",
      owner: "vikings",
      position: { row: 12, col: 6 },
      carriesMace: false,
    },
    ...vikingHunters,
  ];
};

export const createInitialGameState = (): GameState => ({
  pieces: createInitialPieces(),
  ships: [
    {
      id: "marauders-longship",
      kind: "longship",
      owner: "marauders",
      position: { row: 2, col: 9 },
    },
    {
      id: "marauders-chiefship",
      kind: "chiefship",
      owner: "marauders",
      position: { row: 2, col: 8 },
    },
    {
      id: "vikings-longship",
      kind: "longship",
      owner: "vikings",
      position: { row: 10, col: 3 },
    },
    {
      id: "vikings-chiefship",
      kind: "chiefship",
      owner: "vikings",
      position: { row: 10, col: 4 },
    },
  ],
  maces: [
    { id: "marauders-mace", position: { row: 1, col: 6 }, carriedBy: null },
    { id: "vikings-mace", position: { row: 11, col: 6 }, carriedBy: null },
  ],
  currentTurn: "vikings",
  dragonController: null,
  traitorTokenPosition: { row: 6, col: 12 },
  traitorClaimedBy: null,
  traitorAbilityUsed: { marauders: false, vikings: false },
  winner: null,
  status: "Vikings to move.",
});

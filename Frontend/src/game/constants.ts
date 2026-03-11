import type { Player, Terrain } from "./types.ts";

export const BOARD_SIZE = 13;
export const COLUMN_LABELS = "ABCDEFGHIJKLM".split("");
export const HUNTER_COLUMNS = [2, 3, 4, 5, 7, 8, 9, 10] as const;
export const TERRAIN_ROWS = [
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
] as const;

export const terrainMap: Terrain[][] = TERRAIN_ROWS.map((row) =>
  row.split("").map((cell) => (cell === "W" ? "water" : "land"))
);

export const CARDINAL_DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
] as const;

export const PLAYER_LABELS: Record<Player, string> = {
  marauders: "Marauders",
  vikings: "Vikings",
};

export const PLAYER_COLORS: Record<Player, string> = {
  marauders: "#8f2d18",
  vikings: "#284b63",
};

export const PLAYER_SURFACES: Record<Player, string> = {
  marauders: "rgba(143, 45, 24, 0.14)",
  vikings: "rgba(40, 75, 99, 0.14)",
};

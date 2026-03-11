export type Terrain = "land" | "water";
export type Player = "marauders" | "vikings";
export type PieceKind = "hunter" | "chief" | "dragon" | "traitor";
export type ShipKind = "longship" | "chiefship";

export type Position = {
  row: number;
  col: number;
};

export type Piece = {
  id: string;
  kind: PieceKind;
  owner: Player | null;
  position: Position;
  carriesMace: boolean;
};

export type Ship = {
  id: string;
  kind: ShipKind;
  owner: Player;
  position: Position;
};

export type Mace = {
  id: string;
  position: Position;
  carriedBy: string | null;
};

export type GameState = {
  pieces: Piece[];
  ships: Ship[];
  maces: Mace[];
  currentTurn: Player;
  dragonController: Player | null;
  traitorTokenPosition: Position | null;
  traitorClaimedBy: Player | null;
  traitorAbilityUsed: Record<Player, boolean>;
  winner: Player | null;
  status: string;
};

export type Selection =
  | { type: "piece"; id: string }
  | { type: "ship"; id: string }
  | { type: "traitorAbility" };

export type PlayerStats = {
  hunters: number;
  maceBearers: number;
  hasTraitorPiece: boolean;
};

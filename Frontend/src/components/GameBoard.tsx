import { Box, Grid, Text } from "@chakra-ui/react";
import { COLUMN_LABELS, PLAYER_COLORS, terrainMap } from "../game/constants.ts";
import {
  getGroundMaceAt,
  getPieceAt,
  getPieceController,
  getPieceMarker,
  getShipAt,
  hasTraitorToken,
  isSelectablePiece,
  isSelectableShip,
} from "../game/selectors.ts";
import type { GameState, Selection } from "../game/types.ts";
import { toPositionKey } from "../game/utils.ts";

type GameBoardProps = {
  gameState: GameState;
  selection: Selection | null;
  pieceTargetKeys: Set<string>;
  shipTargetKeys: Set<string>;
  shipFootprintKeys: Set<string>;
  traitorTargetKeys: Set<string>;
  canInteract: boolean;
  onSquareClick: (row: number, col: number) => void;
};

export function GameBoard({
  gameState,
  selection,
  pieceTargetKeys,
  shipTargetKeys,
  shipFootprintKeys,
  traitorTargetKeys,
  canInteract,
  onSquareClick,
}: GameBoardProps) {
  return (
    <Box
      flex={1}
      bg="var(--panel-strong)"
      border="1px solid rgba(219, 189, 131, 0.18)"
      borderRadius="32px"
      p={{ base: 4, md: 6 }}
      boxShadow="0 32px 80px rgba(0, 0, 0, 0.35)"
      overflowX="auto"
    >
      <Box minW="fit-content" mx="auto">
        <Grid
          templateColumns={`36px repeat(${terrainMap.length}, 42px)`}
          gap={2}
          alignItems="center"
        >
          <Box />
          {COLUMN_LABELS.map((label) => (
            <Text
              key={label}
              textAlign="center"
              fontSize="sm"
              fontWeight="700"
              color="rgba(245, 239, 225, 0.72)"
            >
              {label}
            </Text>
          ))}

          {terrainMap.map((terrainRow, rowIndex) => (
            <Box key={`row-${rowIndex}`} display="contents">
              <Text
                textAlign="center"
                fontSize="sm"
                fontWeight="700"
                color="rgba(245, 239, 225, 0.72)"
              >
                {rowIndex + 1}
              </Text>

              {terrainRow.map((terrain, colIndex) => {
                const position = { row: rowIndex, col: colIndex };
                const key = toPositionKey(position);
                const piece = getPieceAt(gameState, position);
                const ship = getShipAt(gameState, position);
                const mace = getGroundMaceAt(gameState, position);
                const hasTraitor = hasTraitorToken(gameState, position);
                const isSelectedPiece =
                  selection?.type === "piece" && piece?.id === selection.id;
                const isSelectedShip =
                  selection?.type === "ship" && ship?.id === selection.id;
                const isPieceTarget = pieceTargetKeys.has(key);
                const isShipTarget = shipTargetKeys.has(key);
                const isShipFootprint = shipFootprintKeys.has(key);
                const isTraitorTarget = traitorTargetKeys.has(key);
                const clickable =
                  canInteract &&
                  !gameState.winner &&
                  (isPieceTarget ||
                    isShipTarget ||
                    isTraitorTarget ||
                    (piece ? isSelectablePiece(piece, gameState) : false) ||
                    (!piece && ship
                      ? isSelectableShip(ship, gameState)
                      : false));

                const pieceOwner = piece
                  ? getPieceController(piece, gameState)
                  : null;
                const pieceColor =
                  piece?.kind === "dragon"
                    ? pieceOwner
                      ? PLAYER_COLORS[pieceOwner]
                      : "#6b572a"
                    : pieceOwner
                    ? PLAYER_COLORS[pieceOwner]
                    : "#5c4a32";

                const cellBorderColor =
                  isSelectedPiece || isSelectedShip
                    ? "var(--highlight)"
                    : isTraitorTarget
                    ? "#f0b66a"
                    : isShipTarget
                    ? "#f5dd63"
                    : isPieceTarget
                    ? "rgba(245, 221, 99, 0.85)"
                    : "rgba(255, 244, 219, 0.12)";

                return (
                  <Box
                    key={key}
                    as="button"
                    onClick={() => onSquareClick(rowIndex, colIndex)}
                    aria-label={`Square ${COLUMN_LABELS[colIndex]}${
                      rowIndex + 1
                    }, ${terrain}`}
                    position="relative"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxSize="42px"
                    borderRadius="14px"
                    border="2px solid"
                    borderColor={cellBorderColor}
                    bg={
                      terrain === "water"
                        ? "linear-gradient(145deg, var(--water-light), var(--water-dark))"
                        : "linear-gradient(145deg, var(--land-light), var(--land-dark))"
                    }
                    cursor={clickable ? "pointer" : "default"}
                    transition="transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease"
                    boxShadow={
                      isSelectedPiece || isSelectedShip
                        ? "0 0 0 3px rgba(245, 221, 99, 0.18), inset 0 0 0 1px rgba(255, 251, 227, 0.3)"
                        : isTraitorTarget
                        ? "0 0 0 3px rgba(240, 182, 106, 0.22)"
                        : isPieceTarget || isShipTarget
                        ? "0 0 0 3px rgba(245, 221, 99, 0.14)"
                        : "inset 0 1px 0 rgba(255, 245, 218, 0.2)"
                    }
                    _hover={
                      clickable
                        ? {
                            transform: "translateY(-1px)",
                            boxShadow: "0 8px 16px rgba(20, 16, 10, 0.2)",
                          }
                        : undefined
                    }
                    _focusVisible={{
                      outline: "3px solid #fff4cf",
                      outlineOffset: "2px",
                    }}
                  >
                    {ship ? (
                      <Box
                        position="absolute"
                        inset="4px"
                        borderRadius={ship.kind === "chiefship" ? "999px" : "10px"}
                        bg={
                          ship.kind === "chiefship"
                            ? `${PLAYER_COLORS[ship.owner]}cc`
                            : `${PLAYER_COLORS[ship.owner]}88`
                        }
                        border="1px solid rgba(247, 239, 219, 0.7)"
                      />
                    ) : null}

                    {isShipFootprint && !ship ? (
                      <Box
                        position="absolute"
                        inset="5px"
                        borderRadius="10px"
                        bg="rgba(245, 221, 99, 0.18)"
                      />
                    ) : null}

                    {isPieceTarget && !piece && !ship ? (
                      <Box
                        position="absolute"
                        boxSize="11px"
                        borderRadius="999px"
                        bg="rgba(255, 247, 196, 0.92)"
                      />
                    ) : null}

                    {isShipTarget ? (
                      <Box
                        position="absolute"
                        boxSize="14px"
                        rotate="45deg"
                        bg="rgba(255, 247, 196, 0.9)"
                        borderRadius="3px"
                      />
                    ) : null}

                    {ship ? (
                      <Text
                        position="absolute"
                        insetInlineStart="5px"
                        insetBlockEnd="3px"
                        fontSize="9px"
                        fontWeight="900"
                        color="#fff6df"
                        zIndex={1}
                      >
                        {ship.kind === "longship" ? "LS" : "CS"}
                      </Text>
                    ) : null}

                    {mace ? (
                      <Box
                        position="absolute"
                        insetInlineEnd="3px"
                        insetBlockEnd="3px"
                        boxSize="13px"
                        borderRadius="4px"
                        bg="#f1ca5e"
                        color="#4e3208"
                        border="1px solid rgba(68, 44, 8, 0.45)"
                        display="grid"
                        placeItems="center"
                        fontSize="9px"
                        fontWeight="900"
                        zIndex={2}
                      >
                        M
                      </Box>
                    ) : null}

                    {hasTraitor ? (
                      <Box
                        position="relative"
                        zIndex={3}
                        display="grid"
                        placeItems="center"
                        boxSize="28px"
                        borderRadius="999px"
                        bg="#2f2418"
                        color="#f3e4c0"
                        border="2px solid #d8bd82"
                        fontWeight="900"
                        fontSize="lg"
                      >
                        ?
                      </Box>
                    ) : null}

                    {piece ? (
                      <Box
                        position="relative"
                        zIndex={4}
                        display="grid"
                        placeItems="center"
                        boxSize={piece.kind === "chief" ? "31px" : "29px"}
                        borderRadius={piece.kind === "chief" ? "10px" : "999px"}
                        bg={pieceColor}
                        color="#fff7e7"
                        fontWeight="900"
                        fontSize="lg"
                        border={
                          piece.kind === "dragon"
                            ? "2px solid #f1ca5e"
                            : "2px solid #f7efdb"
                        }
                        boxShadow="0 10px 18px rgba(50, 17, 8, 0.35)"
                      >
                        {getPieceMarker(piece)}
                        {piece.carriesMace ? (
                          <Box
                            position="absolute"
                            insetInlineEnd="-4px"
                            insetBlockStart="-4px"
                            boxSize="14px"
                            borderRadius="4px"
                            bg="#f1ca5e"
                            color="#4e3208"
                            border="1px solid rgba(68, 44, 8, 0.45)"
                            display="grid"
                            placeItems="center"
                            fontSize="9px"
                            fontWeight="900"
                          >
                            M
                          </Box>
                        ) : null}
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

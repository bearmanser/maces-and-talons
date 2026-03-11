import {
  Box,
  Button,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { BoardNotesCard } from "./components/BoardNotesCard.tsx";
import { GameBoard } from "./components/GameBoard.tsx";
import { PlayerSummaryCard } from "./components/PlayerSummaryCard.tsx";
import { resolvePieceMove, resolveShipMove, resolveTraitorAbility } from "./game/actions.ts";
import {
  PLAYER_COLORS,
  PLAYER_LABELS,
  PLAYER_SURFACES,
} from "./game/constants.ts";
import { getPieceMoves, getShipMoves } from "./game/moves.ts";
import {
  getPieceAt,
  getPieceRoleLabel,
  getPlayerStats,
  getShipAt,
  getShipFootprint,
  isSelectablePiece,
  isSelectableShip,
} from "./game/selectors.ts";
import { createInitialGameState } from "./game/setup.ts";
import type { GameState, Player, Selection } from "./game/types.ts";
import { formatSquare, otherPlayer, toPositionKey } from "./game/utils.ts";

const getSelectionHint = ({
  gameState,
  selection,
  selectedPieceLabel,
  selectedShipKind,
  traitorAvailable,
}: {
  gameState: GameState;
  selection: Selection | null;
  selectedPieceLabel: string | null;
  selectedShipKind: "longship" | "chiefship" | null;
  traitorAvailable: boolean;
}) => {
  if (gameState.winner) {
    return `${
      PLAYER_LABELS[gameState.winner]
    } won the match. Reset to play the setup again.`;
  }

  if (selection?.type === "traitorAbility") {
    return "Choose one enemy Hunter to replace with the Traitor.";
  }

  if (selectedShipKind === "longship") {
    return "Click a highlighted water square to move the Longship.";
  }

  if (selectedShipKind === "chiefship") {
    return "Click a highlighted water square to move the Chiefship.";
  }

  if (selectedPieceLabel) {
    return `Click a highlighted square to move the ${selectedPieceLabel.toLowerCase()}.`;
  }

  if (traitorAvailable) {
    return "You can move a piece, move a ship, or activate the Traitor this turn.";
  }

  return "Select one of your pieces or ships to take a turn.";
};

const getTraitorStatus = (
  player: Player,
  gameState: GameState,
  hasTraitorPiece: boolean
) => {
  if (hasTraitorPiece) {
    return "On the board";
  }

  if (gameState.traitorClaimedBy !== player) {
    return "Unclaimed";
  }

  return gameState.traitorAbilityUsed[player]
    ? "Claimed and spent"
    : "Claimed and ready";
};

function App() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState()
  );
  const [selection, setSelection] = useState<Selection | null>(null);

  const selectedPiece =
    selection?.type === "piece"
      ? gameState.pieces.find((piece) => piece.id === selection.id) ?? null
      : null;

  const selectedShip =
    selection?.type === "ship"
      ? gameState.ships.find((ship) => ship.id === selection.id) ?? null
      : null;

  const pieceTargets = useMemo(
    () => (selectedPiece ? getPieceMoves(selectedPiece, gameState) : []),
    [gameState, selectedPiece]
  );

  const shipTargets = useMemo(
    () => (selectedShip ? getShipMoves(selectedShip, gameState) : []),
    [gameState, selectedShip]
  );

  const traitorTargets = useMemo(
    () =>
      selection?.type === "traitorAbility"
        ? gameState.pieces.filter(
            (piece) =>
              piece.kind === "hunter" &&
              piece.owner === otherPlayer(gameState.currentTurn)
          )
        : [],
    [gameState, selection]
  );

  const pieceTargetKeys = useMemo(
    () => new Set(pieceTargets.map(toPositionKey)),
    [pieceTargets]
  );

  const shipTargetKeys = useMemo(
    () => new Set(shipTargets.map(toPositionKey)),
    [shipTargets]
  );

  const shipFootprintKeys = useMemo(() => {
    if (!selectedShip) {
      return new Set<string>();
    }

    const keys = new Set<string>();

    shipTargets.forEach((target) => {
      getShipFootprint(selectedShip.kind, target).forEach((cell) => {
        keys.add(toPositionKey(cell));
      });
    });

    return keys;
  }, [selectedShip, shipTargets]);

  const traitorTargetMap = useMemo(
    () =>
      new Map(
        traitorTargets.map((piece) => [toPositionKey(piece.position), piece.id])
      ),
    [traitorTargets]
  );

  const traitorTargetKeys = useMemo(
    () => new Set(traitorTargetMap.keys()),
    [traitorTargetMap]
  );

  const traitorAvailable =
    gameState.traitorClaimedBy === gameState.currentTurn &&
    !gameState.traitorAbilityUsed[gameState.currentTurn] &&
    gameState.pieces.some(
      (piece) =>
        piece.kind === "hunter" &&
        piece.owner === otherPlayer(gameState.currentTurn)
    );

  const dragonPiece = gameState.pieces.find((piece) => piece.kind === "dragon");
  const marauderStats = getPlayerStats(gameState, "marauders");
  const vikingStats = getPlayerStats(gameState, "vikings");

  const selectionHint = getSelectionHint({
    gameState,
    selection,
    selectedPieceLabel: selectedPiece ? getPieceRoleLabel(selectedPiece) : null,
    selectedShipKind: selectedShip?.kind ?? null,
    traitorAvailable,
  });

  const handleReset = () => {
    setGameState(createInitialGameState());
    setSelection(null);
  };

  const handleTraitorToggle = () => {
    if (!traitorAvailable) {
      return;
    }

    setSelection((current) =>
      current?.type === "traitorAbility" ? null : { type: "traitorAbility" }
    );
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.winner) {
      return;
    }

    const position = { row, col };
    const positionKey = toPositionKey(position);

    if (selection?.type === "traitorAbility") {
      const targetHunterId = traitorTargetMap.get(positionKey);

      if (targetHunterId) {
        setGameState((current) =>
          resolveTraitorAbility(current, targetHunterId)
        );
        setSelection(null);
        return;
      }
    }

    if (selection?.type === "piece" && pieceTargetKeys.has(positionKey)) {
      setGameState((current) =>
        resolvePieceMove(current, selection.id, position)
      );
      setSelection(null);
      return;
    }

    if (selection?.type === "ship" && shipTargetKeys.has(positionKey)) {
      setGameState((current) => resolveShipMove(current, selection.id, position));
      setSelection(null);
      return;
    }

    const clickedPiece = getPieceAt(gameState, position);
    const clickedShip = clickedPiece ? null : getShipAt(gameState, position);

    if (clickedPiece && isSelectablePiece(clickedPiece, gameState)) {
      setSelection((current) =>
        current?.type === "piece" && current.id === clickedPiece.id
          ? null
          : { type: "piece", id: clickedPiece.id }
      );
      return;
    }

    if (
      !clickedPiece &&
      clickedShip &&
      isSelectableShip(clickedShip, gameState)
    ) {
      setSelection((current) =>
        current?.type === "ship" && current.id === clickedShip.id
          ? null
          : { type: "ship", id: clickedShip.id }
      );
      return;
    }

    setSelection(null);
  };

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #efe3c1 0%, #d8c39a 45%, #8b6a44 100%)"
      color="#1d1a16"
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 10 }}
      css={{
        "--panel-bg": "rgba(244, 236, 213, 0.9)",
        "--panel-border": "rgba(86, 60, 32, 0.28)",
        "--land-light": "#d8ba78",
        "--land-dark": "#b89154",
        "--water-light": "#5d8494",
        "--water-dark": "#2d5565",
        "--highlight": "#f5dd63",
        "--ink-soft": "#4e3b22",
      }}
    >
      <VStack gap={6} maxW="1200px" mx="auto" align="stretch">
        <VStack
          gap={4}
          align="stretch"
          bg="var(--panel-bg)"
          border="1px solid"
          borderColor="var(--panel-border)"
          borderRadius="28px"
          p={{ base: 5, md: 7 }}
          boxShadow="0 22px 50px rgba(58, 34, 11, 0.16)"
          backdropFilter="blur(8px)"
        >
          <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <VStack gap={3} align="start" maxW="760px">
              <Text
                textTransform="uppercase"
                letterSpacing="0.28em"
                fontSize="xs"
                color="#705633"
                fontWeight="700"
              >
                Maces & Talons
              </Text>
              <Heading
                as="h1"
                fontSize={{ base: "3xl", md: "5xl" }}
                lineHeight="1"
                fontFamily="'Palatino Linotype', 'Book Antiqua', serif"
              >
                Opening rules prototype
              </Heading>
              <Text
                maxW="760px"
                fontSize={{ base: "sm", md: "md" }}
                color="var(--ink-soft)"
              >
                The full opening setup is on the board now: Chiefs, Hunters,
                ships, Maces, the Dragon, and the Traitor. Win by moving a
                Mace-bearer adjacent to the enemy Chief.
              </Text>
            </VStack>

            <VStack
              gap={2}
              align="stretch"
              minW={{ base: "100%", md: "260px" }}
              bg={PLAYER_SURFACES[gameState.currentTurn]}
              border="1px solid rgba(86, 60, 32, 0.18)"
              borderRadius="20px"
              p={4}
            >
              <Text
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.18em"
                color="#705633"
              >
                Turn
              </Text>
              <Text
                fontSize="xl"
                fontWeight="800"
                color={PLAYER_COLORS[gameState.currentTurn]}
              >
                {gameState.winner
                  ? `${PLAYER_LABELS[gameState.winner]} Won`
                  : PLAYER_LABELS[gameState.currentTurn]}
              </Text>
              <Text fontSize="sm" color="var(--ink-soft)">
                {gameState.status}
              </Text>
            </VStack>
          </HStack>

          <HStack gap={4} flexWrap="wrap" fontSize="sm" color="var(--ink-soft)">
            <HStack gap={2}>
              <Box boxSize="14px" borderRadius="4px" bg="var(--land-dark)" />
              <Text>Land</Text>
            </HStack>
            <HStack gap={2}>
              <Box boxSize="14px" borderRadius="4px" bg="var(--water-dark)" />
              <Text>Water</Text>
            </HStack>
            <HStack gap={2}>
              <Box
                boxSize="14px"
                borderRadius="4px"
                bg="rgba(143, 45, 24, 0.42)"
              />
              <Text>Ship squares</Text>
            </HStack>
            <HStack gap={2}>
              <Box
                boxSize="14px"
                borderRadius="999px"
                bg="#f1ca5e"
                border="1px solid rgba(68, 44, 8, 0.45)"
              />
              <Text>Mace</Text>
            </HStack>
          </HStack>

          <HStack gap={3} flexWrap="wrap">
            <Button
              onClick={handleTraitorToggle}
              disabled={!traitorAvailable || Boolean(gameState.winner)}
              bg={selection?.type === "traitorAbility" ? "#f0b66a" : "#eedbb3"}
              color="#3b2814"
              border="1px solid rgba(86, 60, 32, 0.2)"
              _hover={{
                bg:
                  selection?.type === "traitorAbility" ? "#ecaa54" : "#e8d0a0",
              }}
            >
              {selection?.type === "traitorAbility"
                ? "Cancel Traitor"
                : "Activate Traitor"}
            </Button>
            <Button
              onClick={handleReset}
              bg="#3f2f21"
              color="#f7ecd7"
              _hover={{ bg: "#2f2217" }}
            >
              Reset Match
            </Button>
            <Text fontSize="sm" color="var(--ink-soft)">
              {selectionHint}
            </Text>
          </HStack>
        </VStack>

        <GameBoard
          gameState={gameState}
          selection={selection}
          pieceTargetKeys={pieceTargetKeys}
          shipTargetKeys={shipTargetKeys}
          shipFootprintKeys={shipFootprintKeys}
          traitorTargetKeys={traitorTargetKeys}
          onSquareClick={handleSquareClick}
        />

        <Stack direction={{ base: "column", lg: "row" }} gap={4} align="stretch">
          <PlayerSummaryCard
            title="Marauders"
            color={PLAYER_COLORS.marauders}
            hunters={marauderStats.hunters}
            maceBearers={marauderStats.maceBearers}
            dragonControlled={gameState.dragonController === "marauders"}
            traitorStatus={getTraitorStatus(
              "marauders",
              gameState,
              marauderStats.hasTraitorPiece
            )}
          />
          <BoardNotesCard
            dragonSquare={dragonPiece ? formatSquare(dragonPiece.position) : "the board"}
            traitorSquare={
              gameState.traitorTokenPosition
                ? formatSquare(gameState.traitorTokenPosition)
                : "a claimed position"
            }
          />
          <PlayerSummaryCard
            title="Vikings"
            color={PLAYER_COLORS.vikings}
            hunters={vikingStats.hunters}
            maceBearers={vikingStats.maceBearers}
            dragonControlled={gameState.dragonController === "vikings"}
            traitorStatus={getTraitorStatus(
              "vikings",
              gameState,
              vikingStats.hasTraitorPiece
            )}
          />
        </Stack>
      </VStack>
    </Box>
  );
}

export default App;

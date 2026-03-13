import { Box, Grid, Stack, Text, VStack } from "@chakra-ui/react";

type CellKind =
  | "empty"
  | "vikingHunter"
  | "marauderHunter"
  | "maceHunter"
  | "vikingChief"
  | "marauderChief"
  | "dragon";

type Example = {
  eyebrow: string;
  title: string;
  description: string;
  result: string;
  board: CellKind[][];
};

type MiniPieceProps = {
  kind: "hunter" | "chief" | "dragon";
  color: string;
  carriesMace?: boolean;
};

const examples: Example[] = [
  {
    eyebrow: "Example One",
    title: "Catch a Hunter",
    description:
      "Put an enemy Hunter or the Traitor between two of your pieces in a straight line. You can also catch them with an L-shaped surround.",
    result: "The trapped piece is removed right away.",
    board: [
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "vikingHunter", "marauderHunter", "vikingHunter", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
    ],
  },
  {
    eyebrow: "Example Two",
    title: "Win by reaching the Chief",
    description:
      "Pick up a mace with a Hunter or the Traitor. If that piece ends its move next to the enemy Chief, you win immediately.",
    result: "Carry the mace in, then finish beside the Chief.",
    board: [
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "maceHunter", "marauderChief", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
    ],
  },
  {
    eyebrow: "Example Three",
    title: "Claim the Dragon, but stay careful",
    description:
      "Move your Chief next to the Dragon to claim it. Then the Dragon can fly up to three spaces and burn isolated enemy Hunters. Be careful: if the enemy Chief gets next to the Dragon, they can take it from you.",
    result: "The Dragon is strong, but it can change sides.",
    board: [
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
      ["empty", "vikingChief", "dragon", "empty", "marauderHunter"],
      ["empty", "empty", "empty", "marauderChief", "empty"],
      ["empty", "empty", "empty", "empty", "empty"],
    ],
  },
];

function MiniPiece({ kind, color, carriesMace = false }: MiniPieceProps) {
  const isChief = kind === "chief";
  const isDragon = kind === "dragon";

  return (
    <Box
      position="relative"
      display="grid"
      placeItems="center"
      boxSize={isChief ? "20px" : "18px"}
      borderRadius={isChief ? "7px" : "999px"}
      bg={color}
      color="#fff7e7"
      fontWeight="900"
      fontSize="11px"
      border={isDragon ? "2px solid #f1ca5e" : "2px solid #f7efdb"}
      boxShadow="0 6px 12px rgba(34, 14, 6, 0.28)"
    >
      {kind === "hunter" ? "H" : kind === "chief" ? "C" : "D"}
      {carriesMace ? (
        <Box
          position="absolute"
          insetInlineEnd="-3px"
          insetBlockStart="-3px"
          boxSize="9px"
          borderRadius="3px"
          bg="#f1ca5e"
          color="#4e3208"
          border="1px solid rgba(68, 44, 8, 0.45)"
          display="grid"
          placeItems="center"
          fontSize="7px"
          fontWeight="900"
        >
          M
        </Box>
      ) : null}
    </Box>
  );
}

function renderMiniPiece(cell: CellKind) {
  switch (cell) {
    case "vikingHunter":
      return <MiniPiece kind="hunter" color="#284b63" />;
    case "marauderHunter":
      return <MiniPiece kind="hunter" color="#8f2d18" />;
    case "maceHunter":
      return <MiniPiece kind="hunter" color="#284b63" carriesMace />;
    case "vikingChief":
      return <MiniPiece kind="chief" color="#284b63" />;
    case "marauderChief":
      return <MiniPiece kind="chief" color="#8f2d18" />;
    case "dragon":
      return <MiniPiece kind="dragon" color="#5c4a32" />;
    default:
      return null;
  }
}

function MiniBoard({ board }: { board: CellKind[][] }) {
  return (
    <Grid templateColumns="repeat(5, 34px)" gap={2} w="fit-content">
      {board.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Box
            key={`${rowIndex}-${colIndex}`}
            boxSize="34px"
            borderRadius="10px"
            bg="linear-gradient(145deg, rgba(177, 139, 83, 0.5), rgba(86, 63, 35, 0.76))"
            border="1px solid rgba(219, 189, 131, 0.16)"
            display="grid"
            placeItems="center"
          >
            {renderMiniPiece(cell)}
          </Box>
        ))
      )}
    </Grid>
  );
}

export function CaptureExamples() {
  return (
    <VStack
      align="stretch"
      gap={5}
      bg="var(--panel-bg)"
      border="1px solid"
      borderColor="var(--panel-border)"
      borderRadius="28px"
      p={{ base: 5, md: 6 }}
    >
      <VStack align="start" gap={2}>
        <Text
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="0.18em"
          color="var(--text-muted)"
          fontWeight="700"
        >
          Capture Playbook
        </Text>
        <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="900">
          Simple examples you can use in a real match
        </Text>
      </VStack>

      <Stack direction={{ base: "column", xl: "row" }} gap={5} align="stretch">
        {examples.map((example) => (
          <VStack
            key={example.title}
            align="stretch"
            gap={4}
            flex={1}
            bg="var(--panel-soft)"
            border="1px solid rgba(219, 189, 131, 0.14)"
            borderRadius="24px"
            p={5}
          >
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.18em"
              color="var(--text-muted)"
              fontWeight="700"
            >
              {example.eyebrow}
            </Text>
            <Text fontSize="xl" fontWeight="800">
              {example.title}
            </Text>
            <MiniBoard board={example.board} />
            <Text color="var(--text-muted)">{example.description}</Text>
            <Text color="#dbc08b" fontWeight="700">
              {example.result}
            </Text>
          </VStack>
        ))}
      </Stack>
    </VStack>
  );
}

import { Text, VStack } from "@chakra-ui/react";

type BoardNotesCardProps = {
  dragonSquare: string;
  traitorSquare: string;
};

export function BoardNotesCard({
  dragonSquare,
  traitorSquare,
}: BoardNotesCardProps) {
  return (
    <VStack
      flex={1.4}
      align="stretch"
      gap={3}
      bg="var(--panel-bg)"
      border="1px solid"
      borderColor="var(--panel-border)"
      borderRadius="24px"
      p={5}
    >
      <Text
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.18em"
        color="#705633"
      >
        Board Notes
      </Text>
      <Text fontSize="sm" color="var(--ink-soft)">
        Hunters and the Traitor move like rooks, Chiefs move up to two squares
        orthogonally, and the Dragon moves up to three squares horizontally or
        vertically.
      </Text>
      <Text fontSize="sm" color="var(--ink-soft)">
        Longships and Chiefships move only on water, and every ship now
        occupies one square. Hunters may cross water only on Longships, while
        Chiefs may stand on water only by using a Chiefship. Moving onto an
        enemy ship seizes it for your side.
      </Text>
      <Text fontSize="sm" color="var(--ink-soft)">
        The Dragon starts on {dragonSquare}. The Traitor begins at {traitorSquare}.
      </Text>
      <Text fontSize="sm" color="var(--ink-soft)">
        Sandwich captures remove Hunters and the Traitor in continuous
        horizontal or vertical lines between two enemy-controlled pieces, and
        those same pieces can also capture with an orthogonal L shape.
      </Text>
    </VStack>
  );
}

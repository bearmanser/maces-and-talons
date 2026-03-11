import { Text, VStack } from "@chakra-ui/react";

type PlayerSummaryCardProps = {
  title: string;
  color: string;
  hunters: number;
  maceBearers: number;
  dragonControlled: boolean;
  traitorStatus: string;
};

export function PlayerSummaryCard({
  title,
  color,
  hunters,
  maceBearers,
  dragonControlled,
  traitorStatus,
}: PlayerSummaryCardProps) {
  return (
    <VStack
      flex={1}
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
        {title}
      </Text>
      <Text fontSize="2xl" fontWeight="800" color={color}>
        Hunters: {hunters}
      </Text>
      <Text fontSize="sm" color="var(--ink-soft)">
        Mace bearers: {maceBearers}
      </Text>
      <Text fontSize="sm" color="var(--ink-soft)">
        Dragon control: {dragonControlled ? "Yes" : "No"}
      </Text>
      <Text fontSize="sm" color="var(--ink-soft)">
        Traitor: {traitorStatus}
      </Text>
    </VStack>
  );
}

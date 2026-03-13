import { Heading, Stack, Text, VStack } from "@chakra-ui/react";

export function RulesSummaryCard() {
  return (
    <VStack
      align="stretch"
      gap={4}
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
          Battle Guide
        </Text>
        <Heading
          as="h2"
          fontSize={{ base: "2xl", md: "3xl" }}
          fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
        >
          The goal is simple: grab power, protect your Chief, and strike first
        </Heading>
      </VStack>

      <Stack direction={{ base: "column", lg: "row" }} gap={5}>
        <VStack
          align="stretch"
          gap={2}
          flex={1}
          bg="var(--panel-soft)"
          borderRadius="20px"
          p={4}
        >
          <Text fontWeight="800">How to win</Text>
          <Text color="var(--text-muted)">
            Pick up a mace with a Hunter or the Traitor, then get next to the
            enemy Chief.
          </Text>
        </VStack>

        <VStack
          align="stretch"
          gap={2}
          flex={1}
          bg="var(--panel-soft)"
          borderRadius="20px"
          p={4}
        >
          <Text fontWeight="800">How pieces move</Text>
          <Text color="var(--text-muted)">
            Hunters and the Traitor move in straight lines, Chiefs move up to
            two spaces, and ships only travel on water.
          </Text>
        </VStack>

        <VStack
          align="stretch"
          gap={2}
          flex={1}
          bg="var(--panel-soft)"
          borderRadius="20px"
          p={4}
        >
          <Text fontWeight="800">Big swing turns</Text>
          <Text color="var(--text-muted)">
            Trap enemy Hunters, claim the Traitor token, and use your Chief to
            take control of the Dragon.
          </Text>
        </VStack>
      </Stack>
    </VStack>
  );
}

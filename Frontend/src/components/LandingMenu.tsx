import { Button, Heading, Stack, Text, VStack } from "@chakra-ui/react";

type LandingMenuProps = {
  onPlaySolo: () => void;
  onPlayBot: () => void;
  onPlayMultiplayer: () => void;
};

type ModeCard = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  accent: string;
  onClick: () => void;
};

export function LandingMenu({
  onPlaySolo,
  onPlayBot,
  onPlayMultiplayer,
}: LandingMenuProps) {
  const modeCards: ModeCard[] = [
    {
      eyebrow: "Solo",
      title: "Play Solo",
      description: "Start right away and play both sides on the same board.",
      cta: "Begin Solo Match",
      accent: "rgba(121, 97, 63, 0.22)",
      onClick: onPlaySolo,
    },
    {
      eyebrow: "Bot",
      title: "Play The Bot",
      description:
        "Choose how tough you want the fight to be, then face the computer.",
      cta: "Choose Difficulty",
      accent: "rgba(120, 78, 54, 0.24)",
      onClick: onPlayBot,
    },
    {
      eyebrow: "Multiplayer",
      title: "Play Together",
      description:
        "Open a waiting room, share the link, and wait for the other player to join.",
      cta: "Open Waiting Room",
      accent: "rgba(96, 108, 114, 0.2)",
      onClick: onPlayMultiplayer,
    },
  ];

  return (
    <VStack
      maxW="1180px"
      mx="auto"
      minH="calc(100vh - 96px)"
      justify="center"
      align="stretch"
      gap={{ base: 8, md: 10 }}
    >
      <VStack gap={4} textAlign="center">
        <Text
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="0.34em"
          color="var(--text-muted)"
          fontWeight="700"
        >
          Gather At The War Table
        </Text>
        <Heading
          as="h1"
          fontSize={{ base: "5xl", md: "7xl", xl: "8xl" }}
          lineHeight="0.95"
          fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
          textAlign="center"
          textShadow="0 10px 30px rgba(0, 0, 0, 0.28)"
        >
          Maces & Talons
        </Heading>
      </VStack>

      <Stack direction={{ base: "column", lg: "row" }} gap={5} align="stretch">
        {modeCards.map((card) => (
          <VStack
            key={card.title}
            align="stretch"
            gap={5}
            flex={1}
            bg="var(--panel-strong)"
            border="1px solid"
            borderColor="var(--panel-border)"
            borderRadius="30px"
            p={{ base: 6, md: 7 }}
            boxShadow="0 30px 70px rgba(0, 0, 0, 0.28)"
            position="relative"
            overflow="hidden"
          >
            <VStack
              align="stretch"
              gap={4}
              position="relative"
              zIndex={1}
              flex={1}
            >
              <Text
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.22em"
                color="var(--text-muted)"
                fontWeight="700"
              >
                {card.eyebrow}
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
              >
                {card.title}
              </Heading>
              <Text color="var(--text-muted)" flex={1} fontSize="md">
                {card.description}
              </Text>
            </VStack>

            <Button
              onClick={card.onClick}
              bg="#dbc08b"
              color="#18120d"
              fontWeight="800"
              borderRadius="16px"
              _hover={{ bg: "#e7cc97" }}
            >
              {card.cta}
            </Button>

            <VStack
              position="absolute"
              inset="auto -56px -56px auto"
              boxSize="220px"
              borderRadius="999px"
              bg={card.accent}
              filter="blur(20px)"
              pointerEvents="none"
            />
          </VStack>
        ))}
      </Stack>

      <VStack
        align="stretch"
        gap={3}
        bg="var(--panel-bg)"
        border="1px solid"
        borderColor="var(--panel-border)"
        borderRadius="24px"
        p={{ base: 5, md: 6 }}
      >
        <Text
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="0.2em"
          color="var(--text-muted)"
          fontWeight="700"
        >
          Before You Start
        </Text>
        <Text color="var(--text-muted)">
          Hunters move in straight lines, Chiefs move up to two spaces, ships
          travel on water, and maces turn a good attack into a winning one.
        </Text>
      </VStack>
    </VStack>
  );
}

import { Box, Button, Heading, Stack, Text, VStack } from "@chakra-ui/react";
import type { BotDifficulty } from "../multiplayer.ts";

type DifficultyOption = {
  value: BotDifficulty;
  label: string;
  description: string;
};

type BotSetupScreenProps = {
  difficulty: BotDifficulty;
  options: DifficultyOption[];
  busy: boolean;
  error: string | null;
  onSelectDifficulty: (difficulty: BotDifficulty) => void;
  onStart: () => void;
  onBack: () => void;
};

export function BotSetupScreen({
  difficulty,
  options,
  busy,
  error,
  onSelectDifficulty,
  onStart,
  onBack,
}: BotSetupScreenProps) {
  const selectedOption =
    options.find((option) => option.value === difficulty) ?? options[0];

  return (
    <VStack maxW="1080px" mx="auto" align="stretch" gap={6}>
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "start", md: "end" }}
        gap={4}
      >
        <VStack align="start" gap={3} maxW="680px">
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.24em"
            color="var(--text-muted)"
            fontWeight="700"
          >
            Bot Match
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: "3xl", md: "5xl" }}
            lineHeight="1"
            fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
          >
            Choose the bot's strength
          </Heading>
          <Text color="var(--text-muted)" fontSize={{ base: "md", md: "lg" }}>
            Pick how hard you want the fight to be, then start the match.
          </Text>
        </VStack>

        <Button
          onClick={onBack}
          bg="var(--button-ghost)"
          color="#f5efe1"
          border="1px solid rgba(219, 189, 131, 0.2)"
          _hover={{ bg: "var(--button-ghost-hover)" }}
        >
          Back To Menu
        </Button>
      </Stack>

      <Stack direction={{ base: "column", lg: "row" }} gap={5} align="stretch">
        {options.map((option) => {
          const selected = option.value === difficulty;

          return (
            <Box
              key={option.value}
              as="button"
              onClick={() => onSelectDifficulty(option.value)}
              aria-pressed={selected}
              textAlign="left"
              flex={1}
              p={{ base: 5, md: 6 }}
              borderRadius="28px"
              border="1px solid"
              borderColor={selected ? "#dbc08b" : "var(--panel-border)"}
              bg={
                selected
                  ? "linear-gradient(180deg, rgba(159, 124, 73, 0.26) 0%, rgba(24, 15, 10, 0.98) 100%)"
                  : "var(--panel-strong)"
              }
              boxShadow={
                selected
                  ? "0 24px 60px rgba(0, 0, 0, 0.32)"
                  : "0 20px 40px rgba(0, 0, 0, 0.18)"
              }
              transition="transform 120ms ease, border-color 120ms ease"
              _hover={{ transform: "translateY(-2px)" }}
            >
              <VStack align="stretch" gap={4}>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.2em"
                  color="var(--text-muted)"
                  fontWeight="700"
                >
                  Difficulty
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl" }}
                  fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
                >
                  {option.label}
                </Heading>
                <Text color="var(--text-muted)">{option.description}</Text>
              </VStack>
            </Box>
          );
        })}
      </Stack>

      <Stack
        direction={{ base: "column", lg: "row" }}
        gap={4}
        align={{ base: "stretch", lg: "center" }}
        justify="space-between"
        bg="var(--panel-bg)"
        border="1px solid"
        borderColor="var(--panel-border)"
        borderRadius="24px"
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
            Selected Match
          </Text>
          <Text fontSize="xl" fontWeight="800">
            {selectedOption.label}
          </Text>
          <Text color="var(--text-muted)">{selectedOption.description}</Text>
        </VStack>

        <Button
          onClick={onStart}
          disabled={busy}
          bg="#dbc08b"
          color="#18120d"
          fontWeight="800"
          borderRadius="16px"
          _hover={{ bg: "#e7cc97" }}
        >
          {busy ? "Preparing Match..." : "Start Bot Match"}
        </Button>
      </Stack>

      {error ? (
        <Text color="#ffb39a" fontSize="sm">
          {error}
        </Text>
      ) : null}
    </VStack>
  );
}

import { Button, HStack, Text, VStack } from "@chakra-ui/react";

type TraitorPanelProps = {
  modeLabel: string;
  turnLabel: string;
  connectionLabel: string | null;
  matchStatus: string;
  selectionHint: string;
  traitorStatus: string;
  traitorDescription: string;
  traitorInstruction: string;
  traitorButtonLabel: string;
  traitorButtonDisabled: boolean;
  traitorButtonActive: boolean;
  onTraitorToggle: () => void;
};

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <VStack
      align="stretch"
      gap={1}
      bg="var(--panel-soft)"
      borderRadius="18px"
      p={3}
    >
      <Text
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.16em"
        color="var(--text-muted)"
        fontWeight="700"
      >
        {label}
      </Text>
      <Text color="#f5efe1">{value}</Text>
    </VStack>
  );
}

export function TraitorPanel({
  modeLabel,
  turnLabel,
  connectionLabel,
  matchStatus,
  selectionHint,
  traitorStatus,
  traitorDescription,
  traitorInstruction,
  traitorButtonLabel,
  traitorButtonDisabled,
  traitorButtonActive,
  onTraitorToggle,
}: TraitorPanelProps) {
  return (
    <VStack
      align="stretch"
      justify="space-between"
      gap={5}
      w={{ base: "100%", xl: "340px" }}
      h="100%"
      bg="var(--panel-strong)"
      border="1px solid"
      borderColor="var(--panel-border)"
      borderRadius="32px"
      p={{ base: 5, md: 6 }}
      boxShadow="0 26px 60px rgba(0, 0, 0, 0.28)"
    >
      <VStack align="stretch" gap={5}>
        <VStack align="start" gap={2}>
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="var(--text-muted)"
            fontWeight="700"
          >
            Traitor Ability
          </Text>
          <Text fontSize="2xl" fontWeight="900">
            {traitorStatus}
          </Text>
          <Text color="var(--text-muted)">{traitorDescription}</Text>
        </VStack>

        <Button
          onClick={onTraitorToggle}
          disabled={traitorButtonDisabled}
          bg={traitorButtonActive ? "#e7cc97" : "#dbc08b"}
          color="#18120d"
          fontWeight="800"
          borderRadius="16px"
          _hover={{ bg: "#f0d7a7" }}
        >
          {traitorButtonLabel}
        </Button>

        <Text color="var(--text-muted)">{traitorInstruction}</Text>
      </VStack>

      <VStack align="stretch" gap={3}>
        <InfoRow label="Match" value={modeLabel} />
        <InfoRow label="Turn" value={turnLabel} />
        {connectionLabel ? (
          <InfoRow label="Connection" value={connectionLabel} />
        ) : null}
        <InfoRow label="Board Status" value={matchStatus} />
        <InfoRow label="Next Action" value={selectionHint} />
        <HStack
          gap={3}
          p={3}
          borderRadius="18px"
          bg="rgba(216, 180, 111, 0.08)"
          border="1px solid rgba(219, 189, 131, 0.12)"
        >
          <Text fontSize="sm" color="var(--text-muted)">
            Claim the token with a Chief, then turn one enemy Hunter into the
            Traitor for a sudden swing in your favor.
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
}

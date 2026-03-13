import { Box, Button, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react";

type MultiplayerWaitingRoomProps = {
  roomId: string | null;
  joinLink: string | null;
  seatLabel: string | null;
  connectionLabel: string;
  roomReady: boolean;
  vikingsSeatStatus: string;
  maraudersSeatStatus: string;
  canJoinRoom: boolean;
  busy: boolean;
  error: string | null;
  notice: string | null;
  onCopyLink: () => void;
  onJoinRoom: () => void;
  onCreateRoom: () => void;
  onBackToMenu: () => void;
};

type SeatCardProps = {
  title: string;
  status: string;
  accent: string;
};

function SeatCard({ title, status, accent }: SeatCardProps) {
  return (
    <VStack
      align="stretch"
      gap={3}
      flex={1}
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
        color="var(--text-muted)"
        fontWeight="700"
      >
        {title}
      </Text>
      <HStack gap={3}>
        <Box boxSize="12px" borderRadius="999px" bg={accent} />
        <Text fontSize="lg" fontWeight="700">
          {status}
        </Text>
      </HStack>
    </VStack>
  );
}

export function MultiplayerWaitingRoom({
  roomId,
  joinLink,
  seatLabel,
  connectionLabel,
  roomReady,
  vikingsSeatStatus,
  maraudersSeatStatus,
  canJoinRoom,
  busy,
  error,
  notice,
  onCopyLink,
  onJoinRoom,
  onCreateRoom,
  onBackToMenu,
}: MultiplayerWaitingRoomProps) {
  const showCreateState = !roomId;
  const waitingMessage = roomReady
    ? "Both players are here. The board will open in a moment."
    : canJoinRoom
    ? "Take the open seat to join the match."
    : "Share the link and wait for the other player to arrive.";

  return (
    <VStack maxW="1100px" mx="auto" align="stretch" gap={6}>
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "start", md: "end" }}
        gap={4}
      >
        <VStack align="start" gap={3} maxW="700px">
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.24em"
            color="var(--text-muted)"
            fontWeight="700"
          >
            Multiplayer
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: "3xl", md: "5xl" }}
            lineHeight="1"
            fontFamily="'Palatino Linotype', 'Book Antiqua', Georgia, serif"
          >
            Waiting room
          </Heading>
          <Text color="var(--text-muted)" fontSize={{ base: "md", md: "lg" }}>
            {waitingMessage}
          </Text>
        </VStack>

        <Button
          onClick={onBackToMenu}
          bg="var(--button-ghost)"
          color="#f5efe1"
          border="1px solid rgba(219, 189, 131, 0.2)"
          _hover={{ bg: "var(--button-ghost-hover)" }}
        >
          Back To Menu
        </Button>
      </Stack>

      <Stack direction={{ base: "column", xl: "row" }} gap={5} align="stretch">
        <VStack
          flex={1.4}
          align="stretch"
          gap={5}
          bg="var(--panel-strong)"
          border="1px solid"
          borderColor="var(--panel-border)"
          borderRadius="30px"
          p={{ base: 6, md: 7 }}
          boxShadow="0 30px 70px rgba(0, 0, 0, 0.28)"
        >
          <VStack align="stretch" gap={2}>
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.18em"
              color="var(--text-muted)"
              fontWeight="700"
            >
              Room Code
            </Text>
            <Text
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="900"
              letterSpacing="0.12em"
            >
              {roomId ? roomId.toUpperCase() : "Creating..."}
            </Text>
            <Text color="var(--text-muted)">
              {seatLabel
                ? `You are seated as ${seatLabel}.`
                : "No seat has been claimed yet."}{" "}
              Connection: {connectionLabel}.
            </Text>
          </VStack>

          <VStack
            align="stretch"
            gap={3}
            bg="var(--panel-soft)"
            border="1px solid rgba(219, 189, 131, 0.14)"
            borderRadius="20px"
            p={4}
          >
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.18em"
              color="var(--text-muted)"
              fontWeight="700"
            >
              Share Link
            </Text>
            <Text
              fontSize="sm"
              color="var(--text-muted)"
              wordBreak="break-all"
              minH="48px"
            >
              {joinLink ?? "The room link will appear here as soon as the room is ready."}
            </Text>
            <HStack gap={3} flexWrap="wrap">
              <Button
                onClick={onCopyLink}
                disabled={!joinLink}
                bg="#dbc08b"
                color="#18120d"
                fontWeight="800"
                _hover={{ bg: "#e7cc97" }}
              >
                Copy Share Link
              </Button>
              {canJoinRoom ? (
                <Button
                  onClick={onJoinRoom}
                  disabled={busy}
                  bg="#5d7483"
                  color="#f5efe1"
                  _hover={{ bg: "#6d8594" }}
                >
                  {busy ? "Joining..." : "Join Match"}
                </Button>
              ) : null}
              {showCreateState ? (
                <Button
                  onClick={onCreateRoom}
                  disabled={busy}
                  bg="#5d7483"
                  color="#f5efe1"
                  _hover={{ bg: "#6d8594" }}
                >
                  {busy ? "Creating Room..." : "Create Room"}
                </Button>
              ) : null}
            </HStack>
          </VStack>
        </VStack>

        <VStack flex={1} align="stretch" gap={5}>
          <SeatCard
            title="Vikings"
            status={vikingsSeatStatus}
            accent="#4a7e9b"
          />
          <SeatCard
            title="Marauders"
            status={maraudersSeatStatus}
            accent="#b05335"
          />
          <VStack
            align="stretch"
            gap={2}
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
              color="var(--text-muted)"
              fontWeight="700"
            >
              Ready Check
            </Text>
            <Text fontSize="lg" fontWeight="700">
              {roomReady ? "Match ready" : "Waiting for both players"}
            </Text>
            <Text color="var(--text-muted)">
              The board opens by itself as soon as both seats are connected.
            </Text>
          </VStack>
        </VStack>
      </Stack>

      {notice ? (
        <Text color="#d8f2d0" fontSize="sm">
          {notice}
        </Text>
      ) : null}

      {error ? (
        <Text color="#ffb39a" fontSize="sm">
          {error}
        </Text>
      ) : null}
    </VStack>
  );
}

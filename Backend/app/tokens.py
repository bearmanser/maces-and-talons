from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time

from .game.types import Player

TOKEN_SECRET = os.getenv("MACES_TALONS_TOKEN_SECRET", "development-seat-secret-change-me")


class TokenError(Exception):
    pass


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_seat_token(room_id: str, seat: Player) -> str:
    payload = {
        "roomId": room_id,
        "seat": seat,
        "issuedAt": int(time.time()),
    }
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(
        TOKEN_SECRET.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    encoded_signature = _b64url_encode(signature)
    return f"{encoded_payload}.{encoded_signature}"


def verify_seat_token(token: str) -> tuple[str, Player]:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
    except ValueError as exc:
        raise TokenError("Invalid seat token.") from exc

    expected_signature = _b64url_encode(
        hmac.new(
            TOKEN_SECRET.encode("utf-8"),
            encoded_payload.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    )

    if not hmac.compare_digest(expected_signature, encoded_signature):
        raise TokenError("Seat token signature is invalid.")

    try:
        payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
        room_id = payload["roomId"]
        seat = payload["seat"]
    except (KeyError, ValueError, json.JSONDecodeError) as exc:
        raise TokenError("Seat token payload is invalid.") from exc

    if seat not in ("marauders", "vikings"):
        raise TokenError("Seat token contains an unknown seat.")

    return room_id, seat

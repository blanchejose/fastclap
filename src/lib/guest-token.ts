import { randomBytes } from "node:crypto";
import { GUEST_PREFIX, isGuestId } from "./guest-id";
import { createSocketToken, verifySocketToken, type SocketIdentity } from "./socket-token";

// Session d'un invité (AUTH-02) : son identifiant et son pseudo, signés avec
// AUTH_SECRET et gardés dans un cookie. La signature empêche de modifier le
// cookie pour prendre l'identité de quelqu'un d'autre.
export const GUEST_COOKIE = "fastclap_invite";
export const GUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export function newGuestId(): string {
  return GUEST_PREFIX + randomBytes(16).toString("hex");
}

export function createGuestToken(identity: SocketIdentity, secret: string, now = Date.now()) {
  return createSocketToken(identity, secret, now, GUEST_TTL_MS);
}

// Un jeton valide qui n'est pas celui d'un invité (par exemple le jeton
// temps réel d'un compte) est refusé.
export function readGuestToken(
  token: unknown,
  secret: string,
  now = Date.now(),
): SocketIdentity | null {
  const identity = verifySocketToken(token, secret, now);
  return identity && isGuestId(identity.uid) ? identity : null;
}

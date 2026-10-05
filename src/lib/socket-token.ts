import { createHmac, timingSafeEqual } from "node:crypto";

// Jeton court qui prouve au serveur Socket.IO qui est le joueur.
// La page de salle (composant serveur) le crée à partir de la session Auth.js,
// le serveur temps réel le vérifie avec le même secret (AUTH_SECRET).
export type SocketIdentity = { uid: string; name: string };

const TTL_MS = 6 * 60 * 60 * 1000; // 6 heures

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSocketToken(identity: SocketIdentity, secret: string, now = Date.now()) {
  const data = Buffer.from(JSON.stringify({ ...identity, exp: now + TTL_MS })).toString(
    "base64url",
  );
  return `${data}.${sign(data, secret)}`;
}

export function verifySocketToken(
  token: unknown,
  secret: string,
  now = Date.now(),
): SocketIdentity | null {
  if (typeof token !== "string") return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof payload.uid !== "string" || typeof payload.name !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return { uid: payload.uid, name: payload.name };
  } catch {
    return null;
  }
}

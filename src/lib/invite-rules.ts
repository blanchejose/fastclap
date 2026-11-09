// Règles des liens d'invitation (SALLE-04), sans base de données : testables.
import { randomBytes } from "node:crypto";

export type InviteState = {
  usedById: string | null;
  ip: string | null;
  revokedAt: Date | null;
  roomClosed: boolean;
};

export type ClaimDecision =
  | { ok: true; firstUse: boolean }
  | { ok: false; reason: "revoked" | "closed" | "other_ip" | "other_person" };

// 32 octets = 256 bits d'entropie (au moins 128 demandés), sans caractères
// à encoder dans une adresse.
export function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

// Un lien neuf se lie à la première personne et à son adresse IP. Ensuite,
// seule cette personne, depuis la même adresse, peut s'en resservir.
export function decideClaim(link: InviteState, personId: string, ip: string): ClaimDecision {
  if (link.roomClosed) return { ok: false, reason: "closed" };
  if (link.revokedAt) return { ok: false, reason: "revoked" };
  if (link.usedById === null) return { ok: true, firstUse: true };
  if (link.ip !== ip) return { ok: false, reason: "other_ip" };
  if (link.usedById !== personId) return { ok: false, reason: "other_person" };
  return { ok: true, firstUse: false };
}

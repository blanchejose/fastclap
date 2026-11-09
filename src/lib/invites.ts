// Liens d'invitation en base (SALLE-04) : création, liste pour l'hôte,
// utilisation, accès à une salle privée et révocation.
import { decideClaim, newInviteToken, type ClaimDecision } from "./invite-rules";
import { prisma } from "./prisma";
import type { SocketIdentity } from "./socket-token";

export type InviteView = {
  token: string;
  status: "UNUSED" | "USED" | "REVOKED";
  usedByName: string | null;
};

export async function createInvite(code: string): Promise<void> {
  const room = await prisma.room.findUnique({ where: { code }, select: { id: true } });
  if (room) await prisma.inviteLink.create({ data: { roomId: room.id, token: newInviteToken() } });
}

export async function listInvites(code: string): Promise<InviteView[]> {
  const links = await prisma.inviteLink.findMany({
    where: { room: { code } },
    orderBy: { createdAt: "asc" },
    select: { token: true, usedById: true, usedByName: true, revokedAt: true },
  });
  return links.map((link) => ({
    token: link.token,
    status: link.revokedAt ? "REVOKED" : link.usedById ? "USED" : "UNUSED",
    usedByName: link.usedByName,
  }));
}

export type ClaimResult =
  | { ok: true; code: string }
  | { ok: false; reason: Extract<ClaimDecision, { ok: false }>["reason"] | "not_found" };

// Utilisation d'un lien : la première fois, il est lié à la personne et à son
// adresse IP. La mise à jour ne passe que si le lien est encore libre : deux
// personnes qui l'ouvrent en même temps ne peuvent pas l'obtenir toutes les deux.
export async function claimInvite(
  token: string,
  person: SocketIdentity,
  ip: string,
): Promise<ClaimResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const link = await prisma.inviteLink.findUnique({
      where: { token },
      select: {
        id: true,
        usedById: true,
        ip: true,
        revokedAt: true,
        room: { select: { code: true, status: true } },
      },
    });
    if (!link) return { ok: false, reason: "not_found" };
    const decision = decideClaim(
      { ...link, roomClosed: link.room.status === "CLOSED" },
      person.uid,
      ip,
    );
    if (!decision.ok) return decision;
    if (!decision.firstUse) return { ok: true, code: link.room.code };
    const { count } = await prisma.inviteLink.updateMany({
      where: { id: link.id, usedById: null },
      data: { usedById: person.uid, usedByName: person.name, ip, usedAt: new Date() },
    });
    if (count === 1) return { ok: true, code: link.room.code };
  }
  return { ok: false, reason: "other_person" };
}

// SALLE-03 : dans une salle privée, il faut un lien utilisé par soi, depuis
// la même adresse, et pas révoqué.
export async function hasInviteAccess(code: string, personId: string, ip: string) {
  const link = await prisma.inviteLink.findFirst({
    where: { room: { code }, usedById: personId, ip, revokedAt: null },
    select: { id: true },
  });
  return link !== null;
}

// SALLE-07 : le lien d'une personne expulsée est révoqué.
export async function revokeInvites(code: string, personId: string) {
  await prisma.inviteLink.updateMany({
    where: { room: { code }, usedById: personId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

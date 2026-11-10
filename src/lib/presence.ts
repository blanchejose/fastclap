// SALLE-06 : dans quelle salle est chaque personne. La table RoomPresence a
// une ligne au plus par personne (clé primaire) : la base refuse une deuxième
// salle, même si deux onglets essaient en même temps.
import { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

type PresenceResult = { ok: true } | { ok: false; otherCode: string };

// Ce qu'on fait d'une présence déjà enregistrée dans une autre salle.
export function resolvePresence(
  existingCode: string,
  code: string,
  stillThere: boolean,
): "same" | "stale" | "elsewhere" {
  if (existingCode === code) return "same";
  return stillThere ? "elsewhere" : "stale";
}

// Inscrit la personne dans la salle `code`. `isStillIn` dit si elle est encore
// vraiment dans une autre salle (sinon la ligne est un reste, on la remplace).
export async function claimPresence(
  personId: string,
  code: string,
  isStillIn: (otherCode: string) => boolean,
): Promise<PresenceResult> {
  try {
    await prisma.roomPresence.create({ data: { personId, roomCode: code } });
    return { ok: true };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"))
      throw error;
  }
  const existing = await prisma.roomPresence.findUnique({ where: { personId } });
  if (!existing) return claimPresence(personId, code, isStillIn); // partie entre-temps
  const decision = resolvePresence(existing.roomCode, code, isStillIn(existing.roomCode));
  if (decision === "elsewhere") return { ok: false, otherCode: existing.roomCode };
  if (decision === "stale")
    await prisma.roomPresence.update({ where: { personId }, data: { roomCode: code } });
  return { ok: true };
}

export async function releasePresence(personIds: string[], code: string) {
  if (personIds.length === 0) return;
  await prisma.roomPresence.deleteMany({ where: { personId: { in: personIds }, roomCode: code } });
}

export async function releaseRoom(code: string) {
  await prisma.roomPresence.deleteMany({ where: { roomCode: code } });
}

// Au démarrage, aucune salle n'est en mémoire : toutes les présences sont des restes.
export async function resetPresences() {
  await prisma.roomPresence.deleteMany();
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { getGuest } from "@/lib/guest";
import { createGuestToken, GUEST_COOKIE, GUEST_TTL_MS, newGuestId } from "@/lib/guest-token";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCode } from "@/lib/room-code";
import { createRoomFor, DIFFICULTIES } from "@/lib/rooms";
import { isValidUsername } from "@/lib/username";

// Entrées des Server Actions, validées par Zod (TECH-07).
const roomCode = z.string().max(20).transform(normalizeRoomCode).pipe(z.string());
const joinSchema = z.object({ code: roomCode });
const createSchema = z.object({
  visibility: z.enum(["PUBLIC", "SEMI_PUBLIC"]).catch("PUBLIC"),
  difficulty: z.enum(DIFFICULTIES).catch("BEGINNER"),
});
const guestSchema = z.object({
  code: roomCode,
  name: z.string().trim().refine(isValidUsername), // AUTH-02 : 3 à 20 caractères
  // Après le pseudo, retour au lien d'invitation s'il y en a un (SALLE-04).
  suite: z
    .string()
    .regex(/^\/invitation\/[A-Za-z0-9_-]{43}$/)
    .optional()
    .catch(undefined),
});

// Server Action : rejoindre une salle avec son code (JOIN-01).
export async function joinByCode(formData: FormData) {
  const input = joinSchema.safeParse({ code: formData.get("code") ?? "" });
  if (!input.success) redirect("/?code=invalide#rejoindre");
  const { code } = input.data;

  const room = await prisma.room.findUnique({
    where: { code },
    select: { status: true, visibility: true },
  });
  if (!room || room.status === "CLOSED") redirect("/?code=introuvable#rejoindre");
  // SALLE-04 : le code seul ne suffit pas pour une salle privée.
  if (room.visibility === "PRIVATE") redirect("/?code=prive#rejoindre");

  redirect(`/salle/${code}`);
}

// SALLE-01, AUTH-03 : seul un utilisateur connecté crée une salle.
export async function createRoom(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/connexion?suite=/salles");

  const { visibility, difficulty } = createSchema.parse({
    visibility: formData.get("visibility"),
    difficulty: formData.get("difficulty"),
  });
  const code = await createRoomFor(session.user.id, visibility, difficulty);
  redirect(`/salle/${code}`);
}

// AUTH-02 : l'invité choisit un pseudo, gardé dans un cookie signé. S'il avait
// déjà une session d'invité, il garde le même identifiant.
export async function joinAsGuest(formData: FormData) {
  const input = guestSchema.safeParse({
    code: formData.get("code") ?? "",
    name: formData.get("name") ?? "",
    suite: formData.get("suite") ?? undefined,
  });
  if (!input.success) {
    const suite = guestSchema.shape.suite.parse(formData.get("suite") ?? undefined);
    const code = roomCode.safeParse(formData.get("code") ?? "");
    const back = suite ?? (code.success ? `/salle/${code.data}` : null);
    redirect(back ? `${back}?invite=pseudo` : "/");
  }
  const { code, name, suite } = input.data;

  const previous = await getGuest();
  const token = createGuestToken(
    { uid: previous?.uid ?? newGuestId(), name },
    process.env.AUTH_SECRET ?? "",
  );
  (await cookies()).set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_TTL_MS / 1000,
  });
  redirect(suite ?? `/salle/${code}`);
}

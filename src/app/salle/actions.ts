"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { getGuest } from "@/lib/guest";
import { createGuestToken, GUEST_COOKIE, GUEST_TTL_MS, newGuestId } from "@/lib/guest-token";
import { IP_HEADER } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";
import { codeAttempts } from "@/lib/rate-limit";
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

export type CodeError = "invalide" | "introuvable" | "prive" | "trop";
// Le code tapé revient avec l'erreur : React vide le formulaire après l'envoi.
export type CodeState = { error: CodeError | null; code?: string };

// Server Action : rejoindre une salle avec son code (JOIN-01). Appelée par
// useActionState : une erreur revient au formulaire, qui reste là où il est
// (accueil, salles ou /go) ; un bon code redirige vers la salle.
export async function joinByCode(_previous: CodeState, formData: FormData): Promise<CodeState> {
  // SALLE-10 : 10 essais ratés par minute et par adresse IP.
  const ip = (await headers()).get(IP_HEADER) ?? "inconnue";
  const typed = String(formData.get("code") ?? "").slice(0, 20);
  if (codeAttempts.isBlocked(ip)) return { error: "trop", code: typed };

  const input = joinSchema.safeParse({ code: typed });
  if (!input.success) {
    codeAttempts.record(ip);
    return { error: "invalide", code: typed };
  }
  const { code } = input.data;

  const room = await prisma.room.findUnique({
    where: { code },
    select: { status: true, visibility: true },
  });
  if (!room || room.status === "CLOSED") {
    codeAttempts.record(ip);
    return { error: "introuvable", code: typed };
  }
  // SALLE-04 : le code seul ne suffit pas pour une salle privée.
  if (room.visibility === "PRIVATE") return { error: "prive", code: typed };

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

// JOIN-03 : aucune salle libre ; l'utilisateur connecté crée une salle
// publique avec la configuration par défaut, dont il devient l'hôte.
export async function createQuickRoom() {
  const session = await auth();
  if (!session) redirect("/connexion?suite=/go");
  redirect(`/salle/${await createRoomFor(session.user.id, "PUBLIC", "BEGINNER")}`);
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

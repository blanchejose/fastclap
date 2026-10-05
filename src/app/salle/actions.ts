"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCode } from "@/lib/room-code";
import { createRoomFor, DIFFICULTIES, type Difficulty } from "@/lib/rooms";

// Server Action : rejoindre une salle avec son code (ROOM-1, semi-publique).
export async function joinByCode(formData: FormData) {
  const code = normalizeRoomCode(String(formData.get("code") ?? ""));
  if (!code) redirect("/?code=invalide#rejoindre");

  const room = await prisma.room.findUnique({ where: { code }, select: { status: true } });
  if (!room || room.status === "CLOSED") redirect("/?code=introuvable#rejoindre");

  redirect(`/salle/${code}`);
}

export async function createRoom(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/connexion?suite=/salles");

  const visibility = formData.get("visibility") === "SEMI_PUBLIC" ? "SEMI_PUBLIC" : "PUBLIC";
  const level = String(formData.get("difficulty"));
  const difficulty = (DIFFICULTIES as readonly string[]).includes(level)
    ? (level as Difficulty)
    : "BEGINNER";

  const code = await createRoomFor(session.user.id, visibility, difficulty);
  redirect(`/salle/${code}`);
}

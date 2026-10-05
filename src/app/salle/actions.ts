"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCode } from "@/lib/room-code";

// Server Action : rejoindre une salle avec son code (ROOM-1, semi-publique).
export async function joinByCode(formData: FormData) {
  const code = normalizeRoomCode(String(formData.get("code") ?? ""));
  if (!code) redirect("/?code=invalide#rejoindre");

  const room = await prisma.room.findUnique({ where: { code }, select: { status: true } });
  if (!room || room.status === "CLOSED") redirect("/?code=introuvable#rejoindre");

  redirect(`/salle/${code}`);
}

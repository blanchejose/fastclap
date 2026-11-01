"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { AVATAR_MAX_BYTES, checkAvatar, resizeAvatar } from "@/lib/avatar";
import { normalizeDisplayName } from "@/lib/display-name";
import { prisma } from "@/lib/prisma";

// Entrées validées par Zod (TECH-07).
const nameSchema = z.object({
  name: z.string().max(80).transform(normalizeDisplayName).pipe(z.string()),
});
const photoSchema = z.object({
  photo: z
    .instanceof(File)
    .refine((file) => file.size > 0, "vide")
    .refine((file) => file.size <= AVATAR_MAX_BYTES, "taille"),
});

async function requireUser() {
  const session = await auth();
  if (!session) redirect("/connexion?suite=/profil");
  return session.user.id;
}

// AUTH-05 : le pseudonyme affiché. Le nom d'utilisateur (connexion) ne change pas.
export async function updateDisplayName(formData: FormData) {
  const userId = await requireUser();
  const input = nameSchema.safeParse({ name: formData.get("name") ?? "" });
  if (!input.success) redirect("/profil?erreur=nom#pseudonyme");
  await prisma.user.update({ where: { id: userId }, data: { name: input.data.name } });
  redirect("/profil?ok=nom#pseudonyme");
}

// AUTH-04, SEC-02 : taille et vrai type vérifiés sur le serveur, puis l'image
// est redimensionnée avant d'être gardée.
export async function uploadAvatar(formData: FormData) {
  const userId = await requireUser();
  const input = photoSchema.safeParse({ photo: formData.get("photo") });
  if (!input.success) {
    const reason = input.error.issues[0]?.message === "taille" ? "taille" : "vide";
    redirect(`/profil?erreur=${reason}#photo`);
  }
  const bytes = new Uint8Array(await input.data.photo.arrayBuffer());
  const check = checkAvatar(bytes);
  if (!check.ok) redirect(`/profil?erreur=${check.reason === "too_big" ? "taille" : "type"}#photo`);

  let avatar: Buffer;
  try {
    avatar = await resizeAvatar(bytes);
  } catch {
    redirect("/profil?erreur=type#photo"); // en-tête valide, image abîmée
  }
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: new Uint8Array(avatar), avatarUpdatedAt: new Date() },
  });
  redirect("/profil?ok=photo#photo");
}

export async function removeAvatar() {
  const userId = await requireUser();
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: null, avatarUpdatedAt: null },
  });
  redirect("/profil?ok=photo-retiree#photo");
}

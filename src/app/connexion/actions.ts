"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";

// Server Actions : ces fonctions tournent sur le serveur et sont appelées
// directement par les formulaires de la page de connexion.

function errorCode(error: AuthError): string {
  return error instanceof CredentialsSignin ? error.code : error.type;
}

// Entrées validées par Zod (TECH-07). Les règles du pseudo et du mot de passe
// sont vérifiées dans src/auth.ts, qui renvoie un message précis.
const nextSchema = z
  .string()
  .max(200)
  .regex(/^\/(?!\/)/) // seulement un chemin interne au site
  .catch("/");
const providerSchema = z.enum(["discord", "github"]);
const field = z.string().max(200).catch("");

// Page où revenir après la connexion.
function safeNext(formData: FormData): string {
  return nextSchema.parse(formData.get("suite") ?? "/");
}

async function trySignIn(provider: string, formData: FormData, data: Record<string, string> = {}) {
  const next = safeNext(formData);
  try {
    await signIn(provider, { ...data, redirectTo: next });
  } catch (error) {
    // En cas de succès, signIn lance une redirection qu'il faut laisser passer.
    if (error instanceof AuthError) {
      redirect(`/connexion?erreur=${errorCode(error)}&suite=${encodeURIComponent(next)}`);
    }
    throw error;
  }
}

export async function signInWithOAuth(formData: FormData) {
  const provider = providerSchema.safeParse(formData.get("provider"));
  if (!provider.success) redirect("/connexion");
  await trySignIn(provider.data, formData);
}

export async function signInWithUsername(formData: FormData) {
  await trySignIn("username", formData, { username: field.parse(formData.get("username")) });
}

export async function signInWithPassword(formData: FormData) {
  await trySignIn("password", formData, {
    username: field.parse(formData.get("username")),
    password: field.parse(formData.get("password")),
  });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

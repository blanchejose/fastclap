"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

// Server Actions : ces fonctions tournent sur le serveur et sont appelées
// directement par les formulaires de la page de connexion.

function errorCode(error: AuthError): string {
  return error instanceof CredentialsSignin ? error.code : error.type;
}

// Page où revenir après la connexion (seulement un chemin interne au site).
function safeNext(formData: FormData): string {
  const next = String(formData.get("suite") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
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
  const provider = String(formData.get("provider"));
  if (provider !== "discord" && provider !== "github") redirect("/connexion");
  await trySignIn(provider, formData);
}

export async function signInWithUsername(formData: FormData) {
  await trySignIn("username", formData, { username: String(formData.get("username") ?? "") });
}

export async function signInWithPassword(formData: FormData) {
  await trySignIn("password", formData, {
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

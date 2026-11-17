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

// Code d'erreur d'Auth.js, renvoyé au formulaire par useActionState, avec le
// pseudo tapé : React vide le formulaire après l'envoi.
export type LoginState = { error: string | null; username?: string };

// Connexion ; en cas de succès, signIn lance une redirection qu'il faut laisser passer.
async function trySignIn(provider: string, formData: FormData, data: Record<string, string> = {}) {
  await signIn(provider, { ...data, redirectTo: safeNext(formData) });
}

// AUTH-01 : Discord et GitHub. L'erreur revient dans l'URL, comme pour les
// erreurs renvoyées par le fournisseur lui-même.
export async function signInWithOAuth(formData: FormData) {
  const provider = providerSchema.safeParse(formData.get("provider"));
  if (!provider.success) redirect("/connexion");
  try {
    await trySignIn(provider.data, formData);
  } catch (error) {
    if (error instanceof AuthError) {
      const next = encodeURIComponent(safeNext(formData));
      redirect(`/connexion?erreur=${errorCode(error)}&suite=${next}`);
    }
    throw error;
  }
}

// Pseudo seul ou pseudo et mot de passe : l'erreur revient au formulaire, qui
// garde ce qui a été tapé.
async function signInWithForm(
  provider: "username" | "password",
  formData: FormData,
  data: Record<string, string>,
): Promise<LoginState> {
  try {
    await trySignIn(provider, formData, data);
  } catch (error) {
    if (error instanceof AuthError) return { error: errorCode(error), username: data.username };
    throw error;
  }
  return { error: null };
}

export async function signInWithUsername(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return signInWithForm("username", formData, { username: field.parse(formData.get("username")) });
}

export async function signInWithPassword(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return signInWithForm("password", formData, {
    username: field.parse(formData.get("username")),
    password: field.parse(formData.get("password")),
  });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

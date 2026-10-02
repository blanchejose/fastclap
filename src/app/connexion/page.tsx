import type { Metadata } from "next";
import { Brand } from "@/components/Brand";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithOAuth, signInWithPassword, signInWithUsername } from "./actions";

export const metadata: Metadata = { title: "Connexion · FastClap" };

const errorMessages: Record<string, string> = {
  username_taken: "Ce nom d'utilisateur est déjà pris. Choisis-en un autre.",
  invalid_username: "Le nom doit faire 3 à 20 caractères : lettres, chiffres, - ou _.",
  weak_password: "Le mot de passe doit contenir au moins 8 caractères.",
  wrong_password: "Mot de passe incorrect pour ce nom d'utilisateur.",
};

const inputClass =
  "w-full rounded-xl border border-muted/30 bg-background px-4 py-3 font-mono text-foreground placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-info";

// Composant serveur : il lit la session et l'erreur éventuelle dans l'URL.
// Les formulaires appellent des Server Actions, sans JavaScript côté client.
export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  if (await auth()) redirect("/");

  const { erreur } = await searchParams;
  const error =
    typeof erreur === "string"
      ? (errorMessages[erreur] ?? "La connexion a échoué. Réessaie.")
      : null;

  const oauth = [
    { id: "discord", label: "Continuer avec Discord", enabled: !!process.env.AUTH_DISCORD_ID },
    { id: "github", label: "Continuer avec GitHub", enabled: !!process.env.AUTH_GITHUB_ID },
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
      <Brand />
      <h1 className="font-display text-4xl font-bold">Connexion</h1>

      {error && (
        <p role="alert" className="border-alerte/50 bg-alerte/10 rounded-xl border p-4 text-sm">
          {error}
        </p>
      )}

      {/* AUTH-1 et AUTH-2 : les connexions recommandées, en premier */}
      <section className="flex flex-col gap-3">
        {oauth.map((provider) => (
          <form key={provider.id} action={signInWithOAuth}>
            <input type="hidden" name="provider" value={provider.id} />
            <button
              type="submit"
              disabled={!provider.enabled}
              className="bg-surface font-display hover:ring-info focus-visible:outline-info w-full rounded-xl px-4 py-3 text-lg font-bold hover:ring-2 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {provider.label}
              {!provider.enabled && " (non configuré)"}
            </button>
          </form>
        ))}
      </section>

      {/* AUTH-3 : un nom d'utilisateur suffit */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Jouer avec un pseudo</h2>
        <form action={signInWithUsername} className="flex flex-col gap-3">
          <label htmlFor="username-only" className="text-muted text-sm">
            Choisis un nom d&apos;utilisateur (pas de mot de passe)
          </label>
          <input
            id="username-only"
            name="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_\-]{3,20}"
            autoComplete="username"
            placeholder="ex. blanche_03"
            className={inputClass}
          />
          <button
            type="submit"
            className="bg-eclair font-display text-nuit focus-visible:outline-turbo rounded-xl px-4 py-3 text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Créer mon compte
          </button>
        </form>
      </section>

      {/* AUTH-4 : disponible, mais visuellement déprécié (en dernier, replié) */}
      <details className="text-muted text-sm">
        <summary className="cursor-pointer">Se connecter avec un mot de passe</summary>
        <form action={signInWithPassword} className="mt-3 flex flex-col gap-3">
          <label htmlFor="pw-username">Nom d&apos;utilisateur</label>
          <input
            id="pw-username"
            name="username"
            required
            autoComplete="username"
            className={inputClass}
          />
          <label htmlFor="pw-password">Mot de passe (8 caractères minimum)</label>
          <input
            id="pw-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className={inputClass}
          />
          <button
            type="submit"
            className="border-muted/40 hover:text-foreground rounded-xl border px-4 py-2"
          >
            Se connecter
          </button>
        </form>
      </details>
    </main>
  );
}

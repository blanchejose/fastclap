import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { signInWithOAuth, signInWithPassword, signInWithUsername } from "./actions";

export const metadata: Metadata = { title: "Connexion" };

const errorMessages: Record<string, string> = {
  username_taken: "Ce pseudo est déjà pris. Ajoute un chiffre ou choisis-en un autre.",
  invalid_username: "Le pseudo doit faire 3 à 20 caractères : lettres, chiffres, - ou _.",
  weak_password: "Le mot de passe doit contenir au moins 8 caractères.",
  wrong_password: "Mot de passe incorrect pour ce pseudo.",
};

const pseudoErrors = new Set(["username_taken", "invalid_username"]);
const passwordErrors = new Set(["weak_password", "wrong_password"]);

const fieldClass =
  "min-h-14 w-full rounded-lg border-[2.5px] bg-piste px-4 font-mono text-lg font-semibold text-encre placeholder:text-sourdine";

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="text-faute flex items-center gap-2 text-[15px] font-semibold"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v6M12 17h.01" />
      </svg>
      {children}
    </p>
  );
}

// Composant serveur : il lit la session et l'erreur éventuelle dans l'URL.
// Les formulaires appellent des Server Actions, sans JavaScript côté client.
export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  if (await auth()) redirect("/");

  const { erreur } = await searchParams;
  const code = typeof erreur === "string" ? erreur : null;
  const message = code ? (errorMessages[code] ?? "La connexion a échoué. Réessaie.") : null;
  const pseudoError = code !== null && pseudoErrors.has(code);
  const passwordError = code !== null && passwordErrors.has(code);
  const otherError = message && !pseudoError && !passwordError;

  const oauth = [
    { id: "discord", label: "Continuer avec Discord", enabled: !!process.env.AUTH_DISCORD_ID },
    { id: "github", label: "Continuer avec GitHub", enabled: !!process.env.AUTH_GITHUB_ID },
  ];

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-wrap items-center gap-12 px-6 py-14">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
          <h1 className="font-display text-[clamp(52px,7vw,88px)] leading-[0.9] font-black uppercase">
            Salue,
            <br />
            puis en garde.
          </h1>
          <p className="text-sourdine max-w-[30em] text-lg leading-relaxed">
            En escrime, on salue avant chaque duel. Ici, il suffit d&apos;un pseudo. Connecte-toi
            avec Discord ou GitHub si tu veux garder tes stats et tes cartons.
          </p>
          <div className="flex items-center gap-2.5" aria-hidden="true">
            <span className="bg-juste h-4.5 w-8.5 rounded" />
            <span className="bg-faute h-4.5 w-8.5 rounded" />
          </div>
        </div>

        <main
          id="contenu"
          className="border-encre bg-surface flex min-w-0 flex-[1_1_420px] flex-col gap-6 rounded-2xl border-2 p-7"
        >
          <h2 className="font-display text-4xl font-black uppercase">Connexion</h2>
          {otherError && <ErrorText id="erreur-generale">{message}</ErrorText>}

          {/* AUTH-1 et AUTH-2 : les connexions recommandées, en premier */}
          <div className="flex flex-col gap-2.5">
            {oauth.map((provider) => (
              <form key={provider.id} action={signInWithOAuth}>
                <input type="hidden" name="provider" value={provider.id} />
                <button
                  type="submit"
                  disabled={!provider.enabled}
                  className={`min-h-14 w-full rounded-lg text-[17px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    provider.id === "discord"
                      ? "bg-[#4752C4] text-white hover:bg-[#3C45A5]"
                      : "border-encre bg-cta text-cta-encre border-2 hover:opacity-90"
                  }`}
                >
                  {provider.label}
                  {!provider.enabled && " (non configuré)"}
                </button>
              </form>
            ))}
          </div>

          <div className="text-sourdine flex items-center gap-3 text-sm">
            <span className="bg-trait h-[1.5px] flex-1" />
            ou
            <span className="bg-trait h-[1.5px] flex-1" />
          </div>

          {/* AUTH-3 : un pseudo suffit */}
          <form action={signInWithUsername} className="flex flex-col gap-2">
            <label htmlFor="pseudo" className="text-base font-bold">
              Choisis ton pseudo
            </label>
            <span id="pseudo-aide" className="text-sourdine text-sm">
              3 à 20 caractères : lettres, chiffres, - ou _
            </span>
            <input
              id="pseudo"
              name="username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_\-]{3,20}"
              autoComplete="username"
              placeholder="ex. lea_03"
              aria-invalid={pseudoError || undefined}
              aria-describedby={pseudoError ? "pseudo-aide pseudo-erreur" : "pseudo-aide"}
              className={`${fieldClass} ${pseudoError ? "border-faute" : "border-encre"}`}
            />
            {pseudoError && <ErrorText id="pseudo-erreur">{message}</ErrorText>}
            <button
              type="submit"
              className="bg-cta font-display text-cta-encre mt-2 min-h-14 rounded-lg text-2xl font-black tracking-wide uppercase shadow-[4px_4px_0_var(--faute)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_var(--faute)]"
            >
              Entrer sur la piste
            </button>
          </form>

          {/* AUTH-4 : disponible, mais visuellement déprécié (en dernier, replié) */}
          <details open={passwordError} className="text-sourdine text-[15px]">
            <summary className="flex min-h-11 cursor-pointer items-center">
              J&apos;ai un mot de passe
            </summary>
            <form action={signInWithPassword} className="text-encre mt-2 flex flex-col gap-2">
              <label htmlFor="mdp-pseudo" className="font-semibold">
                Pseudo
              </label>
              <input
                id="mdp-pseudo"
                name="username"
                required
                autoComplete="username"
                className={`${fieldClass} border-encre`}
              />
              <label htmlFor="mdp" className="font-semibold">
                Mot de passe (8 caractères minimum)
              </label>
              <input
                id="mdp"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                aria-invalid={passwordError || undefined}
                aria-describedby={passwordError ? "mdp-erreur" : undefined}
                className={`${fieldClass} ${passwordError ? "border-faute" : "border-encre"}`}
              />
              {passwordError && <ErrorText id="mdp-erreur">{message}</ErrorText>}
              <button
                type="submit"
                className="border-encre hover:bg-encre hover:text-piste mt-1 min-h-12 rounded-lg border-2 font-bold transition"
              >
                Se connecter
              </button>
            </form>
          </details>
        </main>
      </div>
    </>
  );
}

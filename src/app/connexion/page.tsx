import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DiscordIcon, GitHubIcon } from "@/components/BrandIcons";
import { LogoMark } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/server";
import { signInWithOAuth, signInWithPassword, signInWithUsername } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).login.metaTitle };
}

const pseudoErrors = new Set(["username_taken", "invalid_username"]);
const passwordErrors = new Set(["weak_password", "wrong_password"]);

const fieldClass =
  "min-h-14 w-full rounded-2xl border-[2.5px] bg-piste px-4 font-mono text-lg font-semibold text-encre placeholder:text-sourdine";

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

// Composant serveur : il lit la session, l'erreur éventuelle et la page où
// revenir dans l'URL. Les formulaires appellent des Server Actions.
export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const [{ erreur, suite }, t, session] = await Promise.all([
    searchParams,
    getDictionary(),
    auth(),
  ]);
  const next =
    typeof suite === "string" && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/";
  if (session) redirect(next);

  const code = typeof erreur === "string" ? erreur : null;
  const errors = t.login.errors as Record<string, string>;
  const message = code ? (errors[code] ?? t.login.errors.other) : null;
  const pseudoError = code !== null && pseudoErrors.has(code);
  const passwordError = code !== null && passwordErrors.has(code);
  const otherError = message && !pseudoError && !passwordError;

  const oauth = [
    {
      id: "discord",
      label: t.login.discord,
      enabled: !!process.env.AUTH_DISCORD_ID,
      Icon: DiscordIcon,
    },
    {
      id: "github",
      label: t.login.github,
      enabled: !!process.env.AUTH_GITHUB_ID,
      Icon: GitHubIcon,
    },
  ];
  const nextField = <input type="hidden" name="suite" value={next} />;

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-wrap items-center gap-12 px-6 py-14">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
          <h1 className="font-display text-[clamp(52px,7vw,88px)] leading-[0.92] font-extrabold tracking-tight">
            {t.login.title1}
            <br />
            {t.login.title2}
          </h1>
          <p className="text-sourdine max-w-[30em] text-lg leading-relaxed">{t.login.lead}</p>
          <LogoMark className="size-24" />
        </div>

        <main
          id="contenu"
          className="bg-surface ring-bleu flex min-w-0 flex-[1_1_420px] flex-col gap-6 rounded-3xl p-7 shadow-[0_8px_0_var(--bleu)] ring-2"
        >
          <h2 className="font-display text-4xl font-extrabold tracking-tight">{t.login.heading}</h2>
          {otherError && <ErrorText id="erreur-generale">{message}</ErrorText>}

          {/* AUTH-1 et AUTH-2 : les connexions recommandées, en premier */}
          <div className="flex flex-col gap-2.5">
            {oauth.map((provider) => (
              <form key={provider.id} action={signInWithOAuth}>
                <input type="hidden" name="provider" value={provider.id} />
                {nextField}
                <button
                  type="submit"
                  disabled={!provider.enabled}
                  className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl text-[17px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    provider.id === "discord"
                      ? "bg-[#4752C4] text-white hover:bg-[#3C45A5]"
                      : "bg-encre text-piste hover:opacity-90"
                  }`}
                >
                  <provider.Icon className="size-6" />
                  <span>
                    {provider.label}
                    {!provider.enabled && ` ${t.login.notConfigured}`}
                  </span>
                </button>
              </form>
            ))}
          </div>

          <div className="text-sourdine flex items-center gap-3 text-sm">
            <span className="bg-trait h-[1.5px] flex-1" />
            {t.login.or}
            <span className="bg-trait h-[1.5px] flex-1" />
          </div>

          {/* AUTH-3 : un pseudo suffit */}
          <form action={signInWithUsername} className="flex flex-col gap-2">
            {nextField}
            <label htmlFor="pseudo" className="text-base font-bold">
              {t.login.pseudo}
            </label>
            <span id="pseudo-aide" className="text-sourdine text-sm">
              {t.login.pseudoHelp}
            </span>
            <input
              id="pseudo"
              name="username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_\-]{3,20}"
              autoComplete="username"
              placeholder={t.login.pseudoPlaceholder}
              aria-invalid={pseudoError || undefined}
              aria-describedby={pseudoError ? "pseudo-aide pseudo-erreur" : "pseudo-aide"}
              className={`${fieldClass} ${pseudoError ? "border-faute" : "border-encre"}`}
            />
            {pseudoError && <ErrorText id="pseudo-erreur">{message}</ErrorText>}
            <button
              type="submit"
              className="bg-jaune font-display text-nuit mt-2 min-h-14 rounded-2xl text-2xl font-extrabold shadow-[0_5px_0_var(--orange)] transition hover:-translate-y-0.5 hover:shadow-[0_7px_0_var(--orange)] active:translate-y-1 active:shadow-[0_1px_0_var(--orange)]"
            >
              {t.login.go}
            </button>
          </form>

          {/* AUTH-4 : disponible, mais visuellement déprécié (en dernier, replié) */}
          <details open={passwordError} className="text-sourdine text-[15px]">
            <summary className="flex min-h-11 cursor-pointer items-center">
              {t.login.hasPassword}
            </summary>
            <form action={signInWithPassword} className="text-encre mt-2 flex flex-col gap-2">
              {nextField}
              <label htmlFor="mdp-pseudo" className="font-semibold">
                {t.login.username}
              </label>
              <input
                id="mdp-pseudo"
                name="username"
                required
                autoComplete="username"
                className={`${fieldClass} border-encre`}
              />
              <label htmlFor="mdp" className="font-semibold">
                {t.login.password}
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
                className="border-encre hover:bg-encre hover:text-piste mt-1 min-h-12 rounded-2xl border-2 font-bold transition"
              >
                {t.login.submitPassword}
              </button>
            </form>
          </details>
        </main>
      </div>
    </>
  );
}

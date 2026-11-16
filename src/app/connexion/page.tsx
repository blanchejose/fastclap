import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DiscordIcon, GitHubIcon } from "@/components/BrandIcons";
import { Runner } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/server";
import { signInWithOAuth, signInWithPassword, signInWithUsername } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).login.metaTitle };
}

const pseudoErrors = new Set(["username_taken", "invalid_username"]);
const passwordErrors = new Set(["weak_password", "wrong_password"]);

// Champ de saisie de la maquette : fond doux, bordure qui passe au bleu au focus.
const fieldClass =
  "bg-surface-2 text-encre placeholder:text-sourdine focus:border-bleu focus:bg-surface h-[52px] w-full rounded-[14px] border-2 px-4 text-[17px] font-semibold transition-colors outline-none";

// Couloirs de la piste décorative : couleur, durée de la traversée et départ
// décalé pour que les trois coureurs ne soient jamais alignés.
const LANES = [
  { top: 30, color: "text-orange", duration: "6s", delay: "0s" },
  { top: 70, color: "text-bleu", duration: "7.5s", delay: "-2s" },
  { top: 110, color: "text-sourdine", duration: "9s", delay: "-5s" },
] as const;

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
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16 lg:pt-[72px]">
        <div className="flex min-w-0 flex-col gap-[22px]">
          <h1 className="font-display text-[clamp(52px,7vw,96px)] leading-[0.92] font-extrabold tracking-tight">
            <span className="motion-safe:animate-monte block">{t.login.title1}</span>
            <span className="text-bleu-texte motion-safe:animate-monte block [animation-delay:80ms]">
              {t.login.title2}
            </span>
          </h1>
          <p className="text-sourdine motion-safe:animate-monte max-w-[36em] text-lg leading-relaxed [animation-delay:160ms]">
            {t.login.lead}
          </p>
          {/* La piste : trois coureurs qui traversent leur couloir (décor). */}
          <div aria-hidden="true" className="relative mt-5 h-[120px] overflow-hidden">
            {LANES.map((lane) => (
              <span key={lane.top}>
                <span
                  className="border-trait absolute inset-x-0 border-t-2 border-dashed"
                  style={{ top: lane.top }}
                />
                <span
                  className={`${lane.color} motion-safe:animate-traverse absolute -mt-10 size-11`}
                  style={{
                    top: lane.top,
                    animationDuration: lane.duration,
                    animationDelay: lane.delay,
                  }}
                >
                  <Runner className="size-11" />
                </span>
              </span>
            ))}
          </div>
        </div>

        <main
          id="contenu"
          className="carte motion-safe:animate-monte flex min-w-0 flex-col gap-[18px] p-6 [animation-delay:160ms] sm:p-8"
        >
          <h2 className="font-display text-[30px] font-extrabold tracking-tight">
            {t.login.heading}
          </h2>
          {otherError && <ErrorText id="erreur-generale">{message}</ErrorText>}

          {/* AUTH-01 : Discord et GitHub, les connexions recommandées, en premier */}
          {oauth.map((provider) => (
            <form key={provider.id} action={signInWithOAuth}>
              <input type="hidden" name="provider" value={provider.id} />
              {nextField}
              <button
                type="submit"
                disabled={!provider.enabled}
                className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-bold transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                  provider.id === "discord" ? "bg-[#4752C4] text-white" : "bg-encre text-piste"
                }`}
              >
                <provider.Icon className="size-[22px]" />
                <span>
                  {provider.label}
                  {!provider.enabled && ` ${t.login.notConfigured}`}
                </span>
              </button>
            </form>
          ))}

          <div className="text-sourdine flex items-center gap-3.5 text-sm font-bold">
            <span className="bg-trait h-px flex-1" />
            {t.login.or}
            <span className="bg-trait h-px flex-1" />
          </div>

          {/* Connexion rapide : un pseudo suffit */}
          <form action={signInWithUsername} className="flex flex-col gap-4">
            {nextField}
            <div className="flex flex-col gap-2">
              <label htmlFor="pseudo" className="text-[15px] font-bold">
                {t.login.pseudo}
              </label>
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
                className={`${fieldClass} ${pseudoError ? "border-faute!" : "border-trait"}`}
              />
              <span id="pseudo-aide" className="text-sourdine text-[13px]">
                {t.login.pseudoHelp}
              </span>
              {pseudoError && <ErrorText id="pseudo-erreur">{message}</ErrorText>}
            </div>
            <button type="submit" className="btn-go p-4 text-xl">
              {t.login.go}
              <svg
                className="fleche"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          {/* AUTH-01 : mot de passe, disponible mais en retrait (en dernier, replié).
              Un <details> s'ouvre sans JavaScript. */}
          <details open={passwordError} className="group flex flex-col">
            <summary className="text-bleu-texte mx-auto flex min-h-11 cursor-pointer list-none items-center px-2 font-bold [&::-webkit-details-marker]:hidden">
              {t.login.hasPassword}
            </summary>
            <form
              action={signInWithPassword}
              className="border-trait motion-safe:animate-monte mt-2 flex flex-col gap-3.5 border-t pt-4"
            >
              {nextField}
              <div className="flex flex-col gap-2">
                <label htmlFor="mdp-pseudo" className="text-[15px] font-bold">
                  {t.login.username}
                </label>
                <input
                  id="mdp-pseudo"
                  name="username"
                  required
                  autoComplete="username"
                  className={`${fieldClass} border-trait`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="mdp" className="text-[15px] font-bold">
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
                  className={`${fieldClass} ${passwordError ? "border-faute!" : "border-trait"}`}
                />
                {passwordError && <ErrorText id="mdp-erreur">{message}</ErrorText>}
              </div>
              <button type="submit" className="btn btn-bleu">
                {t.login.submitPassword}
              </button>
            </form>
          </details>
        </main>
      </div>
    </>
  );
}

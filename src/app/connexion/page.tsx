import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DiscordIcon, GitHubIcon } from "@/components/BrandIcons";
import { Runner } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/server";
import { signInWithOAuth } from "./actions";
import { ErrorText, loginMessage, PasswordForm, UsernameForm } from "./LoginForms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).login.metaTitle };
}

// Couloirs de la piste décorative : couleur, durée de la traversée et départ
// décalé pour que les trois coureurs ne soient jamais alignés.
const LANES = [
  { top: 30, color: "text-orange", duration: "6s", delay: "0s" },
  { top: 70, color: "text-bleu", duration: "7.5s", delay: "-2s" },
  { top: 110, color: "text-sourdine", duration: "9s", delay: "-5s" },
] as const;

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

  // Erreurs des fournisseurs (Discord, GitHub), revenues dans l'URL. Celles
  // des formulaires s'affichent sous leur champ (LoginForms).
  const message = typeof erreur === "string" ? loginMessage(erreur, t.login) : null;

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
          {message && <ErrorText id="erreur-generale">{message}</ErrorText>}

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

          <UsernameForm next={next} t={t.login} />
          <PasswordForm next={next} t={t.login} />
        </main>
      </div>
    </>
  );
}

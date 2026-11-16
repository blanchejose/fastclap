import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";
import { GitHubIcon } from "./BrandIcons";
import { LangToggle } from "./LangToggle";
import { LogoMark, Runner, Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const REPO = "https://github.com/blanchejose/fastclap";

function Fleche({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`fleche ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Pied de page commun (composant serveur), ajouté dans le layout : une carte
// claire qui suit le thème, avec le slogan tapé et trois grosses touches.
export async function SiteFooter() {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const f = t.footer;
  const steps = [...f.slogan].length;

  const touches = [
    { href: "/go", label: f.go },
    { href: "/#rejoindre", label: f.code },
    { href: "/salles", label: f.rooms },
  ];
  const columns = [
    {
      title: f.discover,
      links: [
        { href: "/#comment", label: t.common.how },
        { href: "/#dossards", label: t.common.bibs },
        { href: "/historique", label: t.common.history },
      ],
    },
    {
      title: f.account,
      links: [
        { href: "/connexion", label: t.common.login },
        { href: "/profil", label: t.common.profile },
      ],
    },
  ];

  return (
    <footer className="mt-auto px-4 pt-20 pb-4 sm:px-6 sm:pb-6">
      <div className="carte relative mx-auto max-w-[78rem] overflow-hidden rounded-[2.25rem] px-6 pt-10 sm:px-14 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-12 pb-12">
          <div className="flex flex-[1_1_380px] flex-col gap-4">
            <p className="font-display text-[clamp(36px,4.6vw,64px)] leading-none font-extrabold tracking-tight">
              {/* Une seule ligne : le curseur suit la fin du texte révélé. */}
              <span
                className="relative inline-block whitespace-nowrap"
                style={{ "--n": steps } as React.CSSProperties}
              >
                <span className="slogan-texte inline-block">{f.slogan}</span>
                <span aria-hidden="true" className="slogan-curseur" />
              </span>
            </p>
            <p className="text-sourdine max-w-[30em] text-[17px] leading-relaxed">{f.tagline}</p>
          </div>
          <nav
            aria-label={f.play}
            className="grid max-w-[40rem] flex-[1_1_520px] gap-3.5 sm:grid-cols-3"
          >
            {touches.map((touche, i) => (
              <Link key={touche.href} href={touche.href} className="grosse-touche">
                <span className="touche-num font-mono text-[13px] font-bold" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display flex items-end justify-between gap-2 text-xl leading-tight font-extrabold">
                  {touche.label}
                  <Fleche />
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-trait grid grid-cols-2 gap-10 border-t py-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="col-span-2 flex flex-col gap-3.5 lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 self-start"
              aria-label={t.common.home}
            >
              <LogoMark className="size-10" />
              <Wordmark className="text-[1.65rem]" />
            </Link>
            <p className="text-sourdine max-w-[22em] text-[15px] leading-relaxed">{f.about}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2">
              <h2 className="text-sourdine mb-1 font-mono text-xs font-bold tracking-[0.16em] uppercase">
                {col.title}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="pied-lien block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="flex flex-col items-start gap-3">
            <h2 className="text-sourdine mb-1 font-mono text-xs font-bold tracking-[0.16em] uppercase">
              {f.settings}
            </h2>
            <div className="flex gap-2">
              <LangToggle
                next={locale === "fr" ? "en" : "fr"}
                label={t.common.switchLang}
                short={t.common.langShort}
              />
              <ThemeToggle toDark={t.common.toDark} toLight={t.common.toLight} />
            </div>
          </div>
        </div>

        <div className="border-trait text-sourdine flex flex-wrap items-center justify-between gap-4 border-t pt-5 pb-7 text-sm">
          <p>
            © {new Date().getFullYear()} FastClap{f.credit && ` · ${f.credit}`}
          </p>
          <a
            href={REPO}
            className="bg-surface-2 text-encre hover:bg-trait inline-flex min-h-10 items-center gap-2 rounded-full px-4 font-bold transition"
          >
            <GitHubIcon className="size-4" />
            {f.source}
          </a>
        </div>

        {/* La piste en pointillés et un petit coureur qui la longe. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--trait)_0_14px,transparent_14px_26px)]"
        />
        <span
          aria-hidden="true"
          className="text-orange absolute bottom-1 left-[12%] motion-safe:animate-[promenade_14s_linear_infinite]"
        >
          <Runner className="size-6" />
        </span>
      </div>
    </footer>
  );
}

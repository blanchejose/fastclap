import Link from "next/link";
import { getDictionary } from "@/i18n/server";
import { GitHubIcon } from "./BrandIcons";
import { LogoMark, Runner } from "./Logo";

const REPO = "https://github.com/blanchejose/fastclap";

// Pied de page commun à toutes les pages (composant serveur), ajouté dans le
// layout. Il s'ouvre sur un damier : la ligne d'arrivée de la course.
export async function SiteFooter() {
  const t = await getDictionary();
  const f = t.footer;

  const columns = [
    {
      title: f.play,
      links: [
        { href: "/go", label: f.go },
        { href: "/#rejoindre", label: f.code },
        { href: "/salles", label: f.rooms },
      ],
    },
    {
      title: f.discover,
      links: [
        { href: "/#comment", label: t.common.how },
        { href: "/#dossards", label: t.common.bibs },
        { href: "/connexion", label: t.common.login },
      ],
    },
  ];

  return (
    <footer className="bg-pied mt-auto text-white">
      {/* Ligne d'arrivée en damier, avec un coureur qui la franchit. */}
      <div className="relative h-4 bg-[repeating-conic-gradient(#fff_0_25%,#0d1240_0_50%)] bg-size-[16px_16px]">
        <Runner className="text-orange absolute -top-9 right-[12%] size-10" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 pt-12 pb-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 self-start"
            aria-label={t.common.home}
          >
            <LogoMark className="size-11" />
            <span className="font-display text-3xl font-extrabold tracking-tight">
              fast<span className="text-orange">clap</span>
            </span>
          </Link>
          <p className="font-display text-jaune text-4xl leading-none font-extrabold tracking-tight">
            {f.slogan}
          </p>
          <p className="max-w-[28em] leading-relaxed text-white/75">{f.tagline}</p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
            <h2 className="font-mono text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">
              {col.title}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
                  >
                    <span className="bg-orange h-0.5 w-3 rounded-full transition-all group-hover:w-5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 text-sm text-white/70">
          <p>
            © {new Date().getFullYear()} FastClap · {f.credit}
          </p>
          <a
            href={REPO}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
          >
            <GitHubIcon className="size-4" />
            {f.source}
          </a>
        </div>
      </div>
    </footer>
  );
}

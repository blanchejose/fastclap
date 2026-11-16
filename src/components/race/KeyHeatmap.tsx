import { fmt, type Dictionary, type Locale } from "@/i18n/dictionaries";

type Props = { missed: Record<string, number>; locale: Locale; t: Dictionary["charts"] };

// Une majuscule est une faute sur la même touche que sa minuscule.
const keyOf = (char: string) => char.toLowerCase();

// RES-03 : les touches les plus manquées, en grosses touches de clavier
// (maquette validée). Le nombre de fautes est écrit sous chaque touche.
export function KeyHeatmap({ missed, locale, t }: Props) {
  const counts = new Map<string, number>();
  for (const [char, n] of Object.entries(missed)) {
    const key = keyOf(char);
    counts.set(key, (counts.get(key) ?? 0) + n);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA");

  return (
    <section aria-labelledby="titre-touches" className="flex min-w-0 flex-col gap-4">
      <h2 id="titre-touches" className="font-display text-[22px] font-extrabold">
        {t.keysTitle}
      </h2>
      {top.length === 0 ? (
        <p className="text-sourdine">{t.noMisses}</p>
      ) : (
        <ul aria-label={t.mostMissed} className="flex flex-wrap gap-4">
          {top.map(([key, n]) => (
            <li key={key} className="touche-ratee">
              <span className={key === " " ? "large" : ""}>{key === " " ? t.space : key}</span>
              <span>{fmt(n === 1 ? t.missOne : t.missMany, { n: number.format(n) })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

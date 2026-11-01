import { fmt, type Dictionary, type Locale } from "@/i18n/dictionaries";

type Props = { missed: Record<string, number>; locale: Locale; t: Dictionary["charts"] };

// Disposition QWERTY (celle des claviers canadiens) ; les caractères absents
// (accents, guillemets…) ont leur propre rangée.
const ROWS = ["1234567890-=", "qwertyuiop", "asdfghjkl;'", "zxcvbnm,./"];
const LAYOUT = new Set(ROWS.join(""));

// Une majuscule est une faute sur la même touche que sa minuscule.
const keyOf = (char: string) => (LAYOUT.has(char.toLowerCase()) ? char.toLowerCase() : char);

// RES-03 : les touches les plus manquées, en carte de chaleur. Une seule
// teinte, du clair (peu de fautes) au foncé (beaucoup) ; le nombre est écrit
// sur la touche, la couleur n'est jamais seule à porter l'information.
export function KeyHeatmap({ missed, locale, t }: Props) {
  const counts = new Map<string, number>();
  for (const [char, n] of Object.entries(missed)) {
    const key = keyOf(char);
    counts.set(key, (counts.get(key) ?? 0) + n);
  }
  const max = Math.max(0, ...counts.values());
  const others = [...counts.keys()].filter((k) => !LAYOUT.has(k) && k !== " ");
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA");
  const label = (key: string) => (key === " " ? t.space : key);

  const renderKey = (char: string, wide = false) => {
    const n = counts.get(char) ?? 0;
    const level = n === 0 ? 0 : Math.max(1, Math.ceil((n / max) * 6));
    return (
      <li
        key={char}
        aria-label={fmt(t.keyMisses, { key: label(char), n: number.format(n) })}
        className={`flex h-10 flex-col items-center justify-center rounded-md font-mono text-sm leading-none ${
          wide ? "w-56" : "w-8"
        } ${level === 0 ? "bg-surface-2 text-sourdine" : ""}`}
        style={
          level > 0
            ? {
                backgroundColor: `var(--chaleur-${level})`,
                color: level >= 4 ? "var(--chaleur-texte-fort)" : "var(--encre)",
              }
            : undefined
        }
      >
        <span aria-hidden="true" className="font-semibold">
          {label(char)}
        </span>
        {n > 0 && (
          <span aria-hidden="true" className="text-[10px] font-bold">
            {number.format(n)}
          </span>
        )}
      </li>
    );
  };

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="font-display text-2xl font-extrabold">{t.keysTitle}</figcaption>
      {max === 0 ? (
        <p className="text-sourdine">{t.noMisses}</p>
      ) : (
        <>
          <p>
            {t.mostMissed}{" "}
            <strong>
              {top.map(([key, n]) => `${label(key)} (${number.format(n)})`).join(", ")}
            </strong>
          </p>
          <div className="flex flex-col items-center gap-1 overflow-x-auto">
            {ROWS.map((row, i) => (
              <ul key={row} className="flex gap-1" style={{ paddingLeft: `${i * 0.75}rem` }}>
                {[...row].map((char) => renderKey(char))}
              </ul>
            ))}
            <ul className="flex gap-1">{renderKey(" ", true)}</ul>
            {others.length > 0 && (
              <ul className="flex flex-wrap justify-center gap-1" aria-label={t.otherKeys}>
                {others.map((char) => renderKey(char))}
              </ul>
            )}
          </div>
        </>
      )}
    </figure>
  );
}

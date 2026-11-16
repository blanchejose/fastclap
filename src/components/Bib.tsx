import type { CSSProperties } from "react";

type Props = {
  label: string;
  value: string;
  unit: string;
  swing: string; // inclinaison de départ, autour de laquelle il se balance
  delay: string; // décalage, pour que les dossards ne bougent pas ensemble
  // Dans une liste de définitions (statistiques du profil) : le libellé est
  // un <dt>, la valeur et l'unité des <dd>. Sinon, un simple élément de liste.
  inDefinitionList?: boolean;
  large?: boolean; // le grand dossard de l'accueil
};

const ring =
  "absolute top-2.5 size-2.5 rounded-full bg-[#E6EAFB] ring-[1.5px] ring-black/25 ring-inset";

// Le dossard accroché par deux épingles, qui se balance (accueil, profil).
// Toujours blanc à texte nuit : il garde son contraste dans les deux thèmes.
export function Bib({
  label,
  value,
  unit,
  swing,
  delay,
  inDefinitionList = false,
  large = false,
}: Props) {
  const Root = inDefinitionList ? "div" : "li";
  const Term = inDefinitionList ? "dt" : "span";
  const Detail = inDefinitionList ? "dd" : "span";
  return (
    <Root
      className={`text-nuit motion-safe:animate-balance relative flex flex-col items-center bg-white pt-6.5 pb-4 transition-[scale] duration-300 hover:scale-105 hover:[animation-play-state:paused] ${
        large
          ? "origin-[50%_-18px] gap-1 rounded-2xl px-3.5 shadow-[0_8px_0_var(--orange),0_24px_40px_-18px_rgb(0_0_0/0.5)]"
          : "origin-[50%_-14px] gap-0.5 rounded-[18px] px-3 shadow-[0_7px_0_var(--orange),0_20px_34px_-18px_rgb(0_0_0/0.4)]"
      }`}
      style={{ "--r": swing, animationDelay: delay } as CSSProperties}
    >
      <span aria-hidden="true" className={`${ring} left-2.5`} />
      <span aria-hidden="true" className={`${ring} right-2.5`} />
      <Term className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">{label}</Term>
      <Detail
        className={`font-display leading-none font-extrabold tabular-nums ${large ? "text-[56px]" : "text-[52px]"}`}
      >
        {value}
      </Detail>
      <Detail className="font-mono text-[11px] font-bold tracking-[0.1em] text-[#4F5682] uppercase">
        {unit}
      </Detail>
    </Root>
  );
}

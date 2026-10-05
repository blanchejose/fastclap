// Logo Touché : une touche de clavier avec un T. L'accent du « é » devient
// une lame d'épée, et les deux lampes du tableau de score d'escrime sont en bas.
// Les couleurs suivent le thème (clair ou sombre).
export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect x="6" y="10" width="108" height="104" rx="18" fill="var(--encre)" />
      <rect x="16" y="14" width="88" height="82" rx="12" fill="var(--piste)" />
      <rect x="34" y="38" width="52" height="11" fill="var(--encre)" />
      <rect x="54.5" y="38" width="11" height="44" fill="var(--encre)" />
      <line
        x1="64"
        y1="30"
        x2="88"
        y2="16"
        stroke="var(--faute)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="32" cy="105" r="4.5" fill="var(--juste)" />
      <circle cx="46" cy="105" r="4.5" fill="var(--faute)" />
    </svg>
  );
}

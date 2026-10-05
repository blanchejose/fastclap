// Logo FastClap : un sprinteur qui s'élance sur la barre d'espace (la plus
// grande touche du clavier devient la piste), avec des traînées de vitesse.
// Le coureur rebondit à chaque foulée, sauf si « Réduire les animations » est actif.
export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect width="120" height="120" rx="28" fill="var(--bleu)" />
      <g stroke="var(--orange)" strokeWidth="6" strokeLinecap="round">
        <line x1="12" y1="44" x2="30" y2="44" />
        <line x1="8" y1="58" x2="28" y2="58" />
        <line x1="14" y1="72" x2="30" y2="72" />
      </g>
      <g
        className="motion-safe:animate-foulee"
        fill="none"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="76" cy="24" r="9" fill="#ffffff" stroke="none" />
        <line x1="70" y1="36" x2="58" y2="62" />
        <polyline points="68,40 82,50 92,42" />
        <polyline points="66,42 52,48 44,40" />
        <polyline points="58,62 76,72 72,90" />
        <polyline points="58,62 48,80 32,84" />
      </g>
      <rect x="18" y="96" width="84" height="12" rx="6" fill="var(--jaune)" />
    </svg>
  );
}

// Le petit coureur seul, utilisé dans les couloirs de course.
export function Runner({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="28 12 70 82" className={className} aria-hidden="true">
      <g
        className="motion-safe:animate-foulee"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="76" cy="24" r="9" fill="currentColor" stroke="none" />
        <line x1="70" y1="36" x2="58" y2="62" />
        <polyline points="68,40 82,50 92,42" />
        <polyline points="66,42 52,48 44,40" />
        <polyline points="58,62 76,72 72,90" />
        <polyline points="58,62 48,80 32,84" />
      </g>
    </svg>
  );
}

// Le nom : « fast » + « clap » en orange.
export function Wordmark({ className = "text-3xl" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      fast<span className="text-orange-texte">clap</span>
    </span>
  );
}

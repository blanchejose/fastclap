import { hashSeed } from "@/lib/race/random";

// Avatar généré à partir du nom : initiales sur une couleur pastel stable.
// Texte nuit sur fond clair : contraste suffisant dans les deux thèmes (A11Y-01).
export function Avatar({ name, className = "size-8" }: { name: string; className?: string }) {
  const hue = hashSeed(name) % 360;
  const initials = name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      className={`text-nuit inline-flex shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${className}`}
      style={{ backgroundColor: `hsl(${hue} 85% 78%)` }}
    >
      {initials || "?"}
    </span>
  );
}

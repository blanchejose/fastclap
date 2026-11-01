import Image from "next/image";
import { hashSeed } from "@/lib/race/random";

type Props = { name: string; src?: string | null; className?: string };

// Photo de profil (AUTH-04) si l'utilisateur en a une ; sinon avatar généré à
// partir du nom (AUTH-03) : initiales sur une couleur pastel stable, texte nuit
// sur fond clair pour un bon contraste dans les deux thèmes (A11Y-01).
// Décoratif : le nom est toujours écrit à côté.
export function Avatar({ name, src, className = "size-8" }: Props) {
  if (src)
    return (
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        unoptimized // déjà redimensionnée au téléversement
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
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

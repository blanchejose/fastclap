import Image from "next/image";

// Le fichier public/logo.webp est l'image originale du logo, non modifiée
// (2000 × 2000 px, avec une marge blanche). On affiche seulement le cadre
// sombre en masquant la marge avec CSS : aucun pixel n'est retouché.
// Cadre sombre dans l'image : x 200 → 1837, y 327 → 1657 (3 px de marge en plus).
const SOURCE = 2000;
const FRAME = { x: 203, y: 330, width: 1631, height: 1324 };

type LogoProps = { className?: string; priority?: boolean };

export function Logo({ className = "", priority = false }: LogoProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[12%/15%] ${className}`}
      style={{ aspectRatio: `${FRAME.width} / ${FRAME.height}` }}
    >
      <Image
        src="/logo.webp"
        alt="FastClap : tape plus rapide que tes amis"
        width={SOURCE}
        height={SOURCE}
        priority={priority}
        unoptimized // servi tel quel, sans recompression
        className="absolute max-w-none"
        style={{
          width: `${(SOURCE / FRAME.width) * 100}%`,
          left: `${(-FRAME.x / FRAME.width) * 100}%`,
          top: `${(-FRAME.y / FRAME.height) * 100}%`,
        }}
      />
    </div>
  );
}

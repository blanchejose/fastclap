import Image from "next/image";
import Link from "next/link";

// Icône FC + nom du site, utilisée dans l'en-tête de toutes les pages.
export function Brand() {
  return (
    <Link href="/" className="font-display flex items-center gap-2 text-2xl font-bold">
      <Image src="/icon-fc.png" alt="" width={36} height={36} className="rounded-lg" priority />
      <span>
        FAST<span className="text-info">CLAP</span>
      </span>
    </Link>
  );
}

import { Brand } from "@/components/Brand";
import { JoinRaceButton } from "@/components/JoinRaceButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";

// Composant serveur (par défaut dans l'App Router) : rendu sur le serveur,
// aucun JavaScript envoyé pour cette partie. Les boutons interactifs sont
// des composants clients importés à l'intérieur.
export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Brand />
        <div className="flex items-center gap-3">
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="font-display text-5xl font-bold text-balance sm:text-7xl">
          Tape plus rapide que tes amis
        </h1>
        <p className="text-muted max-w-xl">
          Des courses de frappe en temps réel, de 2 à 30 joueurs. Rejoins une course publique ou
          entre le code de ta salle.
        </p>
        <JoinRaceButton />
        <p className="text-info font-mono text-sm">ou entre un code de salle</p>
      </main>
    </>
  );
}

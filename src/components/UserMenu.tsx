import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/app/connexion/actions";

// Composant serveur : lit la session côté serveur, aucun appel réseau du navigateur.
export async function UserMenu() {
  const session = await auth();

  if (!session) {
    return (
      <Link
        href="/connexion"
        className="bg-surface hover:ring-info rounded-full px-4 py-1.5 text-sm font-bold hover:ring-2"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-info font-mono">{session.user.username}</span>
      <form action={logout}>
        <button type="submit" className="text-muted hover:text-foreground">
          Déconnexion
        </button>
      </form>
    </div>
  );
}

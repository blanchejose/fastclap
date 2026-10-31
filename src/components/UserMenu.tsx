import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/app/connexion/actions";
import { getDictionary } from "@/i18n/server";
import { getGuest } from "@/lib/guest";

// Composant serveur : lit la session côté serveur.
export async function UserMenu() {
  const [session, guest, t] = await Promise.all([auth(), getGuest(), getDictionary()]);

  if (!session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        {/* AUTH-02 : l'invité voit son pseudo, et peut toujours se connecter. */}
        {guest && (
          <span className="font-mono font-semibold">
            {guest.name} <span className="text-sourdine font-sans">({t.room.guest})</span>
          </span>
        )}
        <Link
          href="/connexion"
          className="bg-surface-2 hover:bg-trait flex min-h-11 items-center rounded-md px-4 text-[15px] font-bold transition"
        >
          {t.common.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-mono font-semibold">{session.user.username}</span>
      <form action={logout}>
        <button
          type="submit"
          className="text-sourdine hover:text-encre min-h-11 px-2 underline-offset-4 hover:underline"
        >
          {t.common.logout}
        </button>
      </form>
    </div>
  );
}

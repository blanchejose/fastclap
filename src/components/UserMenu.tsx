import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/app/connexion/actions";
import { getDictionary } from "@/i18n/server";

// Composant serveur : lit la session côté serveur.
export async function UserMenu() {
  const [session, t] = await Promise.all([auth(), getDictionary()]);

  if (!session) {
    return (
      <Link
        href="/connexion"
        className="bg-surface-2 hover:bg-trait flex min-h-11 items-center rounded-md px-4 text-[15px] font-bold transition"
      >
        {t.common.login}
      </Link>
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

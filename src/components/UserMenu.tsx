import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/app/connexion/actions";
import { getDictionary } from "@/i18n/server";
import { Avatar } from "@/components/race/Avatar";
import { avatarUrl } from "@/lib/avatar-url";
import { displayNameOf } from "@/lib/display-name";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

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

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, name: true, avatarUpdatedAt: true },
  });
  const name = account ? displayNameOf(account) : session.user.username;

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* AUTH-06 : le nom mène au profil. */}
      <Link
        href="/profil"
        aria-label={`${name} · ${t.common.profile}`}
        className="flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"
      >
        <Avatar
          name={name}
          src={account ? avatarUrl(session.user.id, account.avatarUpdatedAt) : null}
          className="size-7"
        />
        {name}
      </Link>
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

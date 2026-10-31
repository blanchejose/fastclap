import Link from "next/link";
import { joinAsGuest } from "@/app/salle/actions";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = { code: string; error: boolean; t: Dictionary["guest"]; login: string };

// AUTH-02 : sans compte, on choisit un pseudo pour entrer dans la salle.
// Composant serveur : le formulaire marche même sans JavaScript.
export function GuestForm({ code, error, t, login }: Props) {
  return (
    <div className="flex flex-wrap gap-6">
      <section
        aria-labelledby="titre-invite"
        className="bg-surface flex min-w-0 flex-[2_1_420px] flex-col gap-4 rounded-3xl p-7"
      >
        <h2 id="titre-invite" className="font-display text-3xl font-extrabold">
          {t.title}
        </h2>
        <p className="text-sourdine">{t.lead}</p>
        <form action={joinAsGuest} className="flex flex-col gap-3">
          <input type="hidden" name="code" value={code} />
          <label htmlFor="pseudo-invite" className="font-bold">
            {t.pseudo}
          </label>
          <input
            id="pseudo-invite"
            name="name"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_\-]{3,20}"
            autoComplete="nickname"
            aria-describedby="aide-pseudo-invite"
            aria-invalid={error || undefined}
            className="border-trait bg-surface-2 min-h-12 max-w-sm rounded-xl border-2 px-4 font-mono text-lg"
          />
          <p
            id="aide-pseudo-invite"
            className={error ? "text-faute font-semibold" : "text-sourdine text-sm"}
            role={error ? "alert" : undefined}
          >
            {error ? t.error : t.help}
          </p>
          <button
            type="submit"
            className="bg-jaune font-display text-nuit min-h-14 self-start rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
          >
            {t.submit}
          </button>
        </form>
      </section>
      <section className="bg-surface-2 flex min-w-0 flex-[1_1_280px] flex-col items-start gap-4 self-start rounded-3xl p-7">
        <p>{t.account}</p>
        <Link
          href={`/connexion?suite=/salle/${code}`}
          className="bg-surface inline-flex min-h-12 items-center rounded-xl px-5 font-bold"
        >
          {login}
        </Link>
      </section>
    </div>
  );
}

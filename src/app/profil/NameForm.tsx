"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { updateDisplayName, type NameState } from "./actions";

type Props = { name: string; t: Dictionary["profile"] };

const initial: NameState = { error: false };

const field =
  "bg-surface-2 text-encre focus:border-bleu focus:bg-surface h-[52px] w-full rounded-[14px] border-2 px-4 text-[17px] font-semibold transition-colors outline-none";

// AUTH-05 : le pseudonyme affiché. Un nom refusé s'affiche sous le champ,
// sans recharger la page ; un nom accepté recharge le profil avec son message.
export function NameForm({ name, t }: Props) {
  const [{ error, name: typed }, action, pending] = useActionState(updateDisplayName, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="pseudonyme-affiche" className="text-[15px] font-bold">
          {t.nameLabel}
        </label>
        <input
          id="pseudonyme-affiche"
          name="name"
          required
          minLength={3}
          maxLength={20}
          defaultValue={typed ?? name}
          autoComplete="nickname"
          aria-describedby="aide-pseudonyme"
          aria-invalid={error || undefined}
          className={`${field} ${error ? "border-faute" : "border-trait"}`}
        />
        <p
          id="aide-pseudonyme"
          role={error ? "alert" : undefined}
          className={error ? "text-faute font-semibold" : "text-sourdine text-[13px]"}
        >
          {error ? t.errors.nom : t.nameHelp}
        </p>
      </div>
      <button
        type="submit"
        aria-busy={pending}
        disabled={pending}
        className="btn btn-bleu self-start"
      >
        {t.nameSubmit}
      </button>
    </form>
  );
}

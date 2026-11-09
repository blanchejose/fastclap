"use client";

import { useState } from "react";
import { removeAvatar, uploadAvatar } from "@/app/profil/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { AVATAR_MAX_BYTES } from "@/lib/avatar-limits";

type Props = { hasPhoto: boolean; t: Dictionary["profile"] };

// AUTH-04 : un premier contrôle de la taille dans le navigateur évite d'envoyer
// une grosse image pour rien ; le serveur refait toutes les vérifications.
export function AvatarForm({ hasPhoto, t }: Props) {
  const [tooBig, setTooBig] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <form
        action={uploadAvatar}
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          const file = (event.currentTarget.elements.namedItem("photo") as HTMLInputElement)
            .files?.[0];
          if (file && file.size > AVATAR_MAX_BYTES) {
            event.preventDefault();
            setTooBig(true);
          }
        }}
      >
        {/* Le bouton natif afficherait « Choose File » dans la langue du
            navigateur : un libellé traduit le remplace (I18N-01). */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="photo-profil"
            name="photo"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="aide-photo"
            onChange={(event) => {
              setTooBig(false);
              setFileName(event.currentTarget.files?.[0]?.name ?? null);
            }}
            className="peer sr-only"
          />
          <label
            htmlFor="photo-profil"
            className="bg-surface-2 peer-focus-visible:ring-focus inline-flex min-h-11 cursor-pointer items-center rounded-xl px-4 font-bold peer-focus-visible:ring-[3px]"
          >
            {t.photoLabel}
          </label>
          <span className="text-sourdine text-sm">{fileName ?? t.noFile}</span>
        </div>
        <p
          id="aide-photo"
          className={tooBig ? "text-faute font-semibold" : "text-sourdine text-sm"}
          role={tooBig ? "alert" : undefined}
        >
          {tooBig ? t.errors.taille : t.photoHelp}
        </p>
        <button
          type="submit"
          className="bg-jaune text-nuit min-h-12 self-start rounded-xl px-5 font-bold shadow-[0_4px_0_var(--orange)]"
        >
          {t.photoSubmit}
        </button>
      </form>
      {hasPhoto && (
        <form action={removeAvatar}>
          <button type="submit" className="text-faute font-bold underline underline-offset-4">
            {t.photoRemove}
          </button>
        </form>
      )}
    </div>
  );
}

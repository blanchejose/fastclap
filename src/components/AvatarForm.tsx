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
    <form
      action={uploadAvatar}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        // « Retirer la photo » envoie le même formulaire vers une autre action :
        // pas de contrôle de taille dans ce cas.
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter?.getAttribute("name") === "retirer") return;
        const file = (event.currentTarget.elements.namedItem("photo") as HTMLInputElement)
          .files?.[0];
        if (file && file.size > AVATAR_MAX_BYTES) {
          event.preventDefault();
          setTooBig(true);
        }
      }}
    >
      {/* Le bouton natif afficherait « Choose File » dans la langue du
          navigateur : une zone de dépôt traduite le remplace (I18N-01). */}
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
        className="border-trait text-sourdine hover:border-bleu hover:text-encre peer-focus-visible:ring-focus flex h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed px-4 text-center font-bold transition-colors peer-focus-visible:ring-[3px]"
      >
        <span className="text-encre">{fileName ?? t.photoLabel}</span>
        <span
          id="aide-photo"
          role={tooBig ? "alert" : undefined}
          className={tooBig ? "text-faute font-semibold" : "text-[13px] font-medium"}
        >
          {tooBig ? t.errors.taille : t.photoHelp}
        </span>
      </label>
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" className="btn btn-bleu">
          {t.photoSubmit}
        </button>
        {hasPhoto && (
          <button
            type="submit"
            name="retirer"
            formAction={removeAvatar}
            formNoValidate
            className="btn btn-contour"
          >
            {t.photoRemove}
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import type { InviteView } from "@/lib/invites";
import { ConfirmButton } from "./ConfirmButton";

export type InviteReply = { ok: true; invites: InviteView[] } | { ok: false };
export type InviteEvent = "invite:list" | "invite:create" | "invite:delete";

type Props = {
  // Demande au serveur la liste des liens, d'en créer un ou d'en supprimer un.
  request: (event: InviteEvent, reply: (r: InviteReply) => void, payload?: object) => void;
  version: number; // change quand quelqu'un entre avec un lien
  t: Dictionary["invite"];
};

// SALLE-04 : l'hôte génère un lien par invité, les copie, voit leur statut et
// supprime ceux qui ne lui conviennent plus.
export function InvitePanel({ request, version, t }: Props) {
  const [invites, setInvites] = useState<InviteView[]>([]);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const receive = (reply: InviteReply) => {
    if (!reply.ok) return;
    setOrigin(window.location.origin);
    setInvites(reply.invites);
  };

  useEffect(() => {
    request("invite:list", receive);
  }, [request, version]);

  const remove = (token: string) => request("invite:delete", receive, { token });

  async function copy(url: string, token: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Copie refusée : le lien reste affiché, on peut le sélectionner.
    }
  }

  return (
    <section
      aria-labelledby="titre-liens"
      className="carte motion-safe:animate-monte flex flex-col gap-4 p-5 [animation-delay:120ms] sm:p-6"
    >
      <h2 id="titre-liens" className="font-display text-[22px] font-extrabold">
        {t.panelTitle}
      </h2>
      <p className="text-sourdine text-[15px] leading-relaxed">{t.panelLead}</p>
      <button
        type="button"
        onClick={() => request("invite:create", receive)}
        className="btn btn-contour self-start"
      >
        {t.create}
      </button>
      {invites.length === 0 ? (
        <p className="text-sourdine">{t.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {invites.map((invite, i) => {
            const url = `${origin}/invitation/${invite.token}`;
            const label = fmt(t.linkLabel, { n: i + 1 });
            return (
              <li
                key={invite.token}
                className="bg-surface-2 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-2.5"
              >
                <span className="font-bold">{label}</span>
                <span
                  className={`text-sm ${invite.status === "UNUSED" ? "text-sourdine" : "font-semibold"}`}
                >
                  {fmt(t.status[invite.status], { name: invite.usedByName ?? "" })}
                </span>
                <input
                  readOnly
                  value={url}
                  aria-label={label}
                  onFocus={(e) => e.currentTarget.select()}
                  className="border-trait bg-surface min-h-11 min-w-0 flex-1 basis-64 rounded-xl border-2 px-3 font-mono text-xs"
                />
                {invite.status !== "REVOKED" && (
                  <button
                    type="button"
                    onClick={() => copy(url, invite.token)}
                    className="bg-surface min-h-11 rounded-xl px-4 text-sm font-bold"
                  >
                    {copied === invite.token ? t.copied : t.copy}
                  </button>
                )}
                {invite.status === "USED" ? (
                  // Un lien utilisé : son invité ne pourra plus revenir, on confirme.
                  <ConfirmButton
                    label={t.delete}
                    question={fmt(t.confirmDelete, { name: invite.usedByName ?? "" })}
                    yes={t.confirmDeleteYes}
                    no={t.confirmDeleteNo}
                    onConfirm={() => remove(invite.token)}
                    triggerClassName="text-faute min-h-11 rounded-xl px-3 text-sm font-bold underline underline-offset-4"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => remove(invite.token)}
                    aria-label={fmt(t.deleteLabel, { label })}
                    className="text-faute min-h-11 rounded-xl px-3 text-sm font-bold underline underline-offset-4"
                  >
                    {t.delete}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

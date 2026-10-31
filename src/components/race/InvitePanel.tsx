"use client";

import { useEffect, useState } from "react";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import type { InviteView } from "@/lib/invites";

export type InviteReply = { ok: true; invites: InviteView[] } | { ok: false };

type Props = {
  // Demande au serveur la liste des liens, ou d'en créer un.
  request: (event: "invite:list" | "invite:create", reply: (r: InviteReply) => void) => void;
  version: number; // change quand quelqu'un entre avec un lien
  t: Dictionary["invite"];
};

// SALLE-04 : l'hôte génère un lien par invité, les copie et voit leur statut.
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
      className="bg-surface flex flex-col gap-4 rounded-3xl p-7"
    >
      <h2 id="titre-liens" className="font-display text-3xl font-extrabold">
        {t.panelTitle}
      </h2>
      <p className="text-sourdine">{t.panelLead}</p>
      <button
        type="button"
        onClick={() => request("invite:create", receive)}
        className="bg-surface-2 min-h-11 self-start rounded-xl px-4 font-bold"
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

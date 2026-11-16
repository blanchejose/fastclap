"use client";

import { useState, type ReactNode } from "react";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import { BOT_LEVELS, type BotLevel } from "@/lib/race/bots";
import type { ConfigPatch } from "@/lib/race/config";
import type { Role, RoomView } from "@/lib/race/engine";
import { isGuestId } from "@/lib/guest-id";
import { Avatar } from "./Avatar";
import { ConfigPanel, type ConfigReply } from "./ConfigPanel";
import { ConfirmButton } from "./ConfirmButton";

type Props = {
  view: RoomView;
  meId: string;
  send: (event: string, payload?: object) => void;
  updateConfig: (patch: ConfigPatch, reply: (r: ConfigReply) => void) => void;
  // Panneau des liens d'invitation (hôte seulement), placé sous les participants.
  invites?: ReactNode;
  t: Pick<Dictionary, "room" | "config" | "levels">;
};

function Fleche() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="fleche size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Salle d'attente (EN_ATTENTE) : code à partager, participants et bots à
// gauche, configuration à droite, et la barre de départ collée en bas
// (COURSE-02 : seul l'hôte lance).
export function WaitingRoom({ view, meId, send, updateConfig, invites, t }: Props) {
  const isHost = view.hostId === meId;
  const me = view.members.find((m) => m.id === meId);
  const racers = view.members.filter((m) => m.role === "PLAYER");
  const spectators = view.members.filter((m) => m.role === "SPECTATOR");
  const r = t.room;

  const roleControl = me && (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-sourdine text-sm font-bold">{r.roleLabel}</span>
      <div className="seg" role="group" aria-label={r.roleLabel}>
        {(["PLAYER", "SPECTATOR"] as Role[]).map((role) => (
          <button
            key={role}
            type="button"
            aria-pressed={me.role === role}
            onClick={() => me.role !== role && send("room:role", { role })}
          >
            {role === "PLAYER" ? r.rolePlayer : r.roleSpectator}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-7">
      {/* Sur mobile : code, participants, configuration, puis liens. Sur grand
          écran : la configuration occupe toute la colonne de droite. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-7">
        <CodeCard code={view.code} t={r} />

        <section
          aria-labelledby="titre-joueurs"
          className="carte motion-safe:animate-monte flex min-w-0 flex-col p-4 [animation-delay:80ms] sm:p-5 lg:col-start-1"
        >
          <div className="flex items-center justify-between px-1.5 pb-2.5">
            <h2 id="titre-joueurs" className="font-display text-[22px] font-extrabold">
              {r.players}
            </h2>
            <span className="text-sourdine font-mono font-bold tabular-nums">
              {racers.length}/{view.config.maxPlayers}
            </span>
          </div>
          <MemberList members={racers} view={view} meId={meId} isHost={isHost} send={send} t={r} />

          {spectators.length > 0 && (
            <>
              <h3 className="font-display px-1.5 pt-4 pb-2 text-lg font-extrabold">
                {r.spectators} · {spectators.length}
              </h3>
              <MemberList
                members={spectators}
                view={view}
                meId={meId}
                isHost={isHost}
                send={send}
                t={r}
              />
            </>
          )}

          {isHost && <AddBot send={send} t={r} />}
        </section>

        <div className="min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <ConfigPanel
            config={view.config}
            isHost={isHost}
            update={updateConfig}
            aside={roleControl}
            t={t.config}
            levels={t.levels}
          />
        </div>

        {invites && <div className="min-w-0 lg:col-start-1">{invites}</div>}
      </div>

      <div className="barre-depart motion-safe:animate-monte [animation-delay:240ms]">
        <p
          className="flex items-center gap-3 text-[17px] font-bold"
          aria-live="polite"
          id="etat-depart"
        >
          <span
            aria-hidden="true"
            className={`live motion-safe:animate-pouls ${
              isHost && view.startBlocker ? "bg-orange" : "bg-[#3dd68c]"
            }`}
          />
          {!isHost ? r.waitHost : view.startBlocker ? r.blockers[view.startBlocker] : r.ready}
        </p>
        {isHost && (
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <ConfirmButton
              label={r.close}
              question={r.confirmClose}
              yes={r.confirmCloseYes}
              no={r.confirmCloseNo}
              onConfirm={() => send("room:close")}
              triggerClassName="btn bg-white/10 text-white hover:bg-white/20"
            />
            <button
              type="button"
              disabled={view.startBlocker !== null}
              aria-describedby="etat-depart"
              onClick={() => send("race:start")}
              className="btn-go flex-1 px-6 py-4 text-xl whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none sm:flex-none"
            >
              {r.start}
              <Fleche />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Le code en grosses touches, et le bouton pour le copier.
function CodeCard({ code, t }: { code: string; t: Dictionary["room"] }) {
  const [copied, setCopied] = useState(false);
  const shown = `${code.slice(0, 3)}-${code.slice(3)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée : le code reste affiché en grand, on peut le lire.
    }
  }

  return (
    <section
      aria-labelledby="titre-code"
      className="carte motion-safe:animate-monte flex min-w-0 flex-col gap-4 p-5 sm:p-6 lg:col-start-1"
    >
      <h2 id="titre-code" className="eyebrow">
        {t.code}
      </h2>
      <p className="sr-only">{shown}</p>
      <div className="code-geant" aria-hidden="true">
        {[...shown].map((char, i) =>
          char === "-" ? (
            <span key={i} className="tiret">
              -
            </span>
          ) : (
            <span key={i} style={{ animationDelay: `${i * 60}ms` }}>
              {char}
            </span>
          ),
        )}
      </div>
      <p className="text-sourdine leading-relaxed">{t.share}</p>
      <button type="button" onClick={copy} className="btn btn-bleu">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {copied ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          ) : (
            <>
              <rect x="9" y="9" width="11" height="11" rx="2.5" />
              <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
            </>
          )}
        </svg>
        <span aria-live="polite">{copied ? t.copied : t.copy}</span>
      </button>
    </section>
  );
}

function MemberList({
  members,
  view,
  meId,
  isHost,
  send,
  t,
}: {
  members: RoomView["members"];
  view: RoomView;
  meId: string;
  isHost: boolean;
  send: Props["send"];
  t: Dictionary["room"];
}) {
  return (
    <ul className="flex flex-col gap-0.5" aria-live="polite">
      {members.map((m, i) => {
        const removable = isHost && m.id !== meId;
        return (
          <li
            key={m.id}
            className="joueur motion-safe:animate-monte"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <Avatar
              name={m.name}
              src={m.avatar}
              className={`size-11 rounded-[14px] text-sm ${m.connected ? "" : "opacity-50"}`}
            />
            <span className="flex min-w-0 flex-wrap items-center gap-2 font-bold">
              <span className="truncate">{m.name}</span>
              {m.id === view.hostId && <span className="badge badge-hote">{t.organizer}</span>}
              {m.id === meId && <span className="badge">{t.you}</span>}
              {isGuestId(m.id) && <span className="badge">{t.guest}</span>}
              {m.kind === "BOT" && m.botLevel && (
                <span className="badge">
                  {t.bot} · {t.botLevels[m.botLevel]}
                </span>
              )}
              {!m.connected && (
                <span className="text-sourdine text-sm font-medium">{t.disconnected}</span>
              )}
            </span>
            {removable && (
              <button
                type="button"
                onClick={() => send(m.kind === "BOT" ? "bot:remove" : "room:kick", { id: m.id })}
                aria-label={fmt(m.kind === "BOT" ? t.removeBot : t.kick, { name: m.name })}
                className="icon-btn hover:text-faute size-9 rounded-[10px]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// BOT-01 : l'hôte choisit un niveau puis ajoute le bot.
function AddBot({ send, t }: { send: Props["send"]; t: Dictionary["room"] }) {
  const [level, setLevel] = useState<BotLevel>("INTERMEDIATE");
  return (
    <div className="border-trait mt-3.5 flex flex-col gap-3 border-t px-1.5 pt-3.5">
      <div className="seg" role="group" aria-label={t.botLevelLabel}>
        {BOT_LEVELS.map((l) => (
          <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>
            {t.botLevels[l]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => send("bot:add", { level })}
        className="btn btn-contour w-full"
      >
        + {t.addBot}
      </button>
    </div>
  );
}

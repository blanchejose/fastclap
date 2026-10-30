"use client";

import { useState } from "react";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import { BOT_LEVELS, type BotLevel } from "@/lib/race/bots";
import type { Role, RoomView } from "@/lib/race/engine";
import { Avatar } from "./Avatar";
import { ConfirmButton } from "./ConfirmButton";

type Props = {
  view: RoomView;
  meId: string;
  send: (event: string, payload?: object) => void;
  t: Dictionary["room"];
};

function formatCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

const buttonSmall = "min-h-11 rounded-xl px-3 text-sm font-semibold";

// Salle d'attente (EN_ATTENTE) : code à partager, participants, spectateurs,
// bots et bouton de départ réservé à l'hôte (COURSE-02).
export function WaitingRoom({ view, meId, send, t }: Props) {
  const [copied, setCopied] = useState(false);
  const [level, setLevel] = useState<BotLevel>("INTERMEDIATE");
  const isHost = view.hostId === meId;
  const me = view.members.find((m) => m.id === meId);
  const racers = view.members.filter((m) => m.role === "PLAYER");
  const spectators = view.members.filter((m) => m.role === "SPECTATOR");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(formatCode(view.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée : le code reste affiché en grand, l'élève peut le lire.
    }
  }

  const memberList = (members: typeof view.members) => (
    <ul className="flex flex-col gap-2" aria-live="polite">
      {members.map((m) => (
        <li key={m.id} className="bg-surface-2 flex items-center gap-3 rounded-2xl px-4 py-2">
          <Avatar name={m.name} />
          <span className="flex-1 font-semibold">
            {m.name}
            {m.kind === "BOT" && m.botLevel && (
              <span className="text-sourdine ml-2 font-mono text-xs">
                {t.bot} · {t.botLevels[m.botLevel]}
              </span>
            )}
            {m.id === view.hostId && (
              <span className="text-sourdine ml-2 text-sm">({t.organizer})</span>
            )}
            {m.id === meId && <span className="text-sourdine ml-2 text-sm">({t.you})</span>}
            {!m.connected && <span className="text-sourdine ml-2 text-sm">· {t.disconnected}</span>}
          </span>
          {isHost && m.kind === "BOT" && (
            <button
              type="button"
              onClick={() => send("bot:remove", { id: m.id })}
              className={`text-faute hover:bg-surface ${buttonSmall}`}
            >
              {fmt(t.removeBot, { name: m.name })}
            </button>
          )}
          {isHost && m.kind === "HUMAN" && m.id !== meId && (
            <button
              type="button"
              onClick={() => send("room:kick", { id: m.id })}
              className={`text-faute hover:bg-surface ${buttonSmall}`}
            >
              {fmt(t.kick, { name: m.name })}
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-wrap gap-6">
      <section className="bg-bleu flex min-w-0 flex-[1_1_320px] flex-col gap-4 self-start rounded-3xl p-7 text-white">
        <span className="font-mono text-xs font-semibold tracking-widest text-white/80 uppercase">
          {t.code}
        </span>
        <span className="font-mono text-6xl font-semibold tracking-widest">
          {formatCode(view.code)}
        </span>
        <p className="text-white/90">{t.share}</p>
        <button
          type="button"
          onClick={copyCode}
          className="text-nuit min-h-11 self-start rounded-xl bg-white px-4 font-bold transition hover:bg-[#E6EAFB]"
        >
          {copied ? t.copied : t.copy}
        </button>
      </section>

      <section className="bg-surface flex min-w-0 flex-[2_1_420px] flex-col gap-5 rounded-3xl p-7">
        <h2 className="font-display text-3xl font-extrabold">
          {t.players} · {racers.length}/{view.config.maxPlayers}
        </h2>
        {memberList(racers)}

        {spectators.length > 0 && (
          <>
            <h3 className="font-display text-xl font-extrabold">
              {t.spectators} · {spectators.length}
            </h3>
            {memberList(spectators)}
          </>
        )}

        {me && (
          <fieldset className="flex flex-wrap items-center gap-3">
            <legend className="mb-2 font-bold">{t.roleLabel}</legend>
            {(["PLAYER", "SPECTATOR"] as Role[]).map((role) => (
              <label
                key={role}
                className="border-trait has-[:checked]:border-bleu has-[:checked]:bg-surface-2 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-4"
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={me.role === role}
                  onChange={() => send("room:role", { role })}
                  className="size-5 accent-[var(--bleu)]"
                />
                {role === "PLAYER" ? t.rolePlayer : t.roleSpectator}
              </label>
            ))}
          </fieldset>
        )}

        {isHost && (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              send("bot:add", { level });
            }}
          >
            <label className="flex flex-col gap-1 font-bold">
              {t.botLevelLabel}
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value as BotLevel)}
                className="border-trait bg-surface min-h-11 rounded-xl border-2 px-3 font-normal"
              >
                {BOT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {t.botLevels[l]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="bg-surface-2 min-h-11 rounded-xl px-4 font-bold">
              {t.addBot}
            </button>
          </form>
        )}

        {isHost ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={view.startBlocker !== null}
              aria-describedby="etat-depart"
              onClick={() => send("race:start")}
              className="bg-jaune font-display text-nuit min-h-14 self-start rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.start}
            </button>
            <p id="etat-depart" className="text-sourdine text-sm" aria-live="polite">
              {view.startBlocker ? t.blockers[view.startBlocker] : t.ready}
            </p>
            <div className="border-trait mt-3 border-t pt-4">
              <ConfirmButton
                label={t.close}
                question={t.confirmClose}
                yes={t.confirmCloseYes}
                no={t.confirmCloseNo}
                onConfirm={() => send("room:close")}
              />
            </div>
          </div>
        ) : (
          <p className="text-sourdine" aria-live="polite">
            {t.waitHost}
          </p>
        )}
      </section>
    </div>
  );
}

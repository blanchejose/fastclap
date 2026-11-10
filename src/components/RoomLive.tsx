"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { fmt, type Dictionary, type Locale } from "@/i18n/dictionaries";
import { isGuestId } from "@/lib/guest-id";
import { MAX_KEYS_PER_BATCH, type JoinResult, type RoomView } from "@/lib/race/engine";
import { accuracy, netWpm } from "@/lib/race/stats";
import { applyKey, correctChars, newTyping, progress, type Typing } from "@/lib/race/typing";
import { BonusFeed } from "./race/BonusFeed";
import { ConfigPanel } from "./race/ConfigPanel";
import { InvitePanel, type InviteReply } from "./race/InvitePanel";
import { ConfirmButton } from "./race/ConfirmButton";
import { Countdown } from "./race/Countdown";
import { Results } from "./race/Results";
import { Track } from "./race/Track";
import { TypingZone } from "./race/TypingZone";
import { WaitingRoom } from "./race/WaitingRoom";

type Props = {
  code: string;
  token: string;
  meId: string;
  locale: Locale;
  t: Pick<
    Dictionary,
    "room" | "race" | "results" | "config" | "levels" | "invite" | "bonus" | "charts" | "history"
  >;
};

type JoinReply =
  | JoinResult
  | { ok: false; reason: "invalid" | "private" | "too_many" }
  | { ok: false; reason: "elsewhere"; otherCode: string };
type Saved = { raceNo: number; raceId: string; records: string[] };
type RaceText = { raceNo: number; text: string };
type Resync = { raceNo: number; typed: string; keystrokes: number; errors: number };

const FLUSH_MS = 100; // PERF-02 : au plus 10 lots de touches par seconde

// Heure du serveur, rafraîchie 10 fois par seconde pour le décompte et le MPM
// en direct. Le décalage avec l'horloge locale change à chaque diffusion : il
// est lu dans une ref pour ne pas relancer l'intervalle à chaque fois.
function useServerClock(offsetRef: React.RefObject<number>, active: boolean): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now() + offsetRef.current), 100);
    return () => clearInterval(id);
  }, [offsetRef, active]);
  return now;
}

// Composant client : la salle et ses courses, en direct. Le serveur Socket.IO
// diffuse l'état ; la frappe est calculée ici pour un retour immédiat, puis
// rejouée par le serveur, qui a toujours le dernier mot (COURSE-06).
export function RoomLive({ code, token, meId, locale, t }: Props) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const typingRef = useRef<Typing>(newTyping());
  const pendingRef = useRef<string[]>([]);
  const [view, setView] = useState<RoomView | null>(null);
  const [inviteVersion, setInviteVersion] = useState(0);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [race, setRace] = useState<RaceText | null>(null);
  const [typing, setTyping] = useState<Typing>(newTyping);
  const clockOffsetRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [kicked, setKicked] = useState(false);
  const [moved, setMoved] = useState(false);
  const [elsewhere, setElsewhere] = useState<string | null>(null);
  const joinRef = useRef<(leaveOther: boolean) => void>(() => {});

  useEffect(() => {
    const socket = io({ auth: { token } });
    socketRef.current = socket;
    const resetTyping = (next: Typing) => {
      typingRef.current = next;
      pendingRef.current = [];
      setTyping({ ...next });
    };

    // SALLE-06 : déjà dans une autre salle ? Le serveur refuse, et on propose
    // de la quitter (leaveOther).
    const join = (leaveOther: boolean) =>
      socket.emit("room:join", { code, leaveOther }, (reply: JoinReply) => {
        if (reply.ok) setElsewhere(null);
        else if (reply.reason === "elsewhere") setElsewhere(reply.otherCode);
        else setError(t.room.errors[reply.reason]);
      });
    joinRef.current = join;
    socket.on("connect", () => {
      setError(null);
      // Rejoint aussi après une reconnexion : le serveur renvoie alors le
      // texte et la progression gardée (COURSE-08).
      join(false);
    });
    socket.on("room:state", (next: RoomView) => {
      setView(next);
      clockOffsetRef.current = next.serverNow - Date.now();
    });
    // BONUS-04 : mon texte a été raccourci ou allongé ; ce qui est tapé reste.
    // RES-04, RES-05 : la course est enregistrée ; voici les records battus.
    socket.on("race:saved", (next: Saved) => setSaved(next));
    socket.on("race:mytext", (next: RaceText) =>
      setRace((current) => (current && current.raceNo === next.raceNo ? next : current)),
    );
    socket.on("race:text", (next: RaceText) => {
      setRace(next);
      resetTyping(newTyping());
    });
    socket.on("race:resync", (r: Resync) =>
      resetTyping({ typed: r.typed, keystrokes: r.keystrokes, errors: r.errors, missed: {} }),
    );
    socket.on("room:kicked", () => setKicked(true));
    socket.on("room:moved", () => setMoved(true));
    socket.on("invite:update", () => setInviteVersion((v) => v + 1));
    socket.on("connect_error", () => setError(t.room.errors.connection));

    // Les touches partent par lots plutôt qu'une à une (PERF-02).
    const flush = setInterval(() => {
      if (pendingRef.current.length === 0 || !socket.connected) return;
      socket.emit("race:keys", { keys: pendingRef.current.splice(0, MAX_KEYS_PER_BATCH) });
    }, FLUSH_MS);

    return () => {
      clearInterval(flush);
      socket.disconnect();
    };
  }, [code, token, t]);

  const inRace = view?.phase === "COUNTDOWN" || view?.phase === "RUNNING";
  const now = useServerClock(clockOffsetRef, inRace);

  const send = (event: string, payload: object = {}) => socketRef.current?.emit(event, payload);
  // Stable : le panneau des liens redemande la liste seulement quand `version` change.
  const requestInvites = useCallback(
    (event: "invite:list" | "invite:create", reply: (r: InviteReply) => void) =>
      socketRef.current?.emit(event, {}, reply),
    [],
  );

  if (kicked) return <Notice>{t.room.kicked}</Notice>;
  if (moved) return <Notice>{t.room.moved}</Notice>;
  if (elsewhere) {
    const other = `${elsewhere.slice(0, 3)}-${elsewhere.slice(3)}`;
    return (
      <div role="alert" className="bg-surface flex flex-col items-start gap-4 rounded-3xl p-6">
        <p className="text-lg font-semibold">{fmt(t.room.elsewhere, { code: other })}</p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => joinRef.current(true)}
            className="bg-jaune text-nuit min-h-12 rounded-xl px-5 font-bold shadow-[0_4px_0_var(--orange)]"
          >
            {fmt(t.room.switchRoom, { code: other })}
          </button>
          <a href={`/salle/${elsewhere}`} className="font-bold underline underline-offset-4">
            {fmt(t.room.backToRoom, { code: other })}
          </a>
        </div>
      </div>
    );
  }
  if (error) return <Notice>{error}</Notice>;
  if (!view) return <p className="text-sourdine">…</p>;
  if (view.phase === "CLOSED") return <Notice>{t.room.closed}</Notice>;

  const isHost = view.hostId === meId;
  const me = view.members.find((m) => m.id === meId);
  const myRacer = view.racers.find((r) => r.id === meId);
  const text = race && race.raceNo === view.raceNo ? race.text : null;
  const racing = view.phase === "RUNNING" && myRacer?.status === "RACING";

  function onKey(key: string) {
    if (!racing || !text || !view) return;
    const outcome = applyKey(typingRef.current, text, key, view.config.errorMode);
    if (outcome === "ignored") return;
    pendingRef.current.push(key);
    setTyping({ ...typingRef.current });
  }

  function leave() {
    send("room:leave");
    router.push("/salles");
  }

  const elapsed = view.startAt !== null && now > 0 ? Math.max(0, now - view.startAt) : 0;
  const local =
    myRacer && text
      ? {
          progress: myRacer.status === "RACING" ? progress(typing, text) : myRacer.progress,
          wpm:
            myRacer.status === "RACING" ? netWpm(correctChars(typing, text), elapsed) : myRacer.wpm,
        }
      : null;
  const trackT = { ...t.race, you: t.room.you, bot: t.room.bot, guest: t.room.guest };

  return (
    <div className="flex flex-col gap-6">
      {view.phase === "WAITING" && (
        <>
          <WaitingRoom view={view} meId={meId} send={send} t={t.room} />
          <ConfigPanel
            config={view.config}
            isHost={isHost}
            update={(patch, reply) => socketRef.current?.emit("room:config", patch, reply)}
            t={t.config}
            levels={t.levels}
          />
          {isHost && <InvitePanel request={requestInvites} version={inviteVersion} t={t.invite} />}
        </>
      )}

      {inRace && (
        <>
          {view.phase === "COUNTDOWN" && view.startAt !== null && now > 0 && (
            <Countdown msLeft={view.startAt - now} t={t.race} />
          )}
          <BonusFeed events={view.bonusEvents} meId={meId} t={t.bonus} />
          <RaceHeader
            phase={view.phase}
            elapsed={elapsed}
            deadline={view.deadline}
            now={now}
            typing={typing}
            local={local}
            t={t.race}
          />
          {myRacer && text && (
            <>
              <TypingZone
                text={text}
                typing={typing}
                active={racing}
                mode={view.config.errorMode}
                fogged={myRacer.fogUntil !== null && now > 0 && now < myRacer.fogUntil}
                onKey={onKey}
                t={t.race}
              />
              <p className="bg-surface rounded-2xl p-4 md:hidden">{t.race.mobile}</p>
            </>
          )}
          <Track
            racers={view.racers}
            meId={meId}
            local={local}
            t={trackT}
            effects={Object.fromEntries(view.bonusEvents.map((e) => [e.targetId, e.type]))}
            bonusNames={t.bonus.names}
          />
          <RaceStatus
            status={myRacer?.status ?? null}
            spectating={!myRacer}
            canAbandon={racing}
            onAbandon={() => send("race:abandon")}
            t={t.race}
          />
        </>
      )}

      {view.phase === "RESULTS" && (
        <>
          <Results
            racers={view.racers}
            meId={meId}
            records={saved?.raceNo === view.raceNo ? saved.records : []}
            locale={locale}
            t={{
              ...t.results,
              statuses: t.race.status,
              you: t.room.you,
              bot: t.room.bot,
              bonusNames: t.bonus.names,
              charts: t.charts,
            }}
            actions={
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {/* COURSE-11 : une action principale (relancer), les autres en retrait. */}
                {isHost ? (
                  <button
                    type="button"
                    onClick={() => send("room:lobby")}
                    className="bg-jaune font-display text-nuit min-h-14 rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
                  >
                    {t.results.again}
                  </button>
                ) : (
                  <p className="text-sourdine">{t.results.waitHost}</p>
                )}
                {/* HIST-02 : la course est dans l'historique des utilisateurs connectés. */}
                {saved?.raceNo === view.raceNo && myRacer && !isGuestId(meId) && (
                  <Link
                    href={`/course/${saved.raceId}`}
                    className="font-bold underline underline-offset-4"
                  >
                    {t.history.view}
                  </Link>
                )}
                {isHost && (
                  <div className="flex">
                    <ConfirmButton
                      label={t.results.close}
                      question={t.room.confirmClose}
                      yes={t.room.confirmCloseYes}
                      no={t.room.confirmCloseNo}
                      onConfirm={() => send("room:close")}
                    />
                  </div>
                )}
              </div>
            }
          />
        </>
      )}

      {me && !inRace && (
        <button
          type="button"
          onClick={leave}
          className="self-start font-bold underline underline-offset-4"
        >
          {t.room.leave}
        </button>
      )}
    </div>
  );
}

function RaceHeader({
  phase,
  elapsed,
  deadline,
  now,
  typing,
  local,
  t,
}: {
  phase: RoomView["phase"];
  elapsed: number;
  deadline: number | null;
  now: number;
  typing: Typing;
  local: { wpm: number } | null;
  t: Dictionary["race"];
}) {
  const clock = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <span className="font-mono text-3xl font-semibold tabular-nums">
        {clock(phase === "RUNNING" ? elapsed : 0)}
      </span>
      {deadline !== null && now > 0 && (
        <span className="text-sourdine font-mono">
          {t.timeLeft} {clock(deadline - now)}
        </span>
      )}
      {local && (
        <dl className="flex gap-5 font-mono">
          <div className="flex gap-1.5">
            <dt className="text-sourdine">{t.wpm}</dt>
            <dd className="font-semibold tabular-nums">{local.wpm}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-sourdine">{t.accuracy}</dt>
            <dd className="font-semibold tabular-nums">
              {accuracy(typing.keystrokes, typing.errors)} %
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-sourdine">{t.errors}</dt>
            <dd className="font-semibold tabular-nums">{typing.errors}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function RaceStatus({
  status,
  spectating,
  canAbandon,
  onAbandon,
  t,
}: {
  status: RoomView["racers"][number]["status"] | null;
  spectating: boolean;
  canAbandon: boolean;
  onAbandon: () => void;
  t: Dictionary["race"];
}) {
  if (spectating) return <p className="text-sourdine">{t.spectating}</p>;
  if (status === "FINISHED") return <p className="font-semibold">{t.finished}</p>;
  if (status === "ABANDONED") return <p className="text-sourdine">{t.abandoned}</p>;
  if (!canAbandon) return null;
  // COURSE-07 : l'abandon demande une confirmation.
  return (
    <ConfirmButton
      label={t.abandon}
      question={t.confirmAbandon}
      yes={t.confirmYes}
      no={t.confirmNo}
      onConfirm={onAbandon}
    />
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="bg-surface rounded-3xl p-6 text-lg font-semibold">
      {children}
    </p>
  );
}

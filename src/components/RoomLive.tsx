"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Dictionary, Locale } from "@/i18n/dictionaries";
import { MAX_KEYS_PER_BATCH, type JoinResult, type RoomView } from "@/lib/race/engine";
import { accuracy, netWpm } from "@/lib/race/stats";
import { applyKey, correctChars, newTyping, progress, type Typing } from "@/lib/race/typing";
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
  t: Pick<Dictionary, "room" | "race" | "results">;
};

type JoinReply = JoinResult | { ok: false; reason: "invalid" };
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
  const [race, setRace] = useState<RaceText | null>(null);
  const [typing, setTyping] = useState<Typing>(newTyping);
  const clockOffsetRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [kicked, setKicked] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const socket = io({ auth: { token } });
    socketRef.current = socket;
    const resetTyping = (next: Typing) => {
      typingRef.current = next;
      pendingRef.current = [];
      setTyping({ ...next });
    };

    socket.on("connect", () => {
      setError(null);
      // Rejoint aussi après une reconnexion : le serveur renvoie alors le
      // texte et la progression gardée (COURSE-08).
      socket.emit("room:join", { code }, (reply: JoinReply) => {
        if (!reply.ok) setError(t.room.errors[reply.reason]);
      });
    });
    socket.on("room:state", (next: RoomView) => {
      setView(next);
      clockOffsetRef.current = next.serverNow - Date.now();
    });
    socket.on("race:text", (next: RaceText) => {
      setRace(next);
      setConfirming(false);
      resetTyping(newTyping());
    });
    socket.on("race:resync", (r: Resync) =>
      resetTyping({ typed: r.typed, keystrokes: r.keystrokes, errors: r.errors, missed: {} }),
    );
    socket.on("room:kicked", () => setKicked(true));
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

  if (kicked) return <Notice>{t.room.kicked}</Notice>;
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
  const trackT = { ...t.race, you: t.room.you, bot: t.room.bot };

  return (
    <div className="flex flex-col gap-6">
      {view.phase === "WAITING" && <WaitingRoom view={view} meId={meId} send={send} t={t.room} />}

      {inRace && (
        <>
          {view.phase === "COUNTDOWN" && view.startAt !== null && now > 0 && (
            <Countdown msLeft={view.startAt - now} t={t.race} />
          )}
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
                onKey={onKey}
                t={t.race}
              />
              <p className="bg-surface rounded-2xl p-4 md:hidden">{t.race.mobile}</p>
            </>
          )}
          <Track racers={view.racers} meId={meId} local={local} t={trackT} />
          <RaceStatus
            status={myRacer?.status ?? null}
            spectating={!myRacer}
            canAbandon={racing}
            confirming={confirming}
            setConfirming={setConfirming}
            onAbandon={() => {
              send("race:abandon");
              setConfirming(false);
            }}
            t={t.race}
          />
        </>
      )}

      {view.phase === "RESULTS" && (
        <>
          <Results
            racers={view.racers}
            meId={meId}
            locale={locale}
            t={{ ...t.results, statuses: t.race.status, you: t.room.you, bot: t.room.bot }}
          />
          {isHost ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => send("room:lobby")}
                className="bg-jaune font-display text-nuit min-h-14 rounded-2xl px-7 text-2xl font-extrabold shadow-[0_5px_0_var(--orange)]"
              >
                {t.results.again}
              </button>
              <button
                type="button"
                onClick={() => send("room:close")}
                className="bg-surface min-h-14 rounded-2xl px-6 font-bold"
              >
                {t.results.close}
              </button>
            </div>
          ) : (
            <p className="text-sourdine">{t.results.waitHost}</p>
          )}
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
  confirming,
  setConfirming,
  onAbandon,
  t,
}: {
  status: RoomView["racers"][number]["status"] | null;
  spectating: boolean;
  canAbandon: boolean;
  confirming: boolean;
  setConfirming: (value: boolean) => void;
  onAbandon: () => void;
  t: Dictionary["race"];
}) {
  if (spectating) return <p className="text-sourdine">{t.spectating}</p>;
  if (status === "FINISHED") return <p className="font-semibold">{t.finished}</p>;
  if (status === "ABANDONED") return <p className="text-sourdine">{t.abandoned}</p>;
  if (!canAbandon) return null;
  // COURSE-07 : l'abandon demande une confirmation.
  return confirming ? (
    <div
      role="alertdialog"
      aria-labelledby="question-abandon"
      className="flex flex-wrap items-center gap-3"
    >
      <p id="question-abandon" className="font-semibold">
        {t.confirmAbandon}
      </p>
      <button
        type="button"
        onClick={onAbandon}
        className="border-faute text-faute bg-surface min-h-11 rounded-xl border-2 px-4 font-bold"
      >
        {t.confirmYes}
      </button>
      <button
        type="button"
        autoFocus
        onClick={() => setConfirming(false)}
        className="bg-surface-2 min-h-11 rounded-xl px-4 font-bold"
      >
        {t.confirmNo}
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-faute self-start font-bold underline underline-offset-4"
    >
      {t.abandon}
    </button>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="bg-surface rounded-3xl p-6 text-lg font-semibold">
      {children}
    </p>
  );
}

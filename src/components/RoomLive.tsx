"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { fmt, type Dictionary, type Locale } from "@/i18n/dictionaries";
import { isGuestId } from "@/lib/guest-id";
import {
  IDLE_OUT_MS,
  IDLE_WARNING_MS,
  MAX_KEYS_PER_BATCH,
  type JoinResult,
  type RoomView,
} from "@/lib/race/engine";
import { accuracy, netWpm } from "@/lib/race/stats";
import { initialRoomState, roomReducer, type RaceText, type Saved } from "@/lib/race/room-state";
import {
  applyKey,
  correctChars,
  newTyping,
  progress,
  type ErrorMode,
  type Typing,
} from "@/lib/race/typing";
import { BonusFeed } from "./race/BonusFeed";
import { InvitePanel, type InviteEvent, type InviteReply } from "./race/InvitePanel";
import { ConfirmButton } from "./race/ConfirmButton";
import { Countdown } from "./race/Countdown";
import { Results } from "./race/Results";
import { RoomContext } from "./race/RoomContext";
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
type Resync = { raceNo: number; typed: string; keystrokes: number; errors: number };

const FLUSH_MS = 100; // PERF-02 : au plus 10 lots de touches par seconde
const GO_MS = 700; // « Go ! » reste affiché un instant après le départ

// Heure du serveur, rafraîchie 10 fois par seconde pour le décompte et le MPM
// en direct. Le décalage avec l'horloge locale change à chaque diffusion : il
// est gardé dans une ref pour ne pas relancer l'intervalle à chaque fois.
function useServerClock(offset: number, active: boolean): number {
  const [now, setNow] = useState(0);
  const offsetRef = useRef(offset);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now() + offsetRef.current), 100);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

// Ma frappe : calculée ici pour un retour immédiat. Une ref garde l'état à
// jour entre deux rendus (un collage envoie plusieurs touches d'un coup), et
// une copie en état React sert à l'affichage.
function useTyping() {
  const ref = useRef<Typing>(newTyping());
  const pending = useRef<string[]>([]);
  const [typing, setTyping] = useState<Typing>(newTyping);
  const reset = useCallback((next: Typing) => {
    ref.current = next;
    pending.current = [];
    setTyping({ ...next });
  }, []);
  const type = (text: string, key: string, mode: ErrorMode): boolean => {
    if (applyKey(ref.current, text, key, mode) === "ignored") return false;
    pending.current.push(key);
    setTyping({ ...ref.current });
    return true;
  };
  return { typing, pending, reset, type };
}

// Composant client : la salle et ses courses, en direct. Le serveur Socket.IO
// diffuse l'état ; la frappe est calculée ici pour un retour immédiat, puis
// rejouée par le serveur, qui a toujours le dernier mot (COURSE-06).
export function RoomLive({ code, token, meId, locale, t }: Props) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);
  const { view, race, saved, inviteVersion, lastKeyAt, clockOffset } = state;
  const { typing, pending, reset, type } = useTyping();
  const joinRef = useRef<(leaveOther: boolean) => void>(() => {});

  useEffect(() => {
    const socket = io({ auth: { token } });
    socketRef.current = socket;

    // SALLE-06 : déjà dans une autre salle ? Le serveur refuse, et on propose
    // de la quitter (leaveOther).
    const join = (leaveOther: boolean) =>
      socket.emit("room:join", { code, leaveOther }, (reply: JoinReply) => {
        if (reply.ok) dispatch({ type: "joined" });
        else if (reply.reason === "elsewhere")
          dispatch({ type: "elsewhere", code: reply.otherCode });
        else dispatch({ type: "error", message: t.room.errors[reply.reason] });
      });
    joinRef.current = join;
    socket.on("connect", () => {
      dispatch({ type: "connected" });
      // Rejoint aussi après une reconnexion : le serveur renvoie alors le
      // texte et la progression gardée (COURSE-08).
      join(false);
    });
    socket.on("room:state", (next: RoomView) =>
      dispatch({ type: "state", view: next, localNow: Date.now() }),
    );
    socket.on("race:saved", (next: Saved) => dispatch({ type: "saved", saved: next }));
    socket.on("race:mytext", (next: RaceText) => dispatch({ type: "mytext", race: next }));
    socket.on("race:text", (next: RaceText) => {
      dispatch({ type: "text", race: next });
      reset(newTyping());
    });
    socket.on("race:resync", (r: Resync) =>
      reset({ typed: r.typed, keystrokes: r.keystrokes, errors: r.errors, missed: {} }),
    );
    socket.on("room:kicked", () => dispatch({ type: "kicked" }));
    socket.on("room:moved", () => dispatch({ type: "moved" }));
    socket.on("invite:update", () => dispatch({ type: "invites" }));
    socket.on("connect_error", () =>
      dispatch({ type: "error", message: t.room.errors.connection }),
    );

    // Les touches partent par lots plutôt qu'une à une (PERF-02).
    const flush = setInterval(() => {
      if (pending.current.length === 0 || !socket.connected) return;
      socket.emit("race:keys", { keys: pending.current.splice(0, MAX_KEYS_PER_BATCH) });
    }, FLUSH_MS);

    return () => {
      clearInterval(flush);
      socket.disconnect();
    };
  }, [code, token, t, reset, pending]);

  const inRace = view?.phase === "COUNTDOWN" || view?.phase === "RUNNING";
  const now = useServerClock(clockOffset, inRace);

  const send = useCallback(
    (event: string, payload: object = {}) => socketRef.current?.emit(event, payload),
    [],
  );
  // Stable : le panneau des liens redemande la liste seulement quand `version` change.
  const requestInvites = useCallback(
    (event: InviteEvent, reply: (r: InviteReply) => void, payload: object = {}) =>
      socketRef.current?.emit(event, payload, reply),
    [],
  );
  const isHost = view?.hostId === meId;
  const { kicked, moved, elsewhere, error } = state;
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

  const me = view.members.find((m) => m.id === meId);
  const myRacer = view.racers.find((r) => r.id === meId);
  const text = race && race.raceNo === view.raceNo ? race.text : null;
  const racing = view.phase === "RUNNING" && myRacer?.status === "RACING";

  function onKey(key: string) {
    if (!racing || !text || !view) return;
    if (type(text, key, view.config.errorMode))
      dispatch({ type: "typed", at: Date.now() + clockOffset });
  }

  function leave() {
    send("room:leave");
    router.push("/salles");
  }

  const elapsed = view.startAt !== null && now > 0 ? Math.max(0, now - view.startAt) : 0;
  const lastActive = Math.max(
    view.startAt ?? 0,
    lastKeyAt?.raceNo === view.raceNo ? lastKeyAt.at : 0,
  );
  const idleMs = view.phase === "RUNNING" && now > 0 ? now - lastActive : 0;
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
    <RoomContext value={{ view, meId, isHost, send, t }}>
      <div className="flex flex-col gap-6">
        {view.phase === "WAITING" && (
          <WaitingRoom
            updateConfig={(patch, reply) => socketRef.current?.emit("room:config", patch, reply)}
            invites={
              isHost && (
                <InvitePanel request={requestInvites} version={inviteVersion} t={t.invite} />
              )
            }
          />
        )}

        {inRace && (
          <>
            {view.startAt !== null && now > 0 && now - view.startAt < GO_MS && (
              <Countdown msLeft={view.startAt - now} t={t.race} />
            )}
            <RaceStats
              elapsed={view.phase === "RUNNING" ? elapsed : 0}
              deadline={view.deadline}
              now={now}
              typing={typing}
              local={local}
              t={t.race}
            />
            <Track
              racers={view.racers}
              meId={meId}
              local={local}
              t={trackT}
              effects={Object.fromEntries(view.bonusEvents.map((e) => [e.targetId, e.type]))}
              bonusNames={t.bonus.names}
            />
            <div
              className={`grid items-start gap-5 ${view.config.bonuses ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}
            >
              <div className="flex min-w-0 flex-col gap-4">
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
                    <p className="carte p-4 md:hidden">{t.race.mobile}</p>
                  </>
                )}
                {racing && idleMs >= IDLE_WARNING_MS && (
                  <p
                    role="alert"
                    className="carte border-orange! flex items-center gap-3 border-2 p-4 font-bold"
                  >
                    <span aria-hidden="true" className="live bg-orange motion-safe:animate-pouls" />
                    {fmt(t.race.idleWarning, {
                      n: Math.max(1, Math.ceil((IDLE_OUT_MS - idleMs) / 1000)),
                    })}
                  </p>
                )}
                <RaceStatus
                  idleOut={myRacer?.idleOut ?? false}
                  status={myRacer?.status ?? null}
                  spectating={!myRacer}
                  canAbandon={racing}
                  onAbandon={() => send("race:abandon")}
                  t={t.race}
                />
              </div>
              {view.config.bonuses && (
                <aside aria-label={t.bonus.feedLabel} className="flex min-w-0 flex-col gap-2.5">
                  {view.bonusEvents.length === 0 ? (
                    <p className="border-trait text-sourdine rounded-2xl border-2 border-dashed px-4 py-3.5 text-sm">
                      {t.bonus.empty}
                    </p>
                  ) : (
                    <BonusFeed events={view.bonusEvents} meId={meId} t={t.bonus} />
                  )}
                </aside>
              )}
            </div>
          </>
        )}

        {view.phase === "RESULTS" && (
          <>
            <Results
              racers={view.racers}
              meId={meId}
              records={saved?.raceNo === view.raceNo ? saved.records : []}
              locale={locale}
              code={code}
              t={{
                ...t.results,
                statuses: t.race.status,
                you: t.room.you,
                bot: t.room.bot,
                bonusNames: t.bonus.names,
                charts: t.charts,
              }}
              actions={
                <div className="flex flex-wrap items-center justify-center gap-3.5">
                  {/* COURSE-11 : une action principale (relancer), les autres en retrait. */}
                  {isHost ? (
                    <button
                      type="button"
                      onClick={() => send("room:lobby")}
                      className="btn-go w-full px-8 text-xl sm:w-auto sm:text-2xl"
                    >
                      {t.results.again}
                      <svg
                        className="fleche"
                        viewBox="0 0 24 24"
                        width="26"
                        height="26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  ) : (
                    <p className="text-sourdine font-semibold">{t.results.waitHost}</p>
                  )}
                  {/* HIST-02 : la course est dans l'historique des utilisateurs connectés. */}
                  {saved?.raceNo === view.raceNo && myRacer && !isGuestId(meId) && (
                    <Link
                      href={`/course/${saved.raceId}`}
                      className="btn btn-contour h-[70px] w-full px-7 sm:w-auto"
                    >
                      {t.history.view}
                    </Link>
                  )}
                  {isHost && (
                    <ConfirmButton
                      label={t.results.close}
                      question={t.room.confirmClose}
                      yes={t.room.confirmCloseYes}
                      no={t.room.confirmCloseNo}
                      onConfirm={() => send("room:close")}
                      triggerClassName="btn btn-contour h-[70px] w-full px-7 sm:w-auto"
                    />
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
            className="text-sourdine hover:text-encre self-start font-bold underline underline-offset-4 transition"
          >
            {t.room.leave}
          </button>
        )}
      </div>
    </RoomContext>
  );
}

// Les compteurs au-dessus de la piste : MPM, précision, fautes et temps
// (restant s'il y a une limite, sinon écoulé). Un spectateur voit le temps.
function RaceStats({
  elapsed,
  deadline,
  now,
  typing,
  local,
  t,
}: {
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
  const time =
    deadline !== null && now > 0
      ? { label: t.timeLeft, value: clock(deadline - now) }
      : { label: t.time, value: clock(elapsed) };
  return (
    <dl
      className={`motion-safe:animate-monte grid gap-3 sm:gap-3.5 ${local ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:max-w-xs"}`}
    >
      {local && (
        <>
          <div className="stat">
            <dt>{t.wpm}</dt>
            <dd>{local.wpm}</dd>
          </div>
          <div className="stat">
            <dt>{t.accuracy}</dt>
            <dd>{accuracy(typing.keystrokes, typing.errors)} %</dd>
          </div>
          <div className="stat">
            <dt>{t.errors}</dt>
            <dd className={typing.errors > 0 ? "text-faute" : undefined}>{typing.errors}</dd>
          </div>
        </>
      )}
      <div className="stat">
        <dt>{time.label}</dt>
        <dd className="font-mono!">{time.value}</dd>
      </div>
    </dl>
  );
}

function RaceStatus({
  idleOut,
  status,
  spectating,
  canAbandon,
  onAbandon,
  t,
}: {
  idleOut: boolean;
  status: RoomView["racers"][number]["status"] | null;
  spectating: boolean;
  canAbandon: boolean;
  onAbandon: () => void;
  t: Dictionary["race"];
}) {
  if (spectating) return <p className="carte text-sourdine p-4 font-semibold">{t.spectating}</p>;
  if (status === "FINISHED")
    return (
      <p className="carte motion-safe:animate-monte p-4 text-lg font-bold">
        <span aria-hidden="true">🏁 </span>
        {t.finished}
      </p>
    );
  if (status === "ABANDONED")
    return <p className="carte text-sourdine p-4">{idleOut ? t.idleOut : t.abandoned}</p>;
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

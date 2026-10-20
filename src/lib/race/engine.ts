// Moteur d'une salle et de ses courses : la machine à états de COURSE-01
// (docs/ARCHITECTURE.md, section 2). Code pur, sans réseau ni base de données :
// le serveur Socket.IO l'appelle et les tests Vitest le vérifient. Le temps
// (`now`, en ms) est toujours passé en paramètre pour que tout soit prévisible.
import { createBot, stepBot, type Bot, type BotLevel } from "./bots";
import { hashSeed } from "./random";
import { accuracy, netWpm, rawWpm } from "./stats";
import {
  applyKey,
  correctChars,
  isComplete,
  newTyping,
  progress,
  type ErrorMode,
  type Typing,
} from "./typing";

export type Phase = "WAITING" | "COUNTDOWN" | "RUNNING" | "RESULTS" | "CLOSED";
export type Role = "PLAYER" | "SPECTATOR";
export type RacerStatus = "RACING" | "FINISHED" | "TIME_UP" | "ABANDONED";

export const COUNTDOWN_MS = 3_000; // COURSE-03 : 3, 2, 1
export const RECONNECT_GRACE_MS = 30_000; // COURSE-08
export const MAX_KEYS_PER_BATCH = 30; // COURSE-06 : au-delà, c'est un saut de progression
export const MAX_KEYS_PER_SECOND = 25; // COURSE-06 : ≈ 300 MPM, au-delà de tout humain
const SAMPLE_EVERY_MS = 1_000; // RES-05 : un point de la courbe de MPM par seconde

export type Config = {
  maxPlayers: number; // SALLE-05 : les spectateurs ne comptent pas
  errorMode: ErrorMode; // CONF-08
  timeLimitMs: number | null; // CONF-01 : null = aucune limite
};

export const DEFAULT_CONFIG: Config = { maxPlayers: 30, errorMode: "STRICT", timeLimitMs: null };

export type Member = {
  id: string;
  name: string;
  kind: "HUMAN" | "BOT";
  role: Role;
  botLevel: BotLevel | null;
  joinedAt: number;
  connected: boolean;
  disconnectedAt: number | null;
};

export type Racer = {
  id: string;
  name: string;
  kind: "HUMAN" | "BOT";
  botLevel: BotLevel | null;
  text: string; // propre à chaque coureur : les bonus pourront l'allonger ou le raccourcir
  typing: Typing;
  status: RacerStatus;
  finishedAt: number | null; // arrivée ou abandon
  samples: { t: number; wpm: number }[];
  bot: Bot | null;
  recentKeys: number[]; // horodatages des touches reçues (limite de vitesse)
};

export type Room = {
  code: string;
  hostId: string;
  phase: Phase;
  config: Config;
  members: Map<string, Member>;
  kicked: Set<string>;
  raceNo: number;
  text: string | null;
  startAt: number | null;
  deadline: number | null;
  endedAt: number | null;
  lastSampleAt: number;
  racers: Map<string, Racer>;
  botCount: number;
};

export type JoinResult =
  { ok: true; rejoined: boolean } | { ok: false; reason: "closed" | "kicked" | "in_progress" };

export type StartBlocker = "phase" | "not_enough" | "no_human";

export function createRoom(code: string, hostId: string, config: Partial<Config> = {}): Room {
  return {
    code,
    hostId,
    phase: "WAITING",
    config: { ...DEFAULT_CONFIG, ...config },
    members: new Map(),
    kicked: new Set(),
    raceNo: 0,
    text: null,
    startAt: null,
    deadline: null,
    endedAt: null,
    lastSampleAt: 0,
    racers: new Map(),
    botCount: 0,
  };
}

const isOpen = (room: Room) => room.phase === "WAITING" || room.phase === "RESULTS";

// Participants : humains en mode joueur et bots. Les spectateurs n'y sont pas.
export function players(room: Room): Member[] {
  return [...room.members.values()].filter((m) => m.role === "PLAYER");
}

export function join(
  room: Room,
  person: { id: string; name: string },
  role: Role,
  now: number,
): JoinResult {
  if (room.phase === "CLOSED") return { ok: false, reason: "closed" };
  if (room.kicked.has(person.id)) return { ok: false, reason: "kicked" };
  const existing = room.members.get(person.id);
  if (existing) {
    // Rechargement, deuxième onglet ou retour dans les 30 s (COURSE-08).
    existing.connected = true;
    existing.disconnectedAt = null;
    return { ok: true, rejoined: true };
  }
  // SALLE-09 : jamais pendant le décompte ou la course.
  if (!isOpen(room)) return { ok: false, reason: "in_progress" };
  // Salle pleine : on entre quand même, comme spectateur (SALLE-05).
  const full = players(room).length >= room.config.maxPlayers;
  room.members.set(person.id, {
    id: person.id,
    name: person.name,
    kind: "HUMAN",
    role: full ? "SPECTATOR" : role,
    botLevel: null,
    joinedAt: now,
    connected: true,
    disconnectedAt: null,
  });
  return { ok: true, rejoined: false };
}

// Le dernier onglet s'est fermé : on lui garde sa place 30 s (COURSE-08).
export function disconnect(room: Room, id: string, now: number) {
  const member = room.members.get(id);
  if (member && member.kind === "HUMAN") {
    member.connected = false;
    member.disconnectedAt = now;
  }
}

// La personne quitte pour de bon (bouton « Quitter », délai dépassé, retrait).
export function removeMember(room: Room, id: string, now: number) {
  if (!room.members.delete(id)) return;
  const racer = room.racers.get(id);
  if (racer && racer.status === "RACING") {
    racer.status = "ABANDONED";
    racer.finishedAt = now;
  }
  if (id === room.hostId) transferHost(room);
}

// SALLE-08 : l'hôte passe à l'humain connecté présent depuis le plus longtemps.
function transferHost(room: Room) {
  const next = [...room.members.values()]
    .filter((m) => m.kind === "HUMAN" && m.connected)
    .sort((a, b) => a.joinedAt - b.joinedAt)[0];
  if (next) room.hostId = next.id;
  else room.phase = "CLOSED";
}

// SALLE-01 : chacun choisit de courir ou de regarder, entre deux courses.
export function setRole(room: Room, id: string, role: Role): boolean {
  const member = room.members.get(id);
  if (!member || member.kind !== "HUMAN" || !isOpen(room) || member.role === role) return false;
  if (role === "PLAYER" && players(room).length >= room.config.maxPlayers) return false;
  member.role = role;
  return true;
}

// CONF-10 : l'hôte ajoute un bot du niveau choisi.
export function addBot(room: Room, by: string, level: BotLevel, now: number): boolean {
  if (by !== room.hostId || !isOpen(room)) return false;
  if (players(room).length >= room.config.maxPlayers) return false;
  room.botCount += 1;
  const id = `bot-${room.botCount}`;
  room.members.set(id, {
    id,
    name: `Bot ${room.botCount}`,
    kind: "BOT",
    role: "PLAYER",
    botLevel: level,
    joinedAt: now,
    connected: true,
    disconnectedAt: null,
  });
  return true;
}

export function removeBot(room: Room, by: string, id: string): boolean {
  const member = room.members.get(id);
  if (by !== room.hostId || !isOpen(room) || member?.kind !== "BOT") return false;
  room.members.delete(id);
  return true;
}

// SALLE-07 : l'hôte expulse quelqu'un, qui ne peut plus revenir.
export function kick(room: Room, by: string, id: string, now: number): boolean {
  const member = room.members.get(id);
  if (by !== room.hostId || id === room.hostId || member?.kind !== "HUMAN") return false;
  room.kicked.add(id);
  removeMember(room, id, now);
  return true;
}

// COURSE-02 : au moins 2 participants, dont au moins 1 humain.
export function startBlocker(room: Room): StartBlocker | null {
  if (room.phase !== "WAITING") return "phase";
  const ready = players(room).filter((m) => m.connected);
  if (ready.length < 2) return "not_enough";
  if (!ready.some((m) => m.kind === "HUMAN")) return "no_human";
  return null;
}

// EN_ATTENTE → DÉCOMPTE : le texte est révélé et le départ fixé (COURSE-03).
export function startRace(room: Room, by: string, text: string, seed: number, now: number) {
  if (by !== room.hostId || startBlocker(room) !== null || text.length === 0) return false;
  room.raceNo += 1;
  room.phase = "COUNTDOWN";
  room.text = text;
  room.startAt = now + COUNTDOWN_MS;
  room.deadline = room.config.timeLimitMs === null ? null : room.startAt + room.config.timeLimitMs;
  room.endedAt = null;
  room.lastSampleAt = room.startAt;
  room.racers = new Map();
  for (const m of players(room)) {
    if (!m.connected) continue;
    room.racers.set(m.id, {
      id: m.id,
      name: m.name,
      kind: m.kind,
      botLevel: m.botLevel,
      text,
      typing: newTyping(),
      status: "RACING",
      finishedAt: null,
      samples: [],
      bot: m.botLevel ? createBot(m.botLevel, seed ^ hashSeed(m.id)) : null,
      recentKeys: [],
    });
  }
  return true;
}

function finish(racer: Racer, at: number) {
  racer.status = "FINISHED";
  racer.finishedAt = at;
}

// Fait avancer tout ce qui dépend du temps. `changed` dit s'il faut diffuser
// l'état ; `ended` signale la fin d'une course (pour l'enregistrer).
export function tick(room: Room, now: number): { changed: boolean; ended: boolean } {
  let changed = false;
  let ended = false;

  for (const m of [...room.members.values()]) {
    if (!m.connected && m.disconnectedAt !== null && now - m.disconnectedAt >= RECONNECT_GRACE_MS) {
      removeMember(room, m.id, now);
      changed = true;
    }
  }

  if (room.phase === "COUNTDOWN" && room.startAt !== null && now >= room.startAt) {
    room.phase = "RUNNING";
    changed = true;
  }

  if (room.phase === "RUNNING" && room.startAt !== null) {
    const startAt = room.startAt;
    const elapsed = now - startAt;
    for (const racer of room.racers.values()) {
      if (!racer.bot || racer.status !== "RACING") continue;
      stepBot(racer.bot, racer.typing, racer.text, room.config.errorMode, elapsed);
      if (isComplete(racer.typing, racer.text)) finish(racer, startAt + racer.bot.lastKeyAt);
    }

    if (now - room.lastSampleAt >= SAMPLE_EVERY_MS) {
      room.lastSampleAt = now;
      for (const racer of room.racers.values()) {
        if (racer.status === "RACING")
          racer.samples.push({ t: elapsed, wpm: statsOf(room, racer, now).wpm });
      }
    }

    if (room.deadline !== null && now >= room.deadline) {
      for (const racer of room.racers.values()) {
        if (racer.status === "RACING") {
          racer.status = "TIME_UP";
          racer.finishedAt = room.deadline;
        }
      }
    }

    // COURSE-09 : tous arrivés, abandonnés ou arrêtés par le temps.
    if (![...room.racers.values()].some((r) => r.status === "RACING")) {
      room.phase = "RESULTS";
      room.endedAt = now;
      ended = true;
    }
    changed = true;
  }

  return { changed, ended };
}

export type KeysResult = "ok" | "rejected" | "ignored";

// Touches reçues d'un navigateur, par lots (PERF-02). Le serveur les rejoue
// lui-même et refuse ce qu'aucun humain ne peut taper (COURSE-06).
export function applyKeys(room: Room, id: string, keys: string[], now: number): KeysResult {
  const racer = room.racers.get(id);
  if (room.phase !== "RUNNING" || room.startAt === null || !racer || racer.bot) return "ignored";
  if (racer.status !== "RACING") return "ignored";
  if (keys.length > MAX_KEYS_PER_BATCH) return "rejected";

  // Pas plus de 25 touches par seconde, sur une fenêtre glissante de 2 s…
  racer.recentKeys = racer.recentKeys.filter((t) => now - t < 2_000);
  if (racer.recentKeys.length + keys.length > MAX_KEYS_PER_SECOND * 2) return "rejected";
  // … ni en moyenne depuis le départ (petite marge pour les premiers instants).
  const elapsedSec = Math.max(0, now - room.startAt) / 1000;
  if (racer.typing.keystrokes + keys.length > MAX_KEYS_PER_SECOND * elapsedSec + 10)
    return "rejected";

  for (const key of keys) {
    racer.recentKeys.push(now);
    applyKey(racer.typing, racer.text, key, room.config.errorMode);
    if (isComplete(racer.typing, racer.text)) {
      finish(racer, now);
      break;
    }
  }
  return "ok";
}

// COURSE-07 : abandon volontaire (confirmé dans l'interface).
export function abandon(room: Room, id: string, now: number): boolean {
  const racer = room.racers.get(id);
  if (room.phase !== "RUNNING" || racer?.status !== "RACING") return false;
  racer.status = "ABANDONED";
  racer.finishedAt = now;
  return true;
}

// COURSE-11 : RÉSULTATS → EN_ATTENTE, avec les mêmes personnes.
export function backToLobby(room: Room, by: string): boolean {
  if (by !== room.hostId || room.phase !== "RESULTS") return false;
  room.phase = "WAITING";
  room.text = null;
  room.startAt = null;
  room.deadline = null;
  room.endedAt = null;
  room.racers = new Map();
  return true;
}

// COURSE-11 : l'hôte ferme la salle (depuis l'attente ou les résultats).
export function close(room: Room, by: string): boolean {
  if (by !== room.hostId || !isOpen(room)) return false;
  room.phase = "CLOSED";
  return true;
}

// COURSE-10 : arrivés par temps d'arrivée, puis les autres par progression,
// et les abandons en dernier.
export function ranking(room: Room): Racer[] {
  const group = (r: Racer) => (r.status === "FINISHED" ? 0 : r.status === "ABANDONED" ? 2 : 1);
  return [...room.racers.values()].sort((a, b) => {
    if (group(a) !== group(b)) return group(a) - group(b);
    if (a.status === "FINISHED" && b.status === "FINISHED")
      return (a.finishedAt ?? 0) - (b.finishedAt ?? 0);
    return progress(b.typing, b.text) - progress(a.typing, a.text);
  });
}

export type RacerStats = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  progress: number;
  timeMs: number;
};

export function statsOf(room: Room, racer: Racer, now: number): RacerStats {
  const end = racer.finishedAt ?? room.endedAt ?? now;
  const timeMs = room.startAt === null ? 0 : Math.max(0, end - room.startAt);
  return {
    wpm: netWpm(correctChars(racer.typing, racer.text), timeMs),
    rawWpm: rawWpm(racer.typing.keystrokes, timeMs),
    accuracy: accuracy(racer.typing.keystrokes, racer.typing.errors),
    errors: racer.typing.errors,
    progress: progress(racer.typing, racer.text),
    timeMs,
  };
}

export type MemberView = Omit<Member, "disconnectedAt" | "joinedAt">;
export type RacerView = RacerStats & {
  id: string;
  name: string;
  kind: "HUMAN" | "BOT";
  botLevel: BotLevel | null;
  status: RacerStatus;
  rank: number;
  lane: number; // couloir fixe sur la piste, dans l'ordre d'arrivée dans la salle
};

export type RoomView = {
  code: string;
  hostId: string;
  phase: Phase;
  config: Config;
  raceNo: number;
  startAt: number | null;
  deadline: number | null;
  serverNow: number;
  startBlocker: StartBlocker | null;
  members: MemberView[];
  racers: RacerView[];
};

// Ce que le serveur diffuse aux navigateurs (10 fois par seconde en course).
// Le texte n'y est pas : il part une seule fois, au début du décompte.
export function snapshot(room: Room, now: number): RoomView {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    config: room.config,
    raceNo: room.raceNo,
    startAt: room.startAt,
    deadline: room.deadline,
    serverNow: now,
    startBlocker: startBlocker(room),
    members: [...room.members.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map(({ id, name, kind, role, botLevel, connected }) => ({
        id,
        name,
        kind,
        role,
        botLevel,
        connected,
      })),
    racers: ranking(room).map((r, i) => ({
      lane: [...room.racers.keys()].indexOf(r.id),
      id: r.id,
      name: r.name,
      kind: r.kind,
      botLevel: r.botLevel,
      status: r.status,
      rank: i + 1,
      ...statsOf(room, r, now),
    })),
  };
}

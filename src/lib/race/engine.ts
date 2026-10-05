// Moteur de course : la machine à états de l'architecture (section 3).
// Code pur, sans réseau ni base de données : le serveur Socket.IO l'appelle,
// et les tests Vitest le vérifient. Le temps (`now`, en ms) est toujours passé
// en paramètre pour que tout soit prévisible.

export type RaceState = "LOBBY" | "WAITING" | "COUNTDOWN" | "RUNNING" | "FINISHED" | "CLOSED";
export type PlayerStatus = "WAITING" | "RACING" | "FINISHED" | "ABANDONED" | "KICKED";

export type Settings = {
  minPlayers: number; // ROOM-2
  maxPlayers: number; // H-1
  lobbyWaitMs: number; // ROOM-3, H-2 : délai pour les retardataires
  countdownMs: number; // H-2
  maxKeysPerSecond: number; // RACE-5 : au-delà, c'est du spam clavier
};

export const DEFAULT_SETTINGS: Settings = {
  minPlayers: 2,
  maxPlayers: 30,
  lobbyWaitMs: 30_000,
  countdownMs: 5_000,
  maxKeysPerSecond: 20,
};

export type Player = {
  id: string;
  username: string;
  status: PlayerStatus;
  connected: boolean;
  position: number; // lettres validées (RACE-2 : gardé à la déconnexion)
  errors: number;
  finishedAt: number | null;
  recentKeys: number[]; // horodatages des dernières touches (anti-spam)
};

export type Race = {
  code: string;
  organizerId: string;
  state: RaceState;
  settings: Settings;
  text: string | null;
  waitEndsAt: number | null;
  startAt: number | null;
  endedAt: number | null;
  players: Map<string, Player>;
};

export type JoinResult =
  { ok: true; rejoined: boolean } | { ok: false; reason: "full" | "closed" | "kicked" | "started" };
export type KeyResult = "correct" | "wrong" | "ignored" | "spam";

export function createRace(
  code: string,
  organizerId: string,
  settings: Partial<Settings> = {},
): Race {
  return {
    code,
    organizerId,
    state: "LOBBY",
    settings: { ...DEFAULT_SETTINGS, ...settings },
    text: null,
    waitEndsAt: null,
    startAt: null,
    endedAt: null,
    players: new Map(),
  };
}

const activePlayers = (race: Race) =>
  [...race.players.values()].filter((p) => p.status !== "KICKED" && p.status !== "ABANDONED");

export function joinRace(race: Race, id: string, username: string, now: number): JoinResult {
  if (race.state === "CLOSED") return { ok: false, reason: "closed" };
  const existing = race.players.get(id);
  if (existing) {
    if (existing.status === "KICKED") return { ok: false, reason: "kicked" };
    existing.connected = true; // RACE-2 : il reprend là où il s'était arrêté
    return { ok: true, rejoined: true };
  }
  if (race.state === "RUNNING" || race.state === "COUNTDOWN" || race.state === "FINISHED") {
    return { ok: false, reason: "started" };
  }
  if (activePlayers(race).length >= race.settings.maxPlayers) return { ok: false, reason: "full" };
  race.players.set(id, {
    id,
    username,
    status: "WAITING",
    connected: true,
    position: 0,
    errors: 0,
    finishedAt: null,
    recentKeys: [],
  });
  updateLobby(race, now);
  return { ok: true, rejoined: false };
}

// Un joueur quitte la page. Avant la course, il sort de la liste ;
// pendant la course, sa progression est gardée (RACE-2).
export function leaveRace(race: Race, id: string, now: number) {
  const player = race.players.get(id);
  if (!player) return;
  if (race.state === "LOBBY" || race.state === "WAITING") {
    race.players.delete(id);
    updateLobby(race, now);
  } else {
    player.connected = false;
  }
}

// LOBBY ⇄ WAITING selon le nombre de joueurs (ROOM-2, ROOM-3).
export function updateLobby(race: Race, now: number) {
  const count = activePlayers(race).length;
  if (race.state === "LOBBY" && count >= race.settings.minPlayers) {
    race.state = "WAITING";
    race.waitEndsAt = now + race.settings.lobbyWaitMs;
  } else if (race.state === "WAITING" && count < race.settings.minPlayers) {
    race.state = "LOBBY";
    race.waitEndsAt = null;
  }
}

export function canStart(race: Race) {
  return race.state === "WAITING" && activePlayers(race).length >= race.settings.minPlayers;
}

// WAITING → COUNTDOWN : le texte est choisi et le départ fixé à une heure précise.
export function startCountdown(race: Race, text: string, now: number): boolean {
  if (!canStart(race) || text.length === 0) return false;
  race.state = "COUNTDOWN";
  race.text = text;
  race.startAt = now + race.settings.countdownMs;
  race.waitEndsAt = null;
  return true;
}

// Fait avancer les états qui dépendent du temps. Renvoie "needs_text" quand
// le délai d'attente est écoulé : le serveur doit alors choisir un texte.
export function tick(race: Race, now: number): "needs_text" | null {
  if (race.state === "WAITING" && race.waitEndsAt !== null && now >= race.waitEndsAt) {
    return "needs_text";
  }
  if (race.state === "COUNTDOWN" && race.startAt !== null && now >= race.startAt) {
    race.state = "RUNNING";
    for (const p of race.players.values()) if (p.status === "WAITING") p.status = "RACING";
  }
  if (race.state === "RUNNING") {
    const stillRacing = [...race.players.values()].some((p) => p.status === "RACING");
    if (!stillRacing) {
      race.state = "FINISHED";
      race.endedAt = now;
    }
  }
  return null;
}

// RACE-4 : il faut taper la bonne lettre pour avancer. RACE-5 : anti-spam.
export function applyKey(race: Race, id: string, char: string, now: number): KeyResult {
  const player = race.players.get(id);
  if (race.state !== "RUNNING" || !race.text || !player || player.status !== "RACING")
    return "ignored";
  if (char.length !== 1) return "ignored";

  player.recentKeys = player.recentKeys.filter((t) => now - t < 1000);
  player.recentKeys.push(now);
  if (player.recentKeys.length > race.settings.maxKeysPerSecond) {
    player.errors += 1; // pénalité : la touche est refusée et compte comme une faute
    return "spam";
  }

  if (char === race.text[player.position]) {
    player.position += 1;
    if (player.position === race.text.length) {
      player.status = "FINISHED";
      player.finishedAt = now;
    }
    return "correct";
  }
  player.errors += 1;
  return "wrong";
}

// RACE-3 : abandon volontaire, classé dernier.
export function abandon(race: Race, id: string) {
  const player = race.players.get(id);
  if (player && player.status === "RACING") player.status = "ABANDONED";
}

// ROOM-5 : l'organisateur retire un participant.
export function kick(race: Race, organizerId: string, id: string, now: number): boolean {
  const player = race.players.get(id);
  if (organizerId !== race.organizerId || id === race.organizerId || !player) return false;
  player.status = "KICKED";
  player.connected = false;
  if (race.state === "LOBBY" || race.state === "WAITING") race.players.delete(id);
  updateLobby(race, now);
  return true;
}

// RACE-6 : l'organisateur relance une nouvelle course avec les mêmes joueurs.
export function restart(race: Race, now: number) {
  if (race.state !== "FINISHED") return false;
  for (const [id, p] of race.players) {
    if (p.status === "KICKED" || !p.connected) race.players.delete(id);
    else
      Object.assign(p, {
        status: "WAITING",
        position: 0,
        errors: 0,
        finishedAt: null,
        recentKeys: [],
      });
  }
  Object.assign(race, {
    state: "LOBBY",
    text: null,
    startAt: null,
    endedAt: null,
    waitEndsAt: null,
  });
  updateLobby(race, now);
  return true;
}

export function close(race: Race, now: number) {
  race.state = "CLOSED";
  race.endedAt = now;
}

// Mots par minute : 5 caractères = 1 mot (convention des tests de frappe).
export function wpm(position: number, startAt: number | null, end: number): number {
  if (startAt === null || end <= startAt) return 0;
  const minutes = (end - startAt) / 60_000;
  return Math.round(position / 5 / minutes);
}

export function accuracy(position: number, errors: number): number {
  const total = position + errors;
  return total === 0 ? 100 : Math.round((position / total) * 100);
}

// Classement : arrivés par ordre d'arrivée, puis les autres par progression,
// les abandons en dernier (RACE-3). En cas de fermeture, la progression compte (C-4).
export function ranking(race: Race): Player[] {
  const weight = (p: Player) => (p.status === "FINISHED" ? 0 : p.status === "ABANDONED" ? 2 : 1);
  return [...race.players.values()]
    .filter((p) => p.status !== "KICKED")
    .sort((a, b) => {
      if (weight(a) !== weight(b)) return weight(a) - weight(b);
      if (a.status === "FINISHED" && b.status === "FINISHED")
        return (a.finishedAt ?? 0) - (b.finishedAt ?? 0);
      return b.position - a.position;
    });
}

export type PlayerView = {
  id: string;
  username: string;
  status: PlayerStatus;
  connected: boolean;
  position: number;
  rank: number;
  wpm: number;
  accuracy: number;
};

export type RaceView = {
  code: string;
  organizerId: string;
  state: RaceState;
  text: string | null;
  waitEndsAt: number | null;
  startAt: number | null;
  serverNow: number;
  minPlayers: number;
  players: PlayerView[];
};

// Ce que le serveur envoie aux navigateurs (10 fois par seconde).
export function snapshot(race: Race, now: number): RaceView {
  const showText =
    race.state === "COUNTDOWN" || race.state === "RUNNING" || race.state === "FINISHED";
  return {
    code: race.code,
    organizerId: race.organizerId,
    state: race.state,
    text: showText ? race.text : null,
    waitEndsAt: race.waitEndsAt,
    startAt: race.startAt,
    serverNow: now,
    minPlayers: race.settings.minPlayers,
    players: ranking(race).map((p, i) => ({
      id: p.id,
      username: p.username,
      status: p.status,
      connected: p.connected,
      position: p.position,
      rank: i + 1,
      wpm: wpm(p.position, race.startAt, p.finishedAt ?? race.endedAt ?? now),
      accuracy: accuracy(p.position, p.errors),
    })),
  };
}

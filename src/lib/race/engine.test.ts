import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, type Config } from "./config";
import {
  abandon,
  addBot,
  applyKeys,
  backToLobby,
  close,
  COUNTDOWN_MS,
  createRoom,
  disconnect,
  join,
  kick,
  RECONNECT_GRACE_MS,
  setRole,
  snapshot,
  startBlocker,
  startRace,
  tick,
  updateConfig,
  type Room,
} from "./engine";

const TEXT = "le chat dort";

// Salle avec l'hôte « h » et un 2e joueur « b », prête à partir.
function readyRoom(config: Partial<Config> = {}): Room {
  const room = createRoom("K7X2QP", "h", { ...DEFAULT_CONFIG, ...config });
  join(room, { id: "h", name: "Hôte" }, "PLAYER", 0);
  join(room, { id: "b", name: "Béa" }, "PLAYER", 1);
  return room;
}

// Lance la course et passe le décompte : renvoie l'instant du départ.
function running(room: Room): number {
  startRace(room, "h", TEXT, 1, 1_000);
  const go = 1_000 + COUNTDOWN_MS;
  tick(room, go);
  return go;
}

describe("machine à états (COURSE-01)", () => {
  it("passe par EN_ATTENTE → DÉCOMPTE → EN_COURSE → RÉSULTATS → EN_ATTENTE", () => {
    const room = readyRoom();
    expect(room.phase).toBe("WAITING");
    expect(startRace(room, "h", TEXT, 1, 1_000)).toBe(true);
    expect(room.phase).toBe("COUNTDOWN");
    tick(room, 1_000 + COUNTDOWN_MS - 1);
    expect(room.phase).toBe("COUNTDOWN");
    const go = 1_000 + COUNTDOWN_MS;
    tick(room, go);
    expect(room.phase).toBe("RUNNING");
    abandon(room, "h", go + 10);
    abandon(room, "b", go + 20);
    expect(tick(room, go + 100)).toEqual({ changed: true, ended: true });
    expect(room.phase).toBe("RESULTS");
    expect(backToLobby(room, "h")).toBe(true);
    expect(room.phase).toBe("WAITING");
  });

  it("ferme la salle depuis les résultats (RÉSULTATS → FERMÉE)", () => {
    const room = readyRoom();
    const go = running(room);
    abandon(room, "h", go);
    abandon(room, "b", go);
    tick(room, go + 100);
    expect(close(room, "b")).toBe(false); // SEC-01 : seulement l'hôte
    expect(close(room, "h")).toBe(true);
    expect(room.phase).toBe("CLOSED");
  });

  it("révèle le temps de départ synchronisé dès le décompte (COURSE-03)", () => {
    const room = readyRoom();
    startRace(room, "h", TEXT, 1, 5_000);
    expect(snapshot(room, 5_000).startAt).toBe(5_000 + COUNTDOWN_MS);
  });
});

describe("lancement (COURSE-02)", () => {
  it("exige 2 participants", () => {
    const room = createRoom("K7X2QP", "h");
    join(room, { id: "h", name: "Hôte" }, "PLAYER", 0);
    expect(startBlocker(room)).toBe("not_enough");
    expect(startRace(room, "h", TEXT, 1, 0)).toBe(false);
  });

  it("compte les bots, mais pas les spectateurs", () => {
    const room = createRoom("K7X2QP", "h");
    join(room, { id: "h", name: "Hôte" }, "PLAYER", 0);
    join(room, { id: "s", name: "Spect" }, "SPECTATOR", 0);
    expect(startBlocker(room)).toBe("not_enough");
    addBot(room, "h", "NOOB", 0);
    expect(startBlocker(room)).toBeNull();
  });

  it("exige au moins un humain participant", () => {
    const room = createRoom("K7X2QP", "h");
    join(room, { id: "h", name: "Hôte" }, "SPECTATOR", 0);
    addBot(room, "h", "NOOB", 0);
    addBot(room, "h", "EXPERT", 0);
    expect(startBlocker(room)).toBe("no_human");
  });

  it("n'accepte le lancement que de l'hôte (SEC-01)", () => {
    expect(startRace(readyRoom(), "b", TEXT, 1, 0)).toBe(false);
  });
});

describe("accès à la salle", () => {
  it("refuse d'entrer pendant le décompte ou la course (SALLE-09)", () => {
    const room = readyRoom();
    startRace(room, "h", TEXT, 1, 0);
    expect(join(room, { id: "c", name: "Chloé" }, "PLAYER", 10)).toEqual({
      ok: false,
      reason: "in_progress",
    });
  });

  it("place en spectateur quand la salle est pleine (SALLE-05)", () => {
    const room = readyRoom({ maxPlayers: 2 });
    join(room, { id: "c", name: "Chloé" }, "PLAYER", 2);
    expect(room.members.get("c")?.role).toBe("SPECTATOR");
    expect(setRole(room, "c", "PLAYER")).toBe(false);
    expect(addBot(room, "h", "NOOB", 3)).toBe(false);
  });

  it("ne crée pas de doublon pour un 2e onglet (SALLE-06)", () => {
    const room = readyRoom();
    expect(join(room, { id: "b", name: "Béa" }, "PLAYER", 5)).toEqual({ ok: true, rejoined: true });
    expect(room.members.size).toBe(2);
  });

  it("empêche un expulsé de revenir (SALLE-07)", () => {
    const room = readyRoom();
    expect(kick(room, "b", "h", 0)).toBe(false);
    expect(kick(room, "h", "b", 0)).toBe(true);
    expect(join(room, { id: "b", name: "Béa" }, "PLAYER", 1)).toEqual({
      ok: false,
      reason: "kicked",
    });
  });
});

describe("déconnexion (COURSE-08) et hôte (SALLE-08)", () => {
  it("garde la progression d'un joueur qui revient dans les 30 s", () => {
    const room = readyRoom();
    const go = running(room);
    applyKeys(room, "b", [..."le "], go + 1_000);
    disconnect(room, "b", go + 1_100);
    tick(room, go + 1_100 + RECONNECT_GRACE_MS - 1);
    join(room, { id: "b", name: "Béa" }, "PLAYER", go + 1_100 + RECONNECT_GRACE_MS - 1);
    expect(room.racers.get("b")?.typing.typed).toBe("le ");
    expect(room.racers.get("b")?.status).toBe("RACING");
  });

  it("considère comme abandon une absence de plus de 30 s", () => {
    const room = readyRoom();
    const go = running(room);
    disconnect(room, "b", go);
    tick(room, go + RECONNECT_GRACE_MS);
    expect(room.racers.get("b")?.status).toBe("ABANDONED");
    expect(room.members.has("b")).toBe(false);
  });

  it("transmet l'hôte à l'humain présent depuis le plus longtemps", () => {
    const room = readyRoom();
    join(room, { id: "c", name: "Chloé" }, "SPECTATOR", 2);
    addBot(room, "h", "NOOB", 3);
    disconnect(room, "h", 10);
    tick(room, 10 + RECONNECT_GRACE_MS);
    expect(room.hostId).toBe("b");
  });

  it("ferme la salle quand il ne reste plus d'humain", () => {
    const room = createRoom("K7X2QP", "h");
    join(room, { id: "h", name: "Hôte" }, "PLAYER", 0);
    addBot(room, "h", "NOOB", 0);
    disconnect(room, "h", 0);
    tick(room, RECONNECT_GRACE_MS);
    expect(room.phase).toBe("CLOSED");
  });
});

describe("serveur autoritaire (COURSE-06)", () => {
  it("rejoue les touches reçues et arrive à la ligne", () => {
    const room = readyRoom();
    const go = running(room);
    expect(applyKeys(room, "h", [...TEXT], go + 5_000)).toBe("ok");
    expect(room.racers.get("h")?.status).toBe("FINISHED");
    expect(room.racers.get("h")?.finishedAt).toBe(go + 5_000);
  });

  it("ignore les touches avant le départ", () => {
    const room = readyRoom();
    startRace(room, "h", TEXT, 1, 0);
    expect(applyKeys(room, "h", ["l"], 10)).toBe("ignored");
  });

  it("rejette un saut de progression", () => {
    const room = readyRoom();
    const go = running(room);
    expect(applyKeys(room, "h", Array(31).fill("l"), go + 60_000)).toBe("rejected");
  });

  it("rejette une vitesse irréaliste", () => {
    const room = readyRoom();
    const go = running(room);
    // 20 touches 200 ms après le départ : 100 touches par seconde.
    expect(applyKeys(room, "h", Array(20).fill("l"), go + 200)).toBe("rejected");
    expect(room.racers.get("h")?.typing.typed).toBe("");
  });

  it("accepte une frappe rapide mais humaine (≈ 120 MPM)", () => {
    const room = readyRoom();
    const go = running(room);
    // Une touche toutes les 100 ms : 10 caractères par seconde.
    [...TEXT].forEach((key, i) => {
      expect(applyKeys(room, "h", [key], go + 100 * (i + 1))).toBe("ok");
    });
    expect(room.racers.get("h")?.status).toBe("FINISHED");
  });
});

describe("fin de course et classement (COURSE-09, COURSE-10)", () => {
  it("classe les arrivés, puis les temps écoulés, puis les abandons", () => {
    const room = createRoom("K7X2QP", "a", { ...DEFAULT_CONFIG, timeLimitMs: 30_000 });
    for (const id of ["a", "b", "c", "d", "e"]) join(room, { id, name: id }, "PLAYER", 0);
    startRace(room, "a", TEXT, 1, 0);
    const go = COUNTDOWN_MS;
    tick(room, go);
    applyKeys(room, "c", [...TEXT], go + 6_000); // 2e arrivé
    applyKeys(room, "b", [...TEXT], go + 5_000); // 1er arrivé
    applyKeys(room, "d", [..."le c"], go + 2_000);
    applyKeys(room, "a", [..."le chat"], go + 3_000);
    abandon(room, "a", go + 4_000); // abandon, mais plus avancé que d
    applyKeys(room, "e", [..."l"], go + 1_000);
    tick(room, go + 30_000); // temps écoulé : d et e s'arrêtent
    expect(room.phase).toBe("RESULTS");
    const view = snapshot(room, go + 30_000);
    expect(view.racers.map((r) => [r.id, r.status])).toEqual([
      ["b", "FINISHED"],
      ["c", "FINISHED"],
      ["d", "TIME_UP"],
      ["e", "TIME_UP"],
      ["a", "ABANDONED"],
    ]);
  });

  it("fait courir les bots jusqu'à la ligne", () => {
    const room = createRoom("K7X2QP", "h");
    join(room, { id: "h", name: "Hôte" }, "PLAYER", 0);
    addBot(room, "h", "IMPOSSIBLE", 0);
    const go = running(room);
    abandon(room, "h", go);
    let t = go;
    while (room.phase === "RUNNING" && t < go + 60_000) tick(room, (t += 100));
    expect(room.phase).toBe("RESULTS");
    const bot = snapshot(room, t).racers.find((r) => r.kind === "BOT");
    expect(bot?.status).toBe("FINISHED");
    expect(bot?.wpm).toBeGreaterThan(80);
  });
});

describe("configuration (CONF-01 à CONF-12)", () => {
  it("n'accepte les changements que de l'hôte (SEC-01)", () => {
    const room = readyRoom();
    expect(updateConfig(room, "b", { errorMode: "FREE" })).toBe("forbidden");
    expect(updateConfig(room, "h", { errorMode: "FREE", timeLimitSec: 90 })).toBe("ok");
    expect(room.config.errorMode).toBe("FREE");
    expect(room.config.timeLimitMs).toBe(90_000);
  });

  it("ne change rien pendant le décompte ou la course", () => {
    const room = readyRoom();
    startRace(room, "h", TEXT, 1, 0);
    expect(updateConfig(room, "h", { wordCount: 50 })).toBe("forbidden");
  });

  it("garde les réglages de texte non modifiés", () => {
    const room = readyRoom();
    updateConfig(room, "h", { language: "EN" });
    updateConfig(room, "h", { kind: "RANDOM" });
    expect(room.config.text.language).toBe("EN");
    expect(room.config.text.kind).toBe("RANDOM");
    expect(room.config.text.wordCount).toBe(DEFAULT_CONFIG.text.wordCount);
  });

  it("refuse une capacité plus petite que le nombre de participants (SALLE-05)", () => {
    const room = readyRoom();
    addBot(room, "h", "NOOB", 2);
    expect(updateConfig(room, "h", { maxPlayers: 2 })).toBe("below_players");
    expect(updateConfig(room, "h", { maxPlayers: 3 })).toBe("ok");
  });
});

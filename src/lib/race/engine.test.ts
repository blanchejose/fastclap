import { describe, expect, it } from "vitest";
import {
  abandon,
  accuracy,
  applyKey,
  createRace,
  joinRace,
  kick,
  leaveRace,
  ranking,
  restart,
  snapshot,
  startCountdown,
  tick,
  wpm,
} from "./engine";

const T0 = 1_000_000;

function readyRace() {
  const race = createRace("K7X2QP", "orga");
  joinRace(race, "orga", "Mme T", T0);
  joinRace(race, "lea", "Léa", T0);
  return race;
}

function running(text = "abc") {
  const race = readyRace();
  startCountdown(race, text, T0);
  tick(race, T0 + 5_000);
  return race;
}

describe("salle d'attente (ROOM-2, ROOM-3)", () => {
  it("reste en LOBBY avec un seul joueur", () => {
    const race = createRace("K7X2QP", "orga");
    joinRace(race, "orga", "Mme T", T0);
    expect(race.state).toBe("LOBBY");
  });

  it("passe en WAITING au 2e joueur, avec 30 s pour les retardataires", () => {
    const race = readyRace();
    expect(race.state).toBe("WAITING");
    expect(race.waitEndsAt).toBe(T0 + 30_000);
  });

  it("revient en LOBBY si un joueur part avant le départ", () => {
    const race = readyRace();
    leaveRace(race, "lea", T0 + 1000);
    expect(race.state).toBe("LOBBY");
    expect(race.players.size).toBe(1);
  });

  it("demande un texte quand le délai d'attente est écoulé", () => {
    const race = readyRace();
    expect(tick(race, T0 + 29_999)).toBeNull();
    expect(tick(race, T0 + 30_000)).toBe("needs_text");
  });

  it("refuse un nouveau joueur une fois la course partie", () => {
    const race = running();
    expect(joinRace(race, "zoe", "Zoé", T0 + 6000)).toEqual({ ok: false, reason: "started" });
  });

  it("refuse un joueur de plus quand la salle est pleine", () => {
    const race = createRace("K7X2QP", "orga", { maxPlayers: 2 });
    joinRace(race, "orga", "Mme T", T0);
    joinRace(race, "lea", "Léa", T0);
    expect(joinRace(race, "zoe", "Zoé", T0)).toEqual({ ok: false, reason: "full" });
  });
});

describe("départ", () => {
  it("ne démarre pas sans 2 joueurs", () => {
    const race = createRace("K7X2QP", "orga");
    joinRace(race, "orga", "Mme T", T0);
    expect(startCountdown(race, "abc", T0)).toBe(false);
  });

  it("compte à rebours de 5 s puis tout le monde court", () => {
    const race = readyRace();
    expect(startCountdown(race, "abc", T0)).toBe(true);
    expect(race.state).toBe("COUNTDOWN");
    tick(race, T0 + 4_999);
    expect(race.state).toBe("COUNTDOWN");
    tick(race, T0 + 5_000);
    expect(race.state).toBe("RUNNING");
    expect(race.players.get("lea")?.status).toBe("RACING");
  });
});

describe("frappe (RACE-4, RACE-5)", () => {
  it("avance seulement avec la bonne lettre", () => {
    const race = running("abc");
    expect(applyKey(race, "lea", "a", T0 + 6000)).toBe("correct");
    expect(applyKey(race, "lea", "x", T0 + 6100)).toBe("wrong");
    expect(race.players.get("lea")?.position).toBe(1);
    expect(race.players.get("lea")?.errors).toBe(1);
  });

  it("ignore les touches pendant le compte à rebours", () => {
    const race = readyRace();
    startCountdown(race, "abc", T0);
    expect(applyKey(race, "lea", "a", T0 + 1000)).toBe("ignored");
  });

  it("refuse le spam clavier au-delà de 20 touches par seconde", () => {
    const race = running("a".repeat(100));
    const results = Array.from({ length: 25 }, (_, i) => applyKey(race, "lea", "a", T0 + 6000 + i));
    expect(results.filter((r) => r === "spam")).toHaveLength(5);
  });

  it("termine la course quand tout le monde a fini", () => {
    const race = running("ab");
    for (const id of ["orga", "lea"]) {
      applyKey(race, id, "a", T0 + 6000);
      applyKey(race, id, "b", T0 + 7000);
    }
    tick(race, T0 + 7100);
    expect(race.state).toBe("FINISHED");
  });
});

describe("classement et statistiques", () => {
  it("classe par ordre d'arrivée, puis par progression, abandons en dernier", () => {
    const race = running("ab");
    joinRace(race, "orga", "Mme T", T0); // reconnexion sans effet
    applyKey(race, "lea", "a", T0 + 6000);
    applyKey(race, "lea", "b", T0 + 6500);
    abandon(race, "orga");
    expect(ranking(race).map((p) => p.id)).toEqual(["lea", "orga"]);
  });

  it("garde la progression d'un joueur déconnecté (RACE-2)", () => {
    const race = running("abc");
    applyKey(race, "lea", "a", T0 + 6000);
    leaveRace(race, "lea", T0 + 6100);
    expect(race.players.get("lea")?.connected).toBe(false);
    expect(joinRace(race, "lea", "Léa", T0 + 9000)).toEqual({ ok: true, rejoined: true });
    expect(race.players.get("lea")?.position).toBe(1);
  });

  it("calcule les mots par minute (5 caractères = 1 mot)", () => {
    expect(wpm(50, 0, 60_000)).toBe(10);
    expect(wpm(10, null, 60_000)).toBe(0);
  });

  it("calcule la précision", () => {
    expect(accuracy(9, 1)).toBe(90);
    expect(accuracy(0, 0)).toBe(100);
  });

  it("ne montre le texte qu'à partir du compte à rebours", () => {
    const race = readyRace();
    expect(snapshot(race, T0).text).toBeNull();
    startCountdown(race, "abc", T0);
    expect(snapshot(race, T0).text).toBe("abc");
  });
});

describe("organisateur (ROOM-5, RACE-6)", () => {
  it("retire un joueur, mais pas lui-même", () => {
    const race = readyRace();
    expect(kick(race, "lea", "orga", T0)).toBe(false);
    expect(kick(race, "orga", "lea", T0)).toBe(true);
    expect(race.players.has("lea")).toBe(false);
  });

  it("relance une course avec les mêmes joueurs", () => {
    const race = running("a");
    applyKey(race, "orga", "a", T0 + 6000);
    applyKey(race, "lea", "a", T0 + 6000);
    tick(race, T0 + 6100);
    expect(restart(race, T0 + 7000)).toBe(true);
    expect(race.state).toBe("WAITING");
    expect(race.players.get("lea")?.position).toBe(0);
  });
});

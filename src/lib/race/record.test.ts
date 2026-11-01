import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import {
  abandon,
  addBot,
  applyKeys,
  COUNTDOWN_MS,
  createRoom,
  join,
  startRace,
  tick,
} from "./engine";
import { buildRaceEntries, isNewRecord, type RaceEntry } from "./record";

const TEXT = "le chat dort";

// Course terminée : u1 (compte) arrive, l'invité abandonne, le bot court.
function finishedRace() {
  const room = createRoom("K7X2QP", "u1", DEFAULT_CONFIG);
  join(room, { id: "u1", name: "Lea" }, "PLAYER", 0);
  join(room, { id: "guest_abc", name: "Zoe" }, "PLAYER", 1);
  addBot(room, "u1", "IMPOSSIBLE", 2);
  startRace(room, "u1", TEXT, 1, 0);
  tick(room, COUNTDOWN_MS);
  applyKeys(room, "u1", ["l", "x", ...TEXT.slice(1)], COUNTDOWN_MS + 3_000);
  abandon(room, "guest_abc", COUNTDOWN_MS + 4_000);
  let t = COUNTDOWN_MS;
  while (room.phase === "RUNNING") tick(room, (t += 100));
  return { room, entries: buildRaceEntries(room, t) };
}

describe("résultats gardés (RES-05)", () => {
  it("garde chaque participant dans l'ordre du classement", () => {
    const { entries } = finishedRace();
    expect(entries.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(entries.at(-1)?.status).toBe("ABANDONED");
  });

  it("lie le résultat au compte seulement pour un utilisateur connecté", () => {
    const { entries } = finishedRace();
    const byId = Object.fromEntries(entries.map((e) => [e.racerId, e]));
    expect(byId.u1.userId).toBe("u1");
    expect(byId.guest_abc.userId).toBeNull();
    expect(byId.guest_abc.guestName).toBe("Zoe");
    expect(byId["bot-1"].userId).toBeNull();
    expect(byId["bot-1"].botLevel).toBe("IMPOSSIBLE");
  });

  it("garde la courbe du MPM et les touches manquées", () => {
    const { entries } = finishedRace();
    const lea = entries.find((e) => e.racerId === "u1")!;
    expect(lea.samples.length).toBeGreaterThan(0);
    expect(lea.missed).toEqual({ e: 1 });
    expect(lea.errors).toBe(1);
    expect(lea.rawWpm).toBeGreaterThanOrEqual(lea.wpm);
  });
});

describe("record personnel (RES-04)", () => {
  const entry = (patch: Partial<RaceEntry>): RaceEntry =>
    ({ userId: "u1", status: "FINISHED", wpm: 60, ...patch }) as RaceEntry;

  it("bat le record avec un MPM plus haut que le meilleur précédent", () => {
    expect(isNewRecord(entry({ wpm: 61 }), 60)).toBe(true);
    expect(isNewRecord(entry({ wpm: 60 }), 60)).toBe(false);
  });

  it("compte la première course terminée comme un record", () => {
    expect(isNewRecord(entry({}), null)).toBe(true);
  });

  it("ignore les abandons, les temps écoulés, les invités et les bots", () => {
    expect(isNewRecord(entry({ status: "ABANDONED" }), null)).toBe(false);
    expect(isNewRecord(entry({ status: "TIME_UP" }), null)).toBe(false);
    expect(isNewRecord(entry({ userId: null }), null)).toBe(false);
  });
});

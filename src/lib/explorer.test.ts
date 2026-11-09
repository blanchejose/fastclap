import { describe, expect, it } from "vitest";
import { listRooms, pickQuickRoom, summarize, type RoomSummary } from "./explorer";
import { DEFAULT_CONFIG, type Config } from "./race/config";
import { addBot, createRoom, disconnect, join, startRace, type Room } from "./race/engine";

function room(code: string, patch: Partial<Config> = {}, createdAt = 0): Room {
  const r = createRoom(code, `${code}-h`, { ...DEFAULT_CONFIG, ...patch }, createdAt);
  join(r, { id: `${code}-h`, name: `Hôte ${code}` }, "PLAYER", createdAt);
  return r;
}

const summary = (patch: Partial<RoomSummary>): RoomSummary => ({
  code: "AAAAAA",
  hostName: "H",
  phase: "WAITING",
  players: 1,
  maxPlayers: 10,
  language: "FR",
  complexity: "BEGINNER",
  createdAt: 0,
  ...patch,
});

describe("explorateur de salles (JOIN-02)", () => {
  it("résume une salle : participants, capacité, langue, complexité, hôte, état", () => {
    const r = room("ABC234", { maxPlayers: 8 });
    join(r, { id: "s", name: "Spect" }, "SPECTATOR", 1);
    addBot(r, "ABC234-h", "NOOB", 2);
    expect(summarize(r)).toEqual({
      code: "ABC234",
      hostName: "Hôte ABC234",
      phase: "WAITING",
      players: 2, // l'hôte et le bot ; le spectateur ne compte pas
      maxPlayers: 8,
      language: "FR",
      complexity: "BEGINNER",
      createdAt: 0,
    });
  });

  it("ne montre ni les salles sur code ou privées, ni les salles vides", () => {
    const empty = room("EMP234");
    disconnect(empty, "EMP234-h", 5);
    const rooms = [room("PUB234"), room("COD234", { visibility: "SEMI_PUBLIC" }), empty];
    expect(listRooms(rooms).map((r) => r.code)).toEqual(["PUB234"]);
  });

  it("filtre par langue et par complexité", () => {
    const rooms = [
      room("FRA234"),
      room("ENG234", { text: { ...DEFAULT_CONFIG.text, language: "EN" } }),
      room("PRO234", { text: { ...DEFAULT_CONFIG.text, complexity: "PRO" } }),
    ];
    expect(listRooms(rooms, { language: "EN" }).map((r) => r.code)).toEqual(["ENG234"]);
    expect(listRooms(rooms, { complexity: "PRO" }).map((r) => r.code)).toEqual(["PRO234"]);
  });

  it("montre l'état d'une salle en course", () => {
    const r = room("RUN234");
    addBot(r, "RUN234-h", "NOOB", 1);
    startRace(r, "RUN234-h", "abc", 1, 0);
    expect(summarize(r)?.phase).toBe("COUNTDOWN");
  });
});

describe("partie rapide (JOIN-03)", () => {
  it("choisit la salle la plus proche de sa capacité", () => {
    const rooms = [
      summary({ code: "A", players: 3, maxPlayers: 10 }), // 7 places
      summary({ code: "B", players: 4, maxPlayers: 5 }), // 1 place
      summary({ code: "C", players: 1, maxPlayers: 2 }), // 1 place, plus récente
    ];
    rooms[2].createdAt = 5;
    expect(pickQuickRoom(rooms)?.code).toBe("B");
  });

  it("prend la plus ancienne à égalité", () => {
    const rooms = [summary({ code: "NEW", createdAt: 9 }), summary({ code: "OLD", createdAt: 1 })];
    expect(pickQuickRoom(rooms)?.code).toBe("OLD");
  });

  it("ignore les salles pleines ou en course", () => {
    const rooms = [
      summary({ code: "FULL", players: 10, maxPlayers: 10 }),
      summary({ code: "RUN", phase: "RUNNING" }),
      summary({ code: "COUNT", phase: "COUNTDOWN" }),
    ];
    expect(pickQuickRoom(rooms)).toBeNull();
    expect(pickQuickRoom([...rooms, summary({ code: "RES", phase: "RESULTS" })])?.code).toBe("RES");
  });
});

import { describe, expect, it } from "vitest";
import { parsePage, toRacerViews, type StoredParticipant } from "./history";

describe("pagination de l'historique (HIST-01)", () => {
  it("commence à la page 1", () => {
    expect(parsePage(undefined, 35)).toBe(1);
    expect(parsePage("abc", 35)).toBe(1);
    expect(parsePage("0", 35)).toBe(1);
  });

  it("ne dépasse jamais la dernière page", () => {
    expect(parsePage("3", 35)).toBe(3);
    expect(parsePage("9", 35)).toBe(4);
    expect(parsePage("2", 0)).toBe(1);
  });
});

const participant = (patch: Partial<StoredParticipant>, rank: number): StoredParticipant => ({
  id: `p${rank}`,
  userId: null,
  name: `P${rank}`,
  avatar: null,
  botLevel: null,
  result: {
    rank,
    wpm: 50,
    rawWpm: 55,
    accuracy: 97,
    errors: 2,
    progress: 1,
    durationMs: 30_000,
    status: "FINISHED",
    bonuses: ["SHORTEN", "inconnu"],
    samples: [{ t: 1000, wpm: 40 }],
    missed: { e: 2 },
    isRecord: false,
  },
  ...patch,
});

describe("résultats relus en base (HIST-02)", () => {
  it("remet les participants dans l'ordre du classement", () => {
    const views = toRacerViews([participant({}, 2), participant({}, 1)]);
    expect(views.map((v) => v.rank)).toEqual([1, 2]);
  });

  it("vérifie les données JSON et ignore ce qui est invalide", () => {
    const [view] = toRacerViews([
      participant({ result: { ...participant({}, 1).result!, samples: "abîmé", missed: [1] } }, 1),
    ]);
    expect(view.samples).toEqual([]);
    expect(view.missed).toEqual({});
    expect(view.bonuses).toEqual(["SHORTEN"]);
  });

  it("reconnaît les bots", () => {
    const [view] = toRacerViews([participant({ botLevel: "NOOB" }, 1)]);
    expect(view.kind).toBe("BOT");
  });
});

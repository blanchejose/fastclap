import { describe, expect, it } from "vitest";
import { profileStats, progression, type RaceStat } from "./profile";

const day = (n: number) => new Date(Date.UTC(2026, 10, n));
const race = (patch: Partial<RaceStat>): RaceStat => ({
  wpm: 50,
  accuracy: 95,
  rank: 2,
  status: "FINISHED",
  endedAt: day(1),
  ...patch,
});

describe("statistiques du profil (AUTH-06)", () => {
  it("n'affiche rien de faux sans course", () => {
    expect(profileStats([])).toEqual({
      races: 0,
      wins: 0,
      bestWpm: null,
      averageWpm: null,
      averageAccuracy: null,
    });
  });

  it("calcule le meilleur MPM, les moyennes, les courses et les victoires", () => {
    const stats = profileStats([
      race({ wpm: 40, accuracy: 90, rank: 1 }),
      race({ wpm: 61, accuracy: 97 }),
      race({ wpm: 0, accuracy: 100, rank: 1, status: "ABANDONED" }),
    ]);
    expect(stats).toEqual({
      races: 3,
      wins: 1, // une 1re place abandonnée n'est pas une victoire
      bestWpm: 61,
      averageWpm: 50.5, // les abandons ne comptent pas dans les moyennes
      averageAccuracy: 93.5,
    });
  });

  it("donne la progression dans l'ordre des dates, sans les abandons", () => {
    const points = progression([
      race({ wpm: 70, endedAt: day(3) }),
      race({ wpm: 30, endedAt: day(1) }),
      race({ wpm: 0, endedAt: day(2), status: "ABANDONED" }),
    ]);
    expect(points.map((p) => p.wpm)).toEqual([30, 70]);
  });

  it("garde seulement les dernières courses", () => {
    const many = Array.from({ length: 60 }, (_, i) => race({ wpm: i, endedAt: day(i + 1) }));
    const points = progression(many);
    expect(points).toHaveLength(50);
    expect(points.at(-1)?.wpm).toBe(59);
  });
});

import { describe, expect, it } from "vitest";
import { BOT_LEVELS, BOT_PROFILES, createBot, stepBot, type BotLevel } from "./bots";
import { netWpm } from "./stats";
import { correctChars, isComplete, newTyping, type ErrorMode } from "./typing";

const TEXT =
  "Le soleil se couchait derrière les collines quand les enfants rentrèrent enfin à la maison, " +
  "fatigués mais heureux de leur longue journée passée au bord du lac avec leurs amis.";

// Fait courir un bot jusqu'au bout, en avançant le temps par pas de 100 ms
// comme le serveur, et note l'instant de chaque touche.
function race(level: BotLevel, seed: number, mode: ErrorMode = "STRICT", text = TEXT) {
  const bot = createBot(level, seed);
  const typing = newTyping();
  const keyTimes: number[] = [];
  let lastLength = 0;
  for (let t = 0; t < 3_600_000 && !isComplete(typing, text); t += 100) {
    stepBot(bot, typing, text, mode, t);
    if (typing.typed.length !== lastLength) keyTimes.push(bot.lastKeyAt);
    lastLength = typing.typed.length;
  }
  return { bot, typing, keyTimes };
}

describe("bots (BOT-01 à BOT-05)", () => {
  it("tapent exactement pareil avec la même graine (BOT-05)", () => {
    const a = race("INTERMEDIATE", 42);
    const b = race("INTERMEDIATE", 42);
    expect(a.typing).toEqual(b.typing);
    expect(a.bot.lastKeyAt).toBe(b.bot.lastKeyAt);
    expect(race("INTERMEDIATE", 43).bot.lastKeyAt).not.toBe(a.bot.lastKeyAt);
  });

  it("donnent le même résultat quelle que soit la fréquence des appels", () => {
    const fine = createBot("EXPERT", 7);
    const coarse = createBot("EXPERT", 7);
    const t1 = newTyping();
    const t2 = newTyping();
    for (let t = 0; t <= 20_000; t += 50) stepBot(fine, t1, TEXT, "STRICT", t);
    stepBot(coarse, t2, TEXT, "STRICT", 20_000);
    expect(t1).toEqual(t2);
  });

  it.each(BOT_LEVELS)("le niveau %s reste proche de sa plage de MPM (BOT-01)", (level) => {
    const { minWpm, maxWpm } = BOT_PROFILES[level];
    for (const seed of [1, 2, 3]) {
      const { bot, typing } = race(level, seed);
      const wpm = netWpm(correctChars(typing, TEXT), bot.lastKeyAt);
      expect(wpm).toBeGreaterThan(minWpm * 0.6);
      expect(wpm).toBeLessThan(maxWpm * 1.2);
    }
  });

  it.each(BOT_LEVELS)("le niveau %s a un MPM moyen dans sa plage (BOT-01)", (level) => {
    const { minWpm, maxWpm } = BOT_PROFILES[level];
    const speeds = Array.from({ length: 20 }, (_, seed) => {
      const { bot, typing } = race(level, seed);
      return netWpm(correctChars(typing, TEXT), bot.lastKeyAt);
    });
    const average = speeds.reduce((a, b) => a + b) / speeds.length;
    expect(average).toBeGreaterThanOrEqual(minWpm);
    expect(average).toBeLessThanOrEqual(maxWpm);
  });

  it("ne tapent pas à vitesse constante (BOT-02)", () => {
    const { keyTimes } = race("EXPERT", 5);
    const gaps = keyTimes.slice(1).map((t, i) => t - keyTimes[i]);
    expect(Math.max(...gaps)).toBeGreaterThan(2 * Math.min(...gaps));
    // Les longues pauses (hésitations) existent.
    expect(gaps.some((g) => g > 300)).toBe(true);
  });

  it("font des fautes selon leur niveau, qui les ralentissent (BOT-03)", () => {
    const noob = race("NOOB", 9).typing;
    const impossible = race("IMPOSSIBLE", 9).typing;
    expect(noob.errors).toBeGreaterThan(impossible.errors);
    expect(noob.errors).toBeGreaterThan(0);
  });

  it("respectent la correction obligatoire et corrigent en mode libre (BOT-03)", () => {
    const strict = race("NOOB", 11, "STRICT").typing;
    expect(strict.typed).toBe(TEXT);
    const free = race("NOOB", 11, "FREE");
    expect(free.typing.errors).toBeGreaterThan(0);
    // En libre, le bot efface ses fautes (sauf peut-être sur la toute dernière lettre).
    expect(correctChars(free.typing, TEXT)).toBeGreaterThanOrEqual(TEXT.length - 1);
  });
});

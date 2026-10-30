import { describe, expect, it } from "vitest";
import { parseMessage } from "./messages";

describe("validation des messages temps réel (TECH-07)", () => {
  it("accepte un code de salle valide et refuse le reste", () => {
    expect(parseMessage("room:join", { code: "K7X2QP" })).toEqual({ code: "K7X2QP" });
    expect(parseMessage("room:join", { code: "K7X2Q0" })).toBeNull(); // 0 ambigu
    expect(parseMessage("room:join", { code: 123456 })).toBeNull();
    expect(parseMessage("room:join", null)).toBeNull();
  });

  it("n'accepte que des lots de touches d'un caractère", () => {
    expect(parseMessage("race:keys", { keys: ["a", "\b", "é"] })).not.toBeNull();
    expect(parseMessage("race:keys", { keys: ["ab"] })).toBeNull();
    expect(parseMessage("race:keys", { keys: [] })).toBeNull();
    expect(parseMessage("race:keys", { keys: Array(31).fill("a") })).toBeNull();
  });

  it("refuse un niveau de bot inconnu", () => {
    expect(parseMessage("bot:add", { level: "EXPERT" })).toEqual({ level: "EXPERT" });
    expect(parseMessage("bot:add", { level: "GOD" })).toBeNull();
  });

  it("valide les changements de configuration (TECH-07)", () => {
    expect(parseMessage("room:config", { wordCount: 40, exclude: "a b a" })).toEqual({
      wordCount: 40,
      exclude: "ab",
    });
    expect(parseMessage("room:config", { wordCount: 5 })).toBeNull(); // sous 10 mots
    expect(parseMessage("room:config", { timeLimitSec: 20 })).toBeNull(); // sous 30 s
    expect(parseMessage("room:config", { timeLimitSec: null })).toEqual({ timeLimitSec: null });
    expect(parseMessage("room:config", { maxPlayers: 31 })).toBeNull();
    expect(parseMessage("room:config", { visibility: "PRIVATE" })).toBeNull();
    expect(parseMessage("room:config", { hack: true })).toBeNull(); // champ inconnu
  });
});

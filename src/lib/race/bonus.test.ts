import { describe, expect, it } from "vitest";
import { BONUS_WORDS, FOG_MS, MAX_BONUSES, shortenText } from "./bonus";
import { DEFAULT_CONFIG } from "./config";
import {
  addBot,
  COUNTDOWN_MS,
  createRoom,
  join,
  startRace,
  statsOf,
  tick,
  type Room,
} from "./engine";
import { correctChars } from "./typing";

const TEXT = Array.from({ length: 40 }, (_, i) => `mot${i}`).join(" ");
const GO = COUNTDOWN_MS;

// Salle en course avec les joueurs donnés ; bonus activés ou non.
function raceWith(ids: string[], seed = 1, bonuses = true): Room {
  const room = createRoom("K7X2QP", ids[0], { ...DEFAULT_CONFIG, bonuses });
  ids.forEach((id, i) => join(room, { id, name: id.toUpperCase() }, "PLAYER", i));
  startRace(room, ids[0], TEXT, seed, 0);
  tick(room, GO);
  return room;
}

// Place un joueur à une fraction de son texte, comme s'il avait tapé sans faute.
function advance(room: Room, id: string, fraction: number) {
  const racer = room.racers.get(id)!;
  const typed = racer.text.slice(0, Math.round(racer.text.length * fraction));
  racer.typing = { typed, keystrokes: typed.length, errors: 0, missed: {} };
}

describe("couper la fin du texte (BONUS-02 : −3 mots)", () => {
  it("retire 3 mots à la fin", () => {
    expect(shortenText("a b c d e", 0)).toBe("a b");
  });

  it("ne touche jamais à ce qui est déjà tapé", () => {
    expect(shortenText("a b c d e", 6)).toBe("a b c d");
    expect(shortenText("a b c d e", 9)).toBe("a b c d e");
  });
});

describe("points de contrôle (BONUS-01)", () => {
  it("ne donne rien avant que le meneur passe 25 %", () => {
    const room = raceWith(["a", "b"]);
    advance(room, "a", 0.2);
    expect(tick(room, GO + 100).bonuses).toEqual([]);
  });

  it("donne un bonus au dernier quand le meneur passe 25 %, une seule fois", () => {
    const room = raceWith(["a", "b", "c"]);
    advance(room, "a", 0.3);
    advance(room, "b", 0.2);
    advance(room, "c", 0.1);
    const { bonuses } = tick(room, GO + 100);
    expect(bonuses.map((e) => e.beneficiaryId)).toEqual(["c"]); // b n'est ni dernier ni à 25 points
    expect(tick(room, GO + 200).bonuses).toEqual([]);
  });

  it("donne aussi un bonus à ceux qui sont à 25 points ou plus derrière le meneur", () => {
    const room = raceWith(["a", "b", "c", "d"]);
    advance(room, "a", 0.55);
    advance(room, "b", 0.5);
    advance(room, "c", 0.25);
    advance(room, "d", 0.1);
    // Le meneur passe 25 % et 50 % : deux points de contrôle d'un coup.
    const ids = tick(room, GO + 100).bonuses.map((e) => e.beneficiaryId);
    expect(new Set(ids)).toEqual(new Set(["c", "d"]));
    expect(ids).not.toContain("a");
    expect(ids).not.toContain("b");
  });

  it("ne donne pas plus de 3 bonus à un joueur par course", () => {
    const room = raceWith(["a", "b"]);
    advance(room, "a", 0.9);
    const { bonuses } = tick(room, GO + 100);
    expect(bonuses).toHaveLength(MAX_BONUSES);
    expect(room.racers.get("b")!.bonuses).toHaveLength(MAX_BONUSES);
  });

  it("ne donne rien quand les bonus sont désactivés (CONF-09)", () => {
    const room = raceWith(["a", "b"], 1, false);
    advance(room, "a", 0.9);
    expect(tick(room, GO + 100).bonuses).toEqual([]);
  });

  it("tire les mêmes bonus avec la même graine", () => {
    const types = (seed: number) => {
      const room = raceWith(["a", "b", "c"], seed);
      advance(room, "a", 0.9);
      return tick(room, GO + 100).bonuses.map((e) => e.type);
    };
    expect(types(7)).toEqual(types(7));
  });
});

describe("effets des bonus (BONUS-02, BONUS-04)", () => {
  it("applique chaque type et garde la progression et le MPM cohérents", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const room = raceWith(["a", "b"], seed);
      advance(room, "a", 0.3);
      advance(room, "b", 0.1);
      const leader = room.racers.get("a")!;
      const behind = room.racers.get("b")!;
      const before = {
        leader: leader.text,
        behind: behind.text,
        leaderCorrect: correctChars(leader.typing, leader.text),
      };
      const [event] = tick(room, GO + 1000).bonuses;
      seen.add(event.type);
      if (event.type === "SHORTEN") {
        expect(event.targetId).toBe("b");
        expect(behind.text.split(" ")).toHaveLength(40 - BONUS_WORDS);
        expect(before.behind.startsWith(behind.text)).toBe(true);
      } else if (event.type === "EXTEND") {
        expect(event.targetId).toBe("a");
        expect(leader.text.split(" ")).toHaveLength(40 + BONUS_WORDS);
        expect(leader.text.startsWith(before.leader)).toBe(true);
      } else {
        expect(leader.fogUntil).toBe(GO + 1000 + FOG_MS);
      }
      // BONUS-04 : la progression suit le texte de chacun, le MPM ne compte
      // que les caractères justes déjà tapés.
      const stats = statsOf(room, leader, GO + 1000);
      expect(stats.progress).toBeCloseTo(leader.typing.typed.length / leader.text.length);
      expect(correctChars(leader.typing, leader.text)).toBe(before.leaderCorrect);
    }
    expect(seen).toEqual(new Set(["SHORTEN", "EXTEND", "FOG"]));
  });

  it("ne donne qu'un +3 mots et un brouillard au meneur par point de contrôle", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ids = ["a", "b", "c", "d", "e", "f", "g"];
      const room = raceWith(ids, seed);
      advance(room, "a", 0.3);
      const events = tick(room, GO + 100).bonuses;
      expect(events.filter((e) => e.type === "EXTEND").length).toBeLessThanOrEqual(1);
      expect(events.filter((e) => e.type === "FOG").length).toBeLessThanOrEqual(1);
    }
  });

  it("termine la course d'un joueur dont le texte raccourci est déjà tapé", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const room = raceWith(["a", "b"], seed);
      advance(room, "a", 0.3);
      const behind = room.racers.get("b")!;
      // b a tapé tout sauf les 2 derniers mots : −3 mots le fait arriver.
      const cut = behind.text.lastIndexOf(" ", behind.text.lastIndexOf(" ") - 1);
      behind.typing.typed = behind.text.slice(0, cut);
      advance(room, "a", 0.99);
      const [event] = tick(room, GO + 100).bonuses;
      if (event?.type !== "SHORTEN") continue;
      expect(behind.status).toBe("FINISHED");
      return;
    }
    throw new Error("aucune graine n'a tiré −3 mots");
  });

  it("s'applique aussi aux bots (BOT-04)", () => {
    const room = createRoom("K7X2QP", "h", DEFAULT_CONFIG);
    join(room, { id: "h", name: "H" }, "PLAYER", 0);
    addBot(room, "h", "NOOB", 1);
    startRace(room, "h", TEXT, 3, 0);
    tick(room, GO);
    advance(room, "h", 0.3);
    const [event] = tick(room, GO + 100).bonuses;
    expect(event.beneficiaryId).toBe("bot-1");
  });
});

import { describe, expect, it } from "vitest";
import { accuracy, netWpm, rawWpm } from "./stats";
import { applyKey, BACKSPACE, correctChars, isComplete, newTyping, progress } from "./typing";

const typeAll = (keys: string, text: string, mode: "STRICT" | "FREE") => {
  const typing = newTyping();
  for (const key of keys) applyKey(typing, text, key, mode);
  return typing;
};

describe("frappe en correction obligatoire (CONF-08)", () => {
  it("n'avance pas sur une faute et la compte", () => {
    const typing = typeAll("lx", "le chat", "STRICT");
    expect(typing.typed).toBe("l");
    expect(typing.errors).toBe(1);
    expect(typing.missed).toEqual({ e: 1 });
  });

  it("ignore l'effacement : il n'y a rien de faux à effacer", () => {
    const typing = typeAll("le", "le chat", "STRICT");
    expect(applyKey(typing, "le chat", BACKSPACE, "STRICT")).toBe("ignored");
    expect(typing.typed).toBe("le");
  });

  it("finit quand tout le texte est tapé", () => {
    const typing = typeAll("abc", "abc", "STRICT");
    expect(isComplete(typing, "abc")).toBe(true);
    expect(applyKey(typing, "abc", "d", "STRICT")).toBe("ignored");
  });
});

describe("frappe libre (CONF-08)", () => {
  it("avance sur une faute, qui reste comptée même une fois effacée", () => {
    const typing = typeAll("lx", "le chat", "FREE");
    expect(typing.typed).toBe("lx");
    applyKey(typing, "le chat", BACKSPACE, "FREE");
    applyKey(typing, "le chat", "e", "FREE");
    expect(typing.typed).toBe("le");
    expect(typing.errors).toBe(1);
    expect(correctChars(typing, "le chat")).toBe(2);
  });

  it("calcule la progression sur la longueur tapée", () => {
    const typing = typeAll("abxd", "abcdefgh", "FREE");
    expect(progress(typing, "abcdefgh")).toBe(0.5);
    expect(correctChars(typing, "abcdefgh")).toBe(3);
  });
});

describe("mesures (annexe A)", () => {
  it("compte 5 caractères par mot", () => {
    expect(netWpm(300, 60_000)).toBe(60);
    expect(rawWpm(350, 60_000)).toBe(70);
    expect(netWpm(100, 0)).toBe(0);
  });

  it("donne la précision au dixième", () => {
    expect(accuracy(0, 0)).toBe(100);
    expect(accuracy(200, 3)).toBe(98.5);
  });
});

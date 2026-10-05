import { describe, expect, it } from "vitest";
import { generateRoomCode, normalizeRoomCode, ROOM_CODE_ALPHABET } from "./room-code";

describe("code de salle", () => {
  it("génère 6 caractères sans 0, O, 1, I ni L", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      for (const c of code) expect(ROOM_CODE_ALPHABET).toContain(c);
    }
  });

  it("accepte les minuscules, le tiret et les espaces", () => {
    expect(normalizeRoomCode("k7x-2qp")).toBe("K7X2QP");
    expect(normalizeRoomCode(" K7X 2QP ")).toBe("K7X2QP");
  });

  it("refuse une mauvaise longueur ou un caractère ambigu", () => {
    expect(normalizeRoomCode("K7X2Q")).toBeNull();
    expect(normalizeRoomCode("K7X2Q0")).toBeNull();
  });
});

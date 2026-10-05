import { describe, expect, it } from "vitest";
import { createSocketToken, verifySocketToken } from "./socket-token";

const SECRET = "secret-de-test";

describe("jeton Socket.IO", () => {
  it("vérifie un jeton valide", () => {
    const token = createSocketToken({ uid: "u1", name: "lea" }, SECRET, 0);
    expect(verifySocketToken(token, SECRET, 1000)).toEqual({ uid: "u1", name: "lea" });
  });

  it("refuse un jeton modifié ou signé avec un autre secret", () => {
    const token = createSocketToken({ uid: "u1", name: "lea" }, SECRET, 0);
    expect(verifySocketToken(token, "autre", 1000)).toBeNull();
    expect(verifySocketToken(token.replace(/^./, "x"), SECRET, 1000)).toBeNull();
  });

  it("refuse un jeton expiré", () => {
    const token = createSocketToken({ uid: "u1", name: "lea" }, SECRET, 0);
    expect(verifySocketToken(token, SECRET, 7 * 60 * 60 * 1000)).toBeNull();
  });
});

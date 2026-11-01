import { describe, expect, it } from "vitest";
import { isGuestId } from "./guest-id";
import { createGuestToken, GUEST_TTL_MS, newGuestId, readGuestToken } from "./guest-token";
import { createSocketToken } from "./socket-token";

const SECRET = "secret-de-test";

describe("session d'invité (AUTH-02)", () => {
  it("donne un identifiant d'invité imprévisible", () => {
    const a = newGuestId();
    expect(isGuestId(a)).toBe(true);
    expect(a).toMatch(/^guest_[0-9a-f]{32}$/);
    expect(newGuestId()).not.toBe(a);
  });

  it("relit le cookie signé, pendant 30 jours", () => {
    const id = newGuestId();
    const token = createGuestToken({ uid: id, name: "lea" }, SECRET, 0);
    expect(readGuestToken(token, SECRET, GUEST_TTL_MS - 1)).toEqual({ uid: id, name: "lea" });
    expect(readGuestToken(token, SECRET, GUEST_TTL_MS + 1)).toBeNull();
  });

  it("refuse un cookie modifié ou signé avec un autre secret", () => {
    const token = createGuestToken({ uid: newGuestId(), name: "lea" }, SECRET, 0);
    expect(readGuestToken(token, "autre", 1)).toBeNull();
    expect(readGuestToken(`x${token}`, SECRET, 1)).toBeNull();
  });

  it("refuse un jeton valide qui n'est pas celui d'un invité", () => {
    const userToken = createSocketToken({ uid: "cmvf123", name: "lea" }, SECRET, 0);
    expect(readGuestToken(userToken, SECRET, 1)).toBeNull();
  });
});

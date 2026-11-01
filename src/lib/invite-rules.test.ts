import { describe, expect, it } from "vitest";
import {
  decideClaim,
  INVITE_TOKEN_PATTERN,
  newInviteToken,
  type InviteState,
} from "./invite-rules";

const fresh: InviteState = { usedById: null, ip: null, revokedAt: null, roomClosed: false };
const used: InviteState = { ...fresh, usedById: "lea", ip: "1.1.1.1" };

describe("liens d'invitation (SALLE-04)", () => {
  it("génère un jeton de 256 bits, différent à chaque fois", () => {
    const token = newInviteToken();
    expect(token).toMatch(INVITE_TOKEN_PATTERN);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(newInviteToken()).not.toBe(token);
  });

  it("se lie à la première personne qui l'utilise", () => {
    expect(decideClaim(fresh, "lea", "1.1.1.1")).toEqual({ ok: true, firstUse: true });
  });

  it("laisse la même personne, depuis la même adresse, revenir", () => {
    expect(decideClaim(used, "lea", "1.1.1.1")).toEqual({ ok: true, firstUse: false });
  });

  it("refuse une autre adresse IP", () => {
    expect(decideClaim(used, "lea", "2.2.2.2")).toEqual({ ok: false, reason: "other_ip" });
    expect(decideClaim(used, "max", "2.2.2.2")).toEqual({ ok: false, reason: "other_ip" });
  });

  it("refuse une autre personne derrière la même adresse", () => {
    expect(decideClaim(used, "max", "1.1.1.1")).toEqual({ ok: false, reason: "other_person" });
  });

  it("refuse un lien révoqué (SALLE-07) ou d'une salle fermée", () => {
    expect(decideClaim({ ...used, revokedAt: new Date() }, "lea", "1.1.1.1")).toEqual({
      ok: false,
      reason: "revoked",
    });
    expect(decideClaim({ ...fresh, roomClosed: true }, "lea", "1.1.1.1")).toEqual({
      ok: false,
      reason: "closed",
    });
  });
});

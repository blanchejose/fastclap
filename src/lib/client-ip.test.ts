import { describe, expect, it } from "vitest";
import { clientIp } from "./client-ip";

describe("adresse IP (SALLE-04, SALLE-10)", () => {
  it("ignore les en-têtes quand aucun proxy n'est déclaré", () => {
    expect(clientIp({ "x-real-ip": "6.6.6.6" }, "::ffff:10.0.0.2", "")).toBe("10.0.0.2");
  });

  it("lit l'en-tête du proxy déclaré", () => {
    expect(clientIp({ "x-real-ip": "203.0.113.7" }, "10.0.0.2", "X-Real-IP")).toBe("203.0.113.7");
    expect(clientIp({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }, "10.0.0.2", "x-forwarded-for")).toBe(
      "1.1.1.1",
    );
  });

  it("revient à l'adresse de la connexion si l'en-tête manque", () => {
    expect(clientIp({}, "10.0.0.2", "x-real-ip")).toBe("10.0.0.2");
  });
});

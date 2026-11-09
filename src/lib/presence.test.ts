import { describe, expect, it } from "vitest";
import { resolvePresence } from "./presence";

describe("une seule salle à la fois (SALLE-06)", () => {
  it("laisse revenir dans la même salle (deuxième onglet, reconnexion)", () => {
    expect(resolvePresence("ABC234", "ABC234", true)).toBe("same");
  });

  it("refuse une autre salle tant que la personne est encore dans la première", () => {
    expect(resolvePresence("ABC234", "XYZ789", true)).toBe("elsewhere");
  });

  it("remplace une présence restée après la fermeture d'une salle", () => {
    expect(resolvePresence("ABC234", "XYZ789", false)).toBe("stale");
  });
});

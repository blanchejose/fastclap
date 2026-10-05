import { describe, expect, it } from "vitest";
import { isValidUsername, usernameBaseFrom } from "./username";

describe("nom d'utilisateur", () => {
  it("accepte 3 à 20 lettres, chiffres, - et _", () => {
    expect(isValidUsername("lea_03")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("léa")).toBe(false);
    expect(isValidUsername("a".repeat(21))).toBe(false);
  });

  it("transforme un nom Discord ou GitHub en pseudo valide", () => {
    expect(usernameBaseFrom("Blanche Djiofack")).toBe("Blanche_Djiofac");
    expect(usernameBaseFrom("Zoé")).toBe("Zoe");
    expect(usernameBaseFrom(null)).toBe("joueur");
  });
});

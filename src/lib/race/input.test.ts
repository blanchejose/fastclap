import { describe, expect, it } from "vitest";
import { EMPTY_FIELD, eraseField, readField } from "./input";
import { BACKSPACE } from "./typing";

describe("lecture du champ de frappe (COURSE-04)", () => {
  it("envoie chaque caractère ajouté", () => {
    const a = readField(EMPTY_FIELD, "l", "l");
    expect(a.keys).toEqual(["l"]);
    const b = readField(a.state, "le", "e");
    expect(b.keys).toEqual(["e"]);
    expect(b.state.value).toBe("e");
  });

  it("accepte l'accent choisi dans la bulle du Mac, sans faute", () => {
    // Le joueur maintient « e » : le champ reçoit d'abord « e »…
    const held = readField({ value: "p", pending: null }, "pe", "é");
    expect(held.keys).toEqual([]);
    // … puis le système remplace ce « e » par « é ».
    const chosen = readField(held.state, "é", "é");
    expect(chosen.keys).toEqual(["é"]);
  });

  it("envoie la lettre retenue si aucun accent ne suit", () => {
    const held = readField(EMPTY_FIELD, "e", "é");
    expect(readField(held.state, "e ", "é").keys).toEqual(["e", " "]);
  });

  it("accepte une lettre composée avec une touche morte", () => {
    expect(readField({ value: "p", pending: null }, "pé", "é").keys).toEqual(["é"]);
  });

  it("met les accents décomposés sous leur forme habituelle", () => {
    expect(readField(EMPTY_FIELD, "é", "é").keys).toEqual(["é"]);
  });

  it("efface comme un retour arrière quand un caractère envoyé est remplacé", () => {
    expect(readField({ value: "a", pending: null }, "b", "c").keys).toEqual([BACKSPACE, "b"]);
  });

  it("oublie une lettre retenue au retour arrière", () => {
    const held = readField(EMPTY_FIELD, "e", "é");
    expect(eraseField(held.state).keys).toEqual([]);
    expect(eraseField(EMPTY_FIELD).keys).toEqual([BACKSPACE]);
  });
});

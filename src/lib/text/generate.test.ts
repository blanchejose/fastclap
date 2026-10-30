import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT, type TextSettings } from "../race/config";
import { createRng } from "../race/random";
import {
  adaptPassage,
  classifyText,
  composeCoherent,
  generateRandomText,
  RANDOM_TIERS,
  wordPool,
} from "./generate";

const settings = (patch: Partial<TextSettings> = {}): TextSettings => ({
  ...DEFAULT_TEXT,
  ...patch,
});
const random = (patch: Partial<TextSettings> = {}, seed = 1) =>
  generateRandomText(settings({ kind: "RANDOM", ...patch }), createRng(seed));

describe("texte aléatoire (CONF-03, CONF-04)", () => {
  it("donne exactement le nombre de mots demandé", () => {
    for (const wordCount of [10, 37, 100])
      expect(random({ wordCount }).split(" ")).toHaveLength(wordCount);
  });

  it("est déterministe pour une graine, et change avec la graine", () => {
    expect(random({}, 5)).toBe(random({}, 5));
    expect(random({}, 5)).not.toBe(random({}, 6));
  });
});

describe("complexité du texte aléatoire (CONF-05)", () => {
  it("le niveau facile n'a que des mots fréquents de 5 lettres au plus", () => {
    const pool = wordPool(settings({ complexity: "BEGINNER" }));
    expect(pool.every((w) => w.length <= RANDOM_TIERS.BEGINNER.maxLength)).toBe(true);
  });

  it("le niveau moyen a des mots de 8 lettres au plus", () => {
    const pool = wordPool(settings({ complexity: "INTERMEDIATE" }));
    expect(Math.max(...pool.map((w) => w.length))).toBeLessThanOrEqual(8);
  });

  it("le niveau difficile ajoute des mots rares et longs", () => {
    expect(wordPool(settings({ complexity: "PRO" }))).toContain("kaléidoscope");
  });
});

describe("options du texte aléatoire (CONF-06)", () => {
  it("sans ponctuation, majuscules ni nombres : seulement des minuscules", () => {
    const text = random({ punctuation: false, capitals: false, numbers: false, wordCount: 100 });
    expect(text).toMatch(/^[\p{Ll} ]+$/u);
  });

  it("avec ponctuation, majuscules et nombres", () => {
    const text = random({ punctuation: true, capitals: true, numbers: true, wordCount: 100 });
    expect(text).toMatch(/^[\p{Lu}\d]/u);
    expect(text).toMatch(/\p{Lu}/u);
    expect(text).toMatch(/[.]$/);
    expect(text).toMatch(/\d/);
  });

  it("sans accents en français", () => {
    expect(random({ accents: false, wordCount: 100, complexity: "PRO" })).not.toMatch(/[éèêàçùœ]/);
  });
});

describe("caractères à inclure ou exclure (CONF-07)", () => {
  it("n'utilise aucun caractère exclu", () => {
    const text = random({ exclude: "ae", wordCount: 100 });
    expect(text.toLowerCase()).not.toMatch(/[ae]/);
  });

  it("n'utilise que des mots qui contiennent un caractère à inclure", () => {
    const text = random({
      include: "xz",
      complexity: "PRO",
      punctuation: false,
      capitals: false,
      wordCount: 30,
    });
    expect(text.split(" ").every((w) => /[xz]/.test(w))).toBe(true);
  });

  it("ignore un filtre qui ne laisse presque aucun mot", () => {
    expect(random({ include: "%", wordCount: 20 }).split(" ")).toHaveLength(20);
  });
});

describe("texte cohérent (CONF-03, CONF-06)", () => {
  const passage = "En 1815, M. Myriel était évêque de Digne ; c'était un vieillard.";

  it("garde le passage tel quel avec toutes les options", () => {
    const all = settings({ punctuation: true, capitals: true, numbers: true, accents: true });
    expect(adaptPassage(passage, all)).toBe(passage);
  });

  it("retire ce que les options désactivées concernent", () => {
    const none = settings({ punctuation: false, capitals: false, numbers: false, accents: false });
    expect(adaptPassage(passage, none)).toBe(
      "en m myriel etait eveque de digne c'etait un vieillard",
    );
  });

  it("enchaîne les passages et coupe au nombre de mots demandé (CONF-04)", () => {
    const { text, used } = composeCoherent(
      ["un deux trois", "quatre cinq six"],
      settings({ wordCount: 5 }),
    );
    expect(text).toBe("un deux trois quatre cinq");
    expect(used).toEqual(["un deux trois", "quatre cinq six"]);
  });

  it("préfère les passages sans nombres quand les nombres sont désactivés", () => {
    const { used } = composeCoherent(
      ["Il a 12 ans et demi.", "Le chat dort bien."],
      settings({ wordCount: 4 }),
    );
    expect(used).toEqual(["Le chat dort bien."]);
  });
});

describe("classement des passages (CONF-05)", () => {
  it("classe selon la longueur des mots et les caractères spéciaux", () => {
    expect(classifyText("le chat dort sur le lit")).toBe("BEGINNER");
    expect(
      classifyText("En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne."),
    ).toBe("PRO");
  });
});

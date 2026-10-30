// Fabrication du texte d'une course selon la configuration de la salle
// (CONF-03 à CONF-07). Code pur : le hasard vient d'un générateur à graine,
// ce qui rend chaque règle testable.
import type { Complexity, Language, TextSettings } from "../race/config";
import { between, type Rng } from "../race/random";
import { EN_COMMON, EN_RARE } from "./words-en";
import { FR_COMMON, FR_RARE } from "./words-fr";

const unique = (words: string[]) => [...new Set(words)];
const DICTIONARIES: Record<Language, { common: string[]; rare: string[] }> = {
  FR: { common: unique(FR_COMMON), rare: unique(FR_RARE) },
  EN: { common: unique(EN_COMMON), rare: unique(EN_RARE) },
};

// CONF-05, texte aléatoire : rang de fréquence et longueur des mots.
export const RANDOM_TIERS: Record<
  Complexity,
  { maxRank: number; maxLength: number; rare: boolean; maxNumber: number }
> = {
  BEGINNER: { maxRank: 150, maxLength: 5, rare: false, maxNumber: 99 },
  INTERMEDIATE: { maxRank: Infinity, maxLength: 8, rare: false, maxNumber: 999 },
  PRO: { maxRank: Infinity, maxLength: Infinity, rare: true, maxNumber: 9999 },
};

const MIN_POOL = 5; // en dessous, un filtre de caractères est ignoré

export function stripAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE");
}

const hasAny = (word: string, chars: string) =>
  [...chars.toLowerCase()].some((c) => word.toLowerCase().includes(c));

// Mots permis pour cette configuration (CONF-05, CONF-06, CONF-07).
export function wordPool(settings: TextSettings): string[] {
  const tier = RANDOM_TIERS[settings.complexity];
  const { common, rare } = DICTIONARIES[settings.language];
  let words = common
    .slice(0, tier.maxRank)
    .concat(tier.rare ? rare : [])
    .filter((w) => w.length <= tier.maxLength);
  if (settings.language === "FR" && !settings.accents) words = unique(words.map(stripAccents));

  const withoutExcluded = words.filter((w) => !hasAny(w, settings.exclude));
  if (withoutExcluded.length >= MIN_POOL) words = withoutExcluded;
  if (settings.include) {
    const withIncluded = words.filter((w) => hasAny(w, settings.include));
    if (withIncluded.length >= MIN_POOL) words = withIncluded;
  }
  return words;
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

// CONF-03, texte aléatoire : mots du dictionnaire, puis nombres, ponctuation
// et majuscules selon les options (CONF-06), sans caractère exclu (CONF-07).
export function generateRandomText(settings: TextSettings, rng: Rng): string {
  const pool = wordPool(settings);
  const allowed = (char: string) => !hasAny(char, settings.exclude);
  const tier = RANDOM_TIERS[settings.complexity];
  const pick = <T>(items: readonly T[]) => items[Math.floor(rng() * items.length)];

  const words: string[] = [];
  while (words.length < settings.wordCount) {
    let word = pick(pool);
    if (word === words.at(-1) && pool.length > 1) continue;
    if (settings.numbers && rng() < 0.1) {
      const number = String(1 + Math.floor(rng() * tier.maxNumber));
      if ([...number].every(allowed)) word = number;
    }
    words.push(word);
  }

  let sentenceLeft = Math.round(between(rng, 5, 11));
  let startOfSentence = true;
  return words
    .map((word, i) => {
      const last = i === words.length - 1;
      let out = word;
      if (settings.capitals && (startOfSentence || rng() < (settings.punctuation ? 0.08 : 0.15)))
        out = capitalize(out);
      startOfSentence = false;
      if (settings.punctuation) {
        sentenceLeft -= 1;
        if (last || sentenceLeft === 0) {
          const end = settings.complexity === "PRO" && rng() < 0.3 ? pick(["!", "?"]) : ".";
          if (allowed(end)) out += end;
          else if (allowed(".")) out += ".";
          startOfSentence = true;
          sentenceLeft = Math.round(between(rng, 5, 11));
        } else if (rng() < 0.12) {
          const mark = settings.complexity === "PRO" && rng() < 0.3 ? pick([";", ":"]) : ",";
          if (allowed(mark)) out += mark;
        }
      }
      return out;
    })
    .join(" ");
}

// CONF-06, texte cohérent : les options désactivées retirent ce qu'elles
// concernent du passage (ponctuation, majuscules, accents, nombres).
export function adaptPassage(content: string, settings: TextSettings): string {
  let text = content;
  if (!settings.numbers) text = text.replace(/\S*\d\S*/g, " ");
  if (!settings.punctuation)
    text = text.replace(/[^\p{L}\p{N}\s'’-]/gu, " ").replace(/(^|\s)['’-]+|['’-]+(?=\s|$)/g, "$1");
  if (!settings.capitals) text = text.toLocaleLowerCase(settings.language === "FR" ? "fr" : "en");
  if (settings.language === "FR" && !settings.accents) text = stripAccents(text);
  return text.replace(/\s+/g, " ").trim();
}

// CONF-03 et CONF-04, texte cohérent : on enchaîne des passages (dans l'ordre
// reçu) jusqu'à la longueur demandée, puis on coupe au bon nombre de mots.
// Sans nombres, les passages qui n'en contiennent pas passent en premier.
export function composeCoherent(
  passages: string[],
  settings: TextSettings,
): { text: string; used: string[] } {
  const ordered = settings.numbers
    ? passages
    : [...passages.filter((p) => !/\d/.test(p)), ...passages.filter((p) => /\d/.test(p))];
  const words: string[] = [];
  const used: string[] = [];
  for (let i = 0; ordered.length > 0 && words.length < settings.wordCount; i++) {
    const passage = ordered[i % ordered.length];
    if (i < ordered.length) used.push(passage);
    words.push(...adaptPassage(passage, settings).split(" ").filter(Boolean));
  }
  return { text: words.slice(0, settings.wordCount).join(" "), used };
}

// CONF-05, texte cohérent : complexité calculée à partir du passage.
// Score = longueur moyenne des mots + 10 × proportion de caractères spéciaux
// (majuscules, chiffres, ponctuation, lettres accentuées).
export function textScore(content: string): number {
  const words = content.split(/\s+/).filter(Boolean);
  const letters = words.map((w) => w.replace(/[^\p{L}]/gu, "").length);
  const average = letters.reduce((a, b) => a + b, 0) / Math.max(1, words.length);
  const chars = [...content.replace(/\s/g, "")];
  const special = chars.filter((c) => /[\p{Lu}\p{N}\p{P}\p{S}]/u.test(c) || /[^\x00-\x7F]/.test(c));
  return average + (10 * special.length) / Math.max(1, chars.length);
}

export const SCORE_THRESHOLDS = { intermediate: 5, pro: 6 };

export function classifyText(content: string): Complexity {
  const score = textScore(content);
  if (score >= SCORE_THRESHOLDS.pro) return "PRO";
  if (score >= SCORE_THRESHOLDS.intermediate) return "INTERMEDIATE";
  return "BEGINNER";
}

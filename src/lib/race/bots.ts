// Moteur des bots (BOT-01 à BOT-05). Un bot « tape » touche par touche avec
// les mêmes règles que les humains (typing.ts). Tout le hasard vient d'une
// graine : à graine égale, le bot tape exactement pareil, à la milliseconde près.
import { between, createRng, type Rng } from "./random";
import { applyKey, BACKSPACE, isComplete, type ErrorMode, type Typing } from "./typing";

export const BOT_LEVELS = ["NOOB", "BEGINNER", "INTERMEDIATE", "EXPERT", "IMPOSSIBLE"] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];

// Valeurs documentées dans docs/EXIGENCES.md (BOT-01).
export const BOT_PROFILES: Record<BotLevel, { minWpm: number; maxWpm: number; errorRate: number }> =
  {
    NOOB: { minWpm: 10, maxWpm: 20, errorRate: 0.12 },
    BEGINNER: { minWpm: 20, maxWpm: 35, errorRate: 0.08 },
    INTERMEDIATE: { minWpm: 35, maxWpm: 60, errorRate: 0.05 },
    EXPERT: { minWpm: 70, maxWpm: 100, errorRate: 0.02 },
    IMPOSSIBLE: { minWpm: 140, maxWpm: 170, errorRate: 0.005 },
  };

export type Bot = {
  level: BotLevel;
  rng: Rng;
  targetWpm: number; // vitesse visée pour cette course
  pace: number; // multiplicateur qui dérive au fil des mots (accélérations, coups de fatigue)
  nextAt: number; // ms depuis le départ où tombe la prochaine touche
  lastKeyAt: number; // ms depuis le départ de la dernière touche tapée
  mustErase: boolean; // FREE : la dernière touche était fausse, il va l'effacer
};

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

// Les hésitations, les touches difficiles et les fautes coûtent environ 20 %
// de vitesse : le rythme de base est donc plus rapide que la vitesse visée,
// pour que le MPM final tombe dans la plage du niveau.
const SLOWDOWN_COMPENSATION = 1.2;

export function createBot(level: BotLevel, seed: number): Bot {
  const rng = createRng(seed);
  const { minWpm, maxWpm } = BOT_PROFILES[level];
  const bot: Bot = {
    level,
    rng,
    targetWpm: between(rng, minWpm, maxWpm),
    pace: 1,
    nextAt: 0,
    lastKeyAt: 0,
    mustErase: false,
  };
  bot.nextAt = between(rng, 250, 700); // temps de réaction au « go »
  return bot;
}

// Les touches qui demandent un effort : majuscules, chiffres, ponctuation, accents.
function isHard(char: string): boolean {
  return /[^a-z ]/.test(char);
}

function wordLengthAt(text: string, index: number): number {
  let start = index;
  while (start > 0 && text[start - 1] !== " ") start--;
  let end = index;
  while (end < text.length && text[end] !== " ") end++;
  return end - start;
}

function wrongKeyFor(rng: Rng, expected: string): string {
  let key = expected;
  while (key === expected) key = LETTERS[Math.floor(rng() * LETTERS.length)];
  return key;
}

// Délai avant la prochaine touche, selon le caractère qui vient (BOT-02).
function delayFor(bot: Bot, text: string, index: number): number {
  const { rng } = bot;
  const charMs = 60_000 / (bot.targetWpm * SLOWDOWN_COMPENSATION * 5 * bot.pace);
  let delay = charMs * between(rng, 0.6, 1.4);
  const char = text[index] ?? "";
  if (isHard(char)) delay *= between(rng, 1.3, 1.9);
  if (wordLengthAt(text, index) >= 8) delay *= 1.2; // mot long : ralentit
  const wordStart = index > 0 && text[index - 1] === " ";
  if (wordStart) {
    // Entre deux mots : le rythme dérive, et parfois le bot hésite.
    bot.pace = Math.min(1.2, Math.max(0.8, bot.pace + between(rng, -0.08, 0.08)));
    if (rng() < 0.12) delay += between(rng, 150, 600);
  }
  return delay;
}

// Fait taper le bot jusqu'à `elapsedMs` (ms depuis le départ). Le résultat ne
// dépend pas de la fréquence des appels : seulement de la graine et du texte.
export function stepBot(
  bot: Bot,
  typing: Typing,
  text: string,
  mode: ErrorMode,
  elapsedMs: number,
): void {
  const { rng } = bot;
  const { errorRate } = BOT_PROFILES[bot.level];
  while (bot.nextAt <= elapsedMs && !isComplete(typing, text)) {
    bot.lastKeyAt = bot.nextAt;
    if (bot.mustErase) {
      applyKey(typing, text, BACKSPACE, mode);
      bot.mustErase = false;
      bot.nextAt += delayFor(bot, text, typing.typed.length);
      continue;
    }
    const index = typing.typed.length;
    const expected = text[index];
    const outcome =
      rng() < errorRate
        ? applyKey(typing, text, wrongKeyFor(rng, expected), mode)
        : applyKey(typing, text, expected, mode);
    if (outcome === "wrong") {
      // BOT-03 : la faute coûte un temps de réaction avant la correction.
      bot.nextAt += between(rng, 250, 700);
      if (mode === "FREE") bot.mustErase = true;
    } else {
      bot.nextAt += delayFor(bot, text, typing.typed.length);
    }
  }
}

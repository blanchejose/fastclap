// Lien entre une salle en mémoire et la base : sa configuration (CONF-12 :
// gardée même si le serveur redémarre) et le choix du texte de chaque course.
import { randomInt } from "node:crypto";
import type { Room as RoomRow } from "../../generated/prisma/client";
import { prisma } from "../prisma";
import { composeCoherent, generateRandomText } from "../text/generate";
import type { Config } from "./config";
import { createRng, type Rng } from "./random";

type ConfigColumns = Pick<
  RoomRow,
  | "visibility"
  | "maxPlayers"
  | "errorMode"
  | "timeLimitSec"
  | "bonuses"
  | "language"
  | "textKind"
  | "wordCount"
  | "difficulty"
  | "punctuation"
  | "numbers"
  | "capitals"
  | "accents"
  | "include"
  | "blacklist"
>;

export const CONFIG_COLUMNS = {
  visibility: true,
  maxPlayers: true,
  errorMode: true,
  timeLimitSec: true,
  bonuses: true,
  language: true,
  textKind: true,
  wordCount: true,
  difficulty: true,
  punctuation: true,
  numbers: true,
  capitals: true,
  accents: true,
  include: true,
  blacklist: true,
} as const;

export function configFromRow(row: ConfigColumns): Config {
  return {
    visibility: row.visibility,
    maxPlayers: row.maxPlayers,
    errorMode: row.errorMode,
    timeLimitMs: row.timeLimitSec === null ? null : row.timeLimitSec * 1000,
    bonuses: row.bonuses,
    text: {
      language: row.language,
      kind: row.textKind,
      wordCount: row.wordCount,
      complexity: row.difficulty,
      punctuation: row.punctuation,
      numbers: row.numbers,
      capitals: row.capitals,
      accents: row.accents,
      include: row.include,
      exclude: row.blacklist,
    },
  };
}

export function configToRow(config: Config): ConfigColumns {
  const { text } = config;
  return {
    visibility: config.visibility,
    maxPlayers: config.maxPlayers,
    errorMode: config.errorMode,
    timeLimitSec: config.timeLimitMs === null ? null : Math.round(config.timeLimitMs / 1000),
    bonuses: config.bonuses,
    language: text.language,
    textKind: text.kind,
    wordCount: text.wordCount,
    difficulty: text.complexity,
    punctuation: text.punctuation,
    numbers: text.numbers,
    capitals: text.capitals,
    accents: text.accents,
    include: text.include,
    blacklist: text.exclude,
  };
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Passages déjà courus dans chaque salle : on passe par tous ceux du niveau
// avant d'en reprendre un.
const usedTexts = new Map<string, Set<string>>();

export function forgetRoom(code: string) {
  usedTexts.delete(code);
}

// Le texte de la prochaine course, selon la configuration (CONF-02 à CONF-07).
export async function pickText(code: string, config: Config): Promise<string> {
  const rng = createRng(randomInt(2 ** 31));
  const { text: settings } = config;
  if (settings.kind === "RANDOM") return generateRandomText(settings, rng);

  const rows = await prisma.text.findMany({
    where: { language: settings.language },
    select: { content: true, difficulty: true },
  });
  if (rows.length === 0) return generateRandomText(settings, rng); // corpus vide

  const used = usedTexts.get(code) ?? new Set<string>();
  const level = rows.filter((r) => r.difficulty === settings.complexity).map((r) => r.content);
  if (level.length > 0 && level.every((p) => used.has(p))) used.clear(); // nouveau tour
  const others = rows.filter((r) => r.difficulty !== settings.complexity).map((r) => r.content);
  // Passages du niveau pas encore courus, puis ceux déjà courus, puis les
  // autres niveaux si le niveau ne suffit pas pour la longueur demandée.
  const ordered = [
    ...shuffle(
      level.filter((p) => !used.has(p)),
      rng,
    ),
    ...shuffle(
      level.filter((p) => used.has(p)),
      rng,
    ),
    ...shuffle(others, rng),
  ];
  const { text, used: consumed } = composeCoherent(ordered, settings);
  for (const passage of consumed) if (level.includes(passage)) used.add(passage);
  usedTexts.set(code, used);
  return text;
}

// Configuration d'une salle (CONF-01 à CONF-11) : les réglages, leurs limites
// et le schéma Zod qui valide chaque modification envoyée par l'hôte (TECH-07).
import { z } from "zod";
import type { ErrorMode } from "./typing";

export const LANGUAGES = ["FR", "EN"] as const;
export const TEXT_KINDS = ["COHERENT", "RANDOM"] as const;
// Complexité (CONF-05) : mêmes valeurs que l'énumération Difficulty de la base.
export const COMPLEXITIES = ["BEGINNER", "INTERMEDIATE", "PRO"] as const;
export const VISIBILITIES = ["PUBLIC", "SEMI_PUBLIC", "PRIVATE"] as const;

export type Language = (typeof LANGUAGES)[number];
export type TextKind = (typeof TEXT_KINDS)[number];
export type Complexity = (typeof COMPLEXITIES)[number];
export type Visibility = (typeof VISIBILITIES)[number];

export const LIMITS = {
  timeLimitSec: { min: 30, max: 600 }, // CONF-01 : 30 s à 10 min
  wordCount: { min: 10, max: 100 }, // CONF-04
  maxPlayers: { min: 2, max: 30 }, // SALLE-05
  chars: 30, // CONF-07 : longueur des listes de caractères
} as const;

export type TextSettings = {
  language: Language; // CONF-02
  kind: TextKind; // CONF-03
  wordCount: number; // CONF-04
  complexity: Complexity; // CONF-05
  punctuation: boolean; // CONF-06
  numbers: boolean;
  capitals: boolean;
  accents: boolean; // français seulement
  include: string; // CONF-07 : texte aléatoire seulement
  exclude: string;
};

export type Config = {
  visibility: Visibility; // CONF-11
  maxPlayers: number; // CONF-11, SALLE-05 : les spectateurs ne comptent pas
  errorMode: ErrorMode; // CONF-08
  timeLimitMs: number | null; // CONF-01 : null = aucune limite
  bonuses: boolean; // CONF-09
  text: TextSettings;
};

export const DEFAULT_TEXT: TextSettings = {
  language: "FR",
  kind: "COHERENT",
  wordCount: 25,
  complexity: "BEGINNER",
  punctuation: true,
  numbers: false,
  capitals: true,
  accents: true,
  include: "",
  exclude: "",
};

export const DEFAULT_CONFIG: Config = {
  visibility: "PUBLIC",
  maxPlayers: 30,
  errorMode: "STRICT",
  timeLimitMs: null,
  bonuses: true,
  text: DEFAULT_TEXT,
};

// Liste de caractères : sans espaces ni doublons, au plus 30.
const charList = z
  .string()
  .max(LIMITS.chars * 4)
  .transform((value) => [...new Set([...value.replace(/\s/g, "")])].join(""))
  .pipe(z.string().max(LIMITS.chars));

// Modification partielle envoyée par l'hôte : chaque champ est facultatif.
export const configPatchSchema = z
  .object({
    // PRIVATE arrivera avec les liens d'invitation (SALLE-04) : sans eux,
    // personne ne pourrait plus entrer dans la salle.
    visibility: z.enum(["PUBLIC", "SEMI_PUBLIC"]),
    maxPlayers: z.number().int().min(LIMITS.maxPlayers.min).max(LIMITS.maxPlayers.max),
    errorMode: z.enum(["STRICT", "FREE"]),
    timeLimitSec: z
      .number()
      .int()
      .min(LIMITS.timeLimitSec.min)
      .max(LIMITS.timeLimitSec.max)
      .nullable(),
    bonuses: z.boolean(),
    language: z.enum(LANGUAGES),
    kind: z.enum(TEXT_KINDS),
    wordCount: z.number().int().min(LIMITS.wordCount.min).max(LIMITS.wordCount.max),
    complexity: z.enum(COMPLEXITIES),
    punctuation: z.boolean(),
    numbers: z.boolean(),
    capitals: z.boolean(),
    accents: z.boolean(),
    include: charList,
    exclude: charList,
  })
  .partial()
  .strict();

export type ConfigPatch = z.infer<typeof configPatchSchema>;

export function applyPatch(config: Config, patch: ConfigPatch): Config {
  const { visibility, maxPlayers, errorMode, timeLimitSec, bonuses, ...text } = patch;
  return {
    visibility: visibility ?? config.visibility,
    maxPlayers: maxPlayers ?? config.maxPlayers,
    errorMode: errorMode ?? config.errorMode,
    timeLimitMs:
      timeLimitSec === undefined
        ? config.timeLimitMs
        : timeLimitSec === null
          ? null
          : timeLimitSec * 1000,
    bonuses: bonuses ?? config.bonuses,
    text: { ...config.text, ...text },
  };
}

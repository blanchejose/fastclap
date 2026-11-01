// Bonus de remontée (BONUS-01 à BONUS-04). Code pur : le hasard vient du
// générateur à graine de la course, donc chaque règle est testable.
import type { Racer, Room } from "./engine";
import type { Rng } from "./random";
import { isComplete, progress } from "./typing";

export const BONUS_TYPES = ["SHORTEN", "EXTEND", "FOG"] as const;
// SHORTEN : −3 mots pour le joueur en retard (l'aide).
// EXTEND : +3 mots au texte du meneur (le ralentit).
// FOG : les prochains mots du meneur sont flous quelques secondes (le ralentit).
export type BonusType = (typeof BONUS_TYPES)[number];

export const CHECKPOINTS = [0.25, 0.5, 0.75]; // progression du meneur
export const BEHIND_GAP = 0.25; // 25 points de pourcentage derrière le meneur
export const MAX_BONUSES = 3; // par joueur et par course
export const BONUS_WORDS = 3;
export const FOG_MS = 5_000;

export type BonusEvent = {
  at: number;
  checkpoint: number; // 0, 1 ou 2 : 25 %, 50 % ou 75 %
  type: BonusType;
  beneficiaryId: string; // le joueur en retard qui reçoit le bonus
  beneficiaryName: string;
  targetId: string; // qui subit l'effet : lui-même (−3 mots) ou le meneur
  targetName: string;
};

// Retire jusqu'à `n` mots à la fin du texte, sans toucher à ce qui est déjà
// tapé : on coupe seulement sur un espace situé au curseur ou après.
export function shortenText(text: string, typedLength: number, n = BONUS_WORDS): string {
  const spaces: number[] = [];
  for (let i = typedLength; i < text.length; i++) if (text[i] === " ") spaces.push(i);
  if (spaces.length === 0) return text;
  return text.slice(0, spaces[Math.max(0, spaces.length - n)]);
}

export function extendText(text: string, words: string[]): string {
  return [text, ...words].join(" ");
}

// Mots ajoutés au meneur : tirés du texte de la course (même langue, même style).
export function pickWords(source: string, rng: Rng, n = BONUS_WORDS): string[] {
  const words = source.split(" ").filter(Boolean);
  return Array.from({ length: n }, () => words[Math.floor(rng() * words.length)]);
}

const progressOf = (r: Racer) => progress(r.typing, r.text);

// Les joueurs en retard (BONUS-01) : encore en course, derrière le meneur,
// et soit derniers, soit à 25 points ou plus derrière lui.
export function behindRacers(candidates: Racer[], leaderProgress: number): Racer[] {
  const lowest = Math.min(...candidates.map(progressOf));
  return candidates
    .filter((r) => {
      const p = progressOf(r);
      return p < leaderProgress && (p === lowest || leaderProgress - p >= BEHIND_GAP);
    })
    .sort((a, b) => progressOf(a) - progressOf(b) || a.id.localeCompare(b.id));
}

// Distribue les bonus des points de contrôle que le meneur vient de passer.
// Chaque point ne compte qu'une fois par course (room.checkpoints).
export function applyBonuses(room: Room, now: number, rng: Rng): BonusEvent[] {
  const racers = [...room.racers.values()];
  const inRace = racers.filter((r) => r.status === "RACING" || r.status === "FINISHED");
  if (inRace.length === 0) return [];
  const leader = inRace.reduce((a, b) => (progressOf(b) > progressOf(a) ? b : a));
  const leaderProgress = progressOf(leader);

  const events: BonusEvent[] = [];
  while (room.checkpoints < CHECKPOINTS.length && leaderProgress >= CHECKPOINTS[room.checkpoints]) {
    const checkpoint = room.checkpoints++;
    // Le malus vise le meneur s'il court encore (un arrivé ne peut plus ralentir).
    const target = leader.status === "RACING" ? leader : null;
    const candidates = racers.filter((r) => r.status === "RACING" && r !== target);
    if (candidates.length === 0) continue;
    let extended = false;
    let fogged = false;
    for (const racer of behindRacers(candidates, leaderProgress)) {
      if (racer.bonuses.length >= MAX_BONUSES) continue;
      let type = BONUS_TYPES[Math.floor(rng() * BONUS_TYPES.length)];
      // Un seul +3 mots et un seul brouillard sur le meneur par point de contrôle.
      if (!target || (type === "EXTEND" && extended) || (type === "FOG" && fogged))
        type = "SHORTEN";
      const hit = type === "SHORTEN" ? racer : (target as Racer);
      if (type === "SHORTEN") {
        racer.text = shortenText(racer.text, racer.typing.typed.length);
        if (isComplete(racer.typing, racer.text)) {
          racer.status = "FINISHED";
          racer.finishedAt = now;
        }
      } else if (type === "EXTEND") {
        hit.text = extendText(hit.text, pickWords(room.text ?? hit.text, rng));
        extended = true;
      } else {
        hit.fogUntil = now + FOG_MS;
        fogged = true;
      }
      racer.bonuses.push(type);
      events.push({
        at: now,
        checkpoint,
        type,
        beneficiaryId: racer.id,
        beneficiaryName: racer.name,
        targetId: hit.id,
        targetName: hit.name,
      });
    }
  }
  return events;
}

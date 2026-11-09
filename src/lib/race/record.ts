// RES-04, RES-05 : ce qu'on garde d'une course terminée. Code pur : le serveur
// l'écrit en base (results.ts), les tests le vérifient.
import { isGuestId } from "../guest-id";
import type { BonusType } from "./bonus";
import type { BotLevel } from "./bots";
import { ranking, seriesOf, statsOf, type RacerStatus, type Room } from "./engine";

export type RaceEntry = {
  racerId: string;
  name: string;
  userId: string | null; // RES-05 : seulement pour un utilisateur avec un compte
  guestName: string | null;
  botLevel: BotLevel | null;
  rank: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  progress: number;
  durationMs: number;
  status: Exclude<RacerStatus, "RACING">;
  bonuses: BonusType[];
  samples: { t: number; wpm: number }[];
  missed: Record<string, number>;
};

export function buildRaceEntries(room: Room, now: number): RaceEntry[] {
  return ranking(room).map((racer, i) => {
    const stats = statsOf(room, racer, now);
    const guest = racer.kind === "HUMAN" && isGuestId(racer.id);
    return {
      racerId: racer.id,
      name: racer.name,
      userId: racer.kind === "HUMAN" && !guest ? racer.id : null,
      guestName: guest ? racer.name : null,
      botLevel: racer.botLevel,
      rank: i + 1,
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      errors: stats.errors,
      progress: stats.progress,
      durationMs: stats.timeMs,
      // Une course se termine quand plus personne ne court (COURSE-09).
      status: racer.status === "RACING" ? "TIME_UP" : racer.status,
      bonuses: racer.bonuses,
      samples: seriesOf(room, racer, now),
      missed: racer.typing.missed,
    };
  });
}

// RES-04 : un record personnel est un MPM plus haut que le meilleur des
// courses précédentes que la personne a terminées (la première en est un).
export function isNewRecord(entry: RaceEntry, previousBest: number | null): boolean {
  if (entry.userId === null || entry.status !== "FINISHED") return false;
  return previousBest === null || entry.wpm > previousBest;
}

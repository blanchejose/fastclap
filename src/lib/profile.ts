// AUTH-06 : statistiques personnelles, calculées à partir des résultats gardés
// en base (RES-05).
import { prisma } from "./prisma";

export type RaceStat = {
  wpm: number;
  accuracy: number;
  rank: number;
  status: "FINISHED" | "TIME_UP" | "ABANDONED";
  endedAt: Date | null;
};

export type ProfileStats = {
  races: number; // toutes les courses, abandons compris
  wins: number; // 1re place à l'arrivée
  bestWpm: number | null; // sur les courses terminées
  averageWpm: number | null;
  averageAccuracy: number | null;
};

const average = (values: number[]) =>
  values.length === 0
    ? null
    : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

// Meilleur MPM, moyennes et progression ne comptent que les courses terminées :
// un abandon à 0 MPM ne dit rien de la vitesse de frappe.
export function profileStats(results: RaceStat[]): ProfileStats {
  const finished = results.filter((r) => r.status === "FINISHED");
  return {
    races: results.length,
    wins: finished.filter((r) => r.rank === 1).length,
    bestWpm: finished.length === 0 ? null : Math.max(...finished.map((r) => r.wpm)),
    averageWpm: average(finished.map((r) => r.wpm)),
    averageAccuracy: average(finished.map((r) => r.accuracy)),
  };
}

// AUTH-06 : progression du MPM, de la plus ancienne à la plus récente course
// terminée (les 50 dernières).
export function progression(results: RaceStat[], limit = 50) {
  return results
    .filter((r) => r.status === "FINISHED" && r.endedAt !== null)
    .sort((a, b) => a.endedAt!.getTime() - b.endedAt!.getTime())
    .slice(-limit)
    .map((r) => ({ at: r.endedAt!.toISOString(), wpm: r.wpm }));
}

export async function getProfile(userId: string) {
  const [user, rows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, name: true, avatarUpdatedAt: true },
    }),
    prisma.raceResult.findMany({
      where: { participant: { userId } },
      select: {
        wpm: true,
        accuracy: true,
        rank: true,
        status: true,
        participant: { select: { race: { select: { endedAt: true } } } },
      },
    }),
  ]);
  if (!user) return null;
  const results: RaceStat[] = rows.map((r) => ({
    wpm: r.wpm,
    accuracy: r.accuracy,
    rank: r.rank,
    status: r.status,
    endedAt: r.participant.race.endedAt,
  }));
  return { user, stats: profileStats(results), progression: progression(results) };
}

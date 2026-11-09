// RES-05 : écriture d'une course terminée en base, avec ses participants, leurs
// résultats, la courbe du MPM et les touches manquées. Une seule écriture par
// course, jamais pendant la frappe (PERF-02).
import { prisma } from "./prisma";
import type { Room } from "./race/engine";
import { buildRaceEntries, isNewRecord } from "./race/record";

export async function saveRace(
  room: Room,
  now: number,
): Promise<{ raceId: string; records: string[] }> {
  const row = await prisma.room.findUnique({ where: { code: room.code }, select: { id: true } });
  if (!row) throw new Error(`Salle ${room.code} introuvable`);
  const entries = buildRaceEntries(room, now);

  // Meilleur MPM précédent de chaque utilisateur, sur ses courses terminées.
  const userIds = entries.flatMap((e) => (e.userId ? [e.userId] : []));
  const previous = await prisma.participant.findMany({
    where: { userId: { in: userIds }, result: { status: "FINISHED" } },
    select: { userId: true, result: { select: { wpm: true } } },
  });
  const best = new Map<string, number>();
  for (const p of previous) {
    if (!p.userId || !p.result) continue;
    best.set(p.userId, Math.max(best.get(p.userId) ?? 0, p.result.wpm));
  }

  const records: string[] = [];
  const race = await prisma.race.create({
    data: {
      roomId: row.id,
      content: room.text ?? "",
      language: room.config.text.language,
      state: "FINISHED",
      startAt: room.startAt === null ? null : new Date(room.startAt),
      endedAt: new Date(room.endedAt ?? now),
      participants: {
        create: entries.map((entry) => {
          const isRecord = isNewRecord(
            entry,
            entry.userId ? (best.get(entry.userId) ?? null) : null,
          );
          if (isRecord) records.push(entry.racerId);
          return {
            userId: entry.userId,
            guestName: entry.guestName,
            name: entry.name,
            botLevel: entry.botLevel,
            role: entry.botLevel ? "BOT" : "PLAYER",
            status: entry.status === "ABANDONED" ? "ABANDONED" : "FINISHED",
            position: entry.rank,
            errors: entry.errors,
            result: {
              create: {
                rank: entry.rank,
                wpm: entry.wpm,
                rawWpm: entry.rawWpm,
                accuracy: entry.accuracy,
                errors: entry.errors,
                progress: entry.progress,
                durationMs: entry.durationMs,
                status: entry.status,
                bonuses: entry.bonuses,
                samples: entry.samples,
                missed: entry.missed,
                isRecord,
              },
            },
          };
        }),
      },
    },
    select: { id: true },
  });
  return { raceId: race.id, records };
}

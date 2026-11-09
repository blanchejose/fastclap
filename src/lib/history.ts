// HIST-01, HIST-02 : l'historique d'un utilisateur et la page de résultats
// d'une course passée, relue en base (RES-05).
import { z } from "zod";
import type { BonusType } from "./race/bonus";
import { BONUS_TYPES } from "./race/bonus";
import type { RacerView } from "./race/engine";
import { avatarUrl } from "./avatar-url";
import { prisma } from "./prisma";

export const HISTORY_PAGE_SIZE = 10;

// Numéro de page lu dans l'adresse : 1 si absent ou invalide, jamais au-delà
// de la dernière page.
export function parsePage(raw: unknown, total: number, size = HISTORY_PAGE_SIZE): number {
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Number(typeof raw === "string" ? raw : 1);
  return Number.isInteger(page) ? Math.min(pages, Math.max(1, page)) : 1;
}

export async function countHistory(userId: string) {
  return prisma.participant.count({ where: { userId, result: { isNot: null } } });
}

export async function listHistory(userId: string, page: number) {
  const rows = await prisma.participant.findMany({
    where: { userId, result: { isNot: null } },
    orderBy: { race: { endedAt: "desc" } },
    skip: (page - 1) * HISTORY_PAGE_SIZE,
    take: HISTORY_PAGE_SIZE,
    select: {
      race: {
        select: {
          id: true,
          endedAt: true,
          language: true,
          room: { select: { code: true } },
          _count: { select: { participants: true } },
        },
      },
      result: {
        select: { rank: true, wpm: true, accuracy: true, status: true, isRecord: true },
      },
    },
  });
  return rows.flatMap(({ race, result }) =>
    result
      ? [
          {
            raceId: race.id,
            endedAt: race.endedAt,
            language: race.language,
            roomCode: race.room.code,
            total: race._count.participants,
            ...result,
          },
        ]
      : [],
  );
}

// Les champs JSON relus de la base sont vérifiés avant l'affichage.
const samplesSchema = z.array(z.object({ t: z.number(), wpm: z.number() })).catch([]);
const missedSchema = z.record(z.string(), z.number()).catch({});
const isBonus = (b: string): b is BonusType => (BONUS_TYPES as readonly string[]).includes(b);

export type StoredParticipant = {
  id: string;
  userId: string | null;
  name: string;
  avatar: string | null;
  botLevel: RacerView["botLevel"] | "PRO";
  result: {
    rank: number;
    wpm: number;
    rawWpm: number;
    accuracy: number;
    errors: number;
    progress: number;
    durationMs: number;
    status: RacerView["status"];
    bonuses: string[];
    samples: unknown;
    missed: unknown;
    isRecord: boolean;
  } | null;
};

// Une course enregistrée, au format de l'écran des résultats (Results.tsx).
export function toRacerViews(participants: StoredParticipant[]): RacerView[] {
  return participants
    .flatMap((p) => (p.result ? [{ ...p, result: p.result }] : []))
    .sort((a, b) => a.result.rank - b.result.rank)
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      kind: p.botLevel ? "BOT" : "HUMAN",
      avatar: p.avatar,
      botLevel: p.botLevel === "PRO" ? "EXPERT" : p.botLevel,
      status: p.result.status,
      rank: p.result.rank,
      lane: i,
      bonuses: p.result.bonuses.filter(isBonus),
      fogUntil: null,
      samples: samplesSchema.parse(p.result.samples),
      missed: missedSchema.parse(p.result.missed),
      wpm: p.result.wpm,
      rawWpm: p.result.rawWpm,
      accuracy: p.result.accuracy,
      errors: p.result.errors,
      progress: p.result.progress,
      timeMs: p.result.durationMs,
    }));
}

// HIST-02 : seuls les participants de la course peuvent rouvrir ses résultats.
export async function getRaceForUser(raceId: string, userId: string) {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    select: {
      id: true,
      endedAt: true,
      content: true,
      room: { select: { code: true } },
      participants: {
        select: {
          id: true,
          userId: true,
          name: true,
          botLevel: true,
          user: { select: { avatarUpdatedAt: true } },
          result: {
            select: {
              rank: true,
              wpm: true,
              rawWpm: true,
              accuracy: true,
              errors: true,
              progress: true,
              durationMs: true,
              status: true,
              bonuses: true,
              samples: true,
              missed: true,
              isRecord: true,
            },
          },
        },
      },
    },
  });
  const me = race?.participants.find((p) => p.userId === userId);
  if (!race || !me) return null;
  return {
    id: race.id,
    endedAt: race.endedAt,
    content: race.content,
    roomCode: race.room.code,
    meId: me.id,
    racers: toRacerViews(
      race.participants.map(({ user, ...p }) => ({
        ...p,
        avatar: p.userId ? avatarUrl(p.userId, user?.avatarUpdatedAt ?? null) : null,
      })),
    ),
    records: race.participants.filter((p) => p.result?.isRecord).map((p) => p.id),
  };
}

// TECH-04 : données de démonstration — trois comptes et un historique de
// courses, pour voir l'historique, les graphiques et le profil tout de suite.
// Le hasard vient d'une graine fixe : le seed donne toujours les mêmes données.
import { hash } from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { createRng, between, type Rng } from "../src/lib/race/random";

const DEMO_PASSWORD = "fastclap-demo";
const DEMO_USERS = [
  { username: "demo_lea", name: "Léa", start: 45, gain: 25 },
  { username: "demo_max", name: "Max", start: 30, gain: 15 },
  { username: "demo_zoe", name: "Zoé", start: 62, gain: 12 },
] as const;
const DEMO_ROOM = "DEMX42";
const RACES = 12;
const DAY = 24 * 60 * 60 * 1000;

type DemoRacer = {
  userId: string | null;
  name: string;
  botLevel: "INTERMEDIATE" | null;
  wpm: number;
  abandoned: boolean;
};

// Courbe du MPM : départ plus lent, puis autour de la vitesse finale.
function samplesFor(wpm: number, durationMs: number, rng: Rng) {
  const points = [];
  for (let t = 1000; t < durationMs; t += 1000) {
    const warmup = Math.min(1, t / 4000);
    points.push({ t, wpm: Math.round(wpm * (0.6 + 0.4 * warmup) * between(rng, 0.92, 1.08)) });
  }
  points.push({ t: durationMs, wpm });
  return points;
}

function missedFor(rng: Rng): Record<string, number> {
  const keys = "eéarstnoilu ,";
  const missed: Record<string, number> = {};
  for (let i = 0; i < 1 + Math.floor(rng() * 5); i++) {
    const key = keys[Math.floor(rng() * keys.length)];
    missed[key] = (missed[key] ?? 0) + 1;
  }
  return missed;
}

export async function seedDemo(prisma: PrismaClient) {
  if (await prisma.user.findUnique({ where: { username: DEMO_USERS[0].username } })) {
    console.log("Données de démonstration déjà présentes.");
    return;
  }
  const rng = createRng(42);
  const passwordHash = await hash(DEMO_PASSWORD, 10); // SEC-03 : bcrypt
  const users: { id: string }[] = [];
  for (const u of DEMO_USERS)
    users.push(
      await prisma.user.create({
        data: { username: u.username, name: u.name, passwordHash },
      }),
    );

  const text = await prisma.text.findFirst({ where: { language: "FR", difficulty: "BEGINNER" } });
  const content = text?.content ?? "Rien ne sert de courir ; il faut partir à point.";
  const room = await prisma.room.create({
    data: {
      code: DEMO_ROOM,
      organizerId: users[0].id,
      status: "CLOSED",
      closedAt: new Date(),
    },
  });

  const best = new Map<string, number>();
  for (let n = 0; n < RACES; n++) {
    const endedAt = new Date(Date.now() - (RACES - n) * 2 * DAY + Math.floor((rng() * DAY) / 2));
    const progress = n / (RACES - 1);
    const racers: DemoRacer[] = DEMO_USERS.map((u, i) => ({
      userId: users[i].id,
      name: u.name,
      botLevel: null,
      wpm: Math.round((u.start + u.gain * progress) * between(rng, 0.9, 1.1)),
      abandoned: rng() < 0.08,
    }));
    racers.push({
      userId: null,
      name: "Bot 1",
      botLevel: "INTERMEDIATE",
      wpm: Math.round(between(rng, 38, 55)),
      abandoned: false,
    });
    // COURSE-10 : arrivés par vitesse (même texte), abandons à la fin.
    racers.sort((a, b) => Number(a.abandoned) - Number(b.abandoned) || b.wpm - a.wpm);

    const words = content.length / 5;
    await prisma.race.create({
      data: {
        roomId: room.id,
        textId: text?.id ?? null,
        content,
        state: "FINISHED",
        startAt: new Date(endedAt.getTime() - 60_000),
        endedAt,
        participants: {
          create: racers.map((r, i) => {
            const durationMs = Math.round((words / r.wpm) * 60_000);
            const progressDone = r.abandoned ? between(rng, 0.3, 0.7) : 1;
            const wpm = r.abandoned ? Math.round(r.wpm * 0.8) : r.wpm;
            const finished = !r.abandoned;
            const isRecord = finished && r.userId !== null && wpm > (best.get(r.userId) ?? -1);
            if (isRecord && r.userId) best.set(r.userId, wpm);
            const missed = missedFor(rng);
            const errors = Object.values(missed).reduce((a, b) => a + b, 0);
            const keystrokes = Math.round(content.length * progressDone) + errors;
            return {
              userId: r.userId,
              name: r.name,
              botLevel: r.botLevel,
              role: r.botLevel ? ("BOT" as const) : ("PLAYER" as const),
              status: finished ? ("FINISHED" as const) : ("ABANDONED" as const),
              position: i + 1,
              errors,
              result: {
                create: {
                  rank: i + 1,
                  wpm,
                  rawWpm: Math.round(wpm * (keystrokes / Math.max(1, keystrokes - errors))),
                  accuracy: Math.round(((keystrokes - errors) / keystrokes) * 1000) / 10,
                  errors,
                  progress: progressDone,
                  durationMs: Math.round(durationMs * progressDone),
                  status: finished ? ("FINISHED" as const) : ("ABANDONED" as const),
                  bonuses: i === racers.length - 1 && n % 3 === 0 ? ["SHORTEN"] : [],
                  samples: samplesFor(wpm, Math.round(durationMs * progressDone), rng),
                  missed,
                  isRecord,
                },
              },
            };
          }),
        },
      },
    });
  }
  console.log(`${DEMO_USERS.length} comptes et ${RACES} courses de démonstration ajoutés.`);
}

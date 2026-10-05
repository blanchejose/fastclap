// Serveur de production et de développement : Next.js + Socket.IO sur le même
// port (voir l'ADR-001 de l'architecture). Next.js sert les pages ; Socket.IO
// fait tourner les courses en temps réel avec le moteur de src/lib/race/engine.ts.
import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { Server, type Socket } from "socket.io";
import { prisma } from "./src/lib/prisma";
import * as engine from "./src/lib/race/engine";
import { verifySocketToken, type SocketIdentity } from "./src/lib/socket-token";

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";
const secret = process.env.AUTH_SECRET ?? "";

const app = next({ dev });
const handle = app.getRequestHandler();

// Courses actives, en mémoire, par code de salle.
const races = new Map<string, engine.Race>();
const roomDifficulty = new Map<string, "BEGINNER" | "INTERMEDIATE" | "PRO">();

type Data = { user: SocketIdentity; code?: string };

async function pickText(code: string): Promise<string> {
  const difficulty = roomDifficulty.get(code) ?? "BEGINNER";
  const texts = await prisma.text.findMany({
    where: { difficulty, language: "FR" },
    select: { content: true },
  });
  const pool = texts.length > 0 ? texts : await prisma.text.findMany({ select: { content: true } });
  return pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)].content
    : "Le vif renard brun saute par-dessus le chien paresseux.";
}

async function start(code: string, race: engine.Race) {
  engine.startCountdown(race, await pickText(code), Date.now());
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  // destroyUpgrade: false laisse passer le rechargement à chaud de Next.js en développement.
  const io = new Server(httpServer, { destroyUpgrade: false });

  // Authentification : le jeton signé fourni par la page de salle.
  io.use((socket, nextFn) => {
    const user = verifySocketToken(socket.handshake.auth?.token, secret);
    if (!user) return nextFn(new Error("unauthorized"));
    (socket.data as Data).user = user;
    nextFn();
  });

  io.on("connection", (socket: Socket) => {
    const data = socket.data as Data;
    const { uid, name } = data.user;
    const raceOf = () => (data.code ? races.get(data.code) : undefined);

    socket.on(
      "room:join",
      async ({ code }: { code: string }, ack?: (r: engine.JoinResult) => void) => {
        let race = races.get(code);
        if (!race) {
          const room = await prisma.room.findUnique({
            where: { code },
            select: {
              status: true,
              organizerId: true,
              maxPlayers: true,
              lobbyWaitSec: true,
              countdownSec: true,
              difficulty: true,
            },
          });
          if (!room || room.status === "CLOSED") return ack?.({ ok: false, reason: "closed" });
          race = engine.createRace(code, room.organizerId, {
            maxPlayers: room.maxPlayers,
            lobbyWaitMs: room.lobbyWaitSec * 1000,
            countdownMs: room.countdownSec * 1000,
          });
          races.set(code, race);
          roomDifficulty.set(code, room.difficulty);
        }
        const result = engine.joinRace(race, uid, name, Date.now());
        if (result.ok) {
          data.code = code;
          socket.join(code);
        }
        ack?.(result);
      },
    );

    // L'organisateur lance la course sans attendre la fin du délai.
    socket.on("race:start", async () => {
      const race = raceOf();
      if (race && race.organizerId === uid && engine.canStart(race)) await start(data.code!, race);
    });

    socket.on("race:key", ({ char }: { char: string }) => {
      const race = raceOf();
      if (race) engine.applyKey(race, uid, String(char), Date.now());
    });

    socket.on("race:abandon", () => {
      const race = raceOf();
      if (race) engine.abandon(race, uid);
    });

    socket.on("race:restart", () => {
      const race = raceOf();
      if (race && race.organizerId === uid) engine.restart(race, Date.now());
    });

    socket.on("room:kick", ({ playerId }: { playerId: string }) => {
      const race = raceOf();
      if (!race || !engine.kick(race, uid, playerId, Date.now())) return;
      for (const s of io.sockets.sockets.values()) {
        if ((s.data as Data).user?.uid === playerId && (s.data as Data).code === data.code) {
          s.emit("room:kicked");
          s.leave(data.code!);
        }
      }
    });

    socket.on("disconnect", () => {
      const race = raceOf();
      if (!race) return;
      // Un autre onglet du même joueur est peut-être encore ouvert.
      const stillHere = [...io.sockets.sockets.values()].some(
        (s) =>
          s.id !== socket.id &&
          (s.data as Data).user?.uid === uid &&
          (s.data as Data).code === data.code,
      );
      if (!stillHere) engine.leaveRace(race, uid, Date.now());
    });
  });

  // 10 fois par seconde : faire avancer chaque course et diffuser son état.
  setInterval(() => {
    const now = Date.now();
    for (const [code, race] of races) {
      const listeners = io.sockets.adapter.rooms.get(code)?.size ?? 0;
      if (listeners === 0 && race.state !== "RUNNING") {
        races.delete(code);
        continue;
      }
      if (engine.tick(race, now) === "needs_text") void start(code, race);
      io.to(code).emit("race:state", engine.snapshot(race, now));
    }
  }, 100);

  httpServer.listen(port, () => {
    console.log(
      `> FastClap prêt sur http://localhost:${port} (${dev ? "développement" : "production"})`,
    );
  });
});

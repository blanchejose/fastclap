// Serveur de production et de développement : Next.js + Socket.IO sur le même
// port (voir l'ADR temps réel de l'architecture). Next.js sert les pages ;
// Socket.IO tient à jour, en direct, la liste des joueurs de chaque salle.
import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { Server, type Socket } from "socket.io";
import { prisma } from "./src/lib/prisma";
import * as lobbies from "./src/lib/lobby";
import { verifySocketToken, type SocketIdentity } from "./src/lib/socket-token";

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";
const secret = process.env.AUTH_SECRET ?? "";

const app = next({ dev });
const handle = app.getRequestHandler();

// Salles ouvertes, en mémoire, par code.
const rooms = new Map<string, lobbies.Lobby>();

type Data = { user: SocketIdentity; code?: string };

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  // destroyUpgrade: false laisse passer le rechargement à chaud de Next.js en développement.
  const io = new Server(httpServer, { destroyUpgrade: false });

  // Envoie l'état de la salle à tous ceux qui y sont, à chaque changement.
  const broadcast = (code: string) => {
    const lobby = rooms.get(code);
    if (lobby) io.to(code).emit("room:state", lobbies.snapshot(lobby));
  };

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

    socket.on(
      "room:join",
      async ({ code }: { code: string }, ack?: (r: lobbies.JoinResult) => void) => {
        let lobby = rooms.get(code);
        if (!lobby) {
          const room = await prisma.room.findUnique({
            where: { code },
            select: { status: true, organizerId: true, maxPlayers: true },
          });
          if (!room || room.status === "CLOSED") return ack?.({ ok: false, reason: "closed" });
          lobby = lobbies.createLobby(code, room.organizerId, room.maxPlayers);
          rooms.set(code, lobby);
        }
        const result = lobbies.joinLobby(lobby, uid, name);
        if (result.ok) {
          data.code = code;
          socket.join(code);
          broadcast(code);
        }
        ack?.(result);
      },
    );

    socket.on("room:kick", ({ playerId }: { playerId: string }) => {
      const code = data.code;
      const lobby = code ? rooms.get(code) : undefined;
      if (!code || !lobby || !lobbies.kick(lobby, uid, playerId)) return;
      for (const s of io.sockets.sockets.values()) {
        if ((s.data as Data).user?.uid === playerId && (s.data as Data).code === code) {
          s.emit("room:kicked");
          s.leave(code);
        }
      }
      broadcast(code);
    });

    socket.on("disconnect", () => {
      const code = data.code;
      const lobby = code ? rooms.get(code) : undefined;
      if (!code || !lobby) return;
      // Un autre onglet du même joueur est peut-être encore ouvert.
      const stillHere = [...io.sockets.sockets.values()].some(
        (s) =>
          s.id !== socket.id &&
          (s.data as Data).user?.uid === uid &&
          (s.data as Data).code === code,
      );
      if (!stillHere) lobbies.leaveLobby(lobby, uid);
      if ((io.sockets.adapter.rooms.get(code)?.size ?? 0) === 0) rooms.delete(code);
      else broadcast(code);
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> FastClap prêt sur http://localhost:${port} (${dev ? "développement" : "production"})`,
    );
  });
});

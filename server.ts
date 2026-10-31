// Serveur de production et de développement : Next.js + Socket.IO sur le même
// port (voir l'ADR temps réel de l'architecture). Next.js sert les pages ;
// Socket.IO fait vivre les salles et les courses avec le moteur de
// src/lib/race/engine.ts, qui est la source de vérité (COURSE-06).
import "dotenv/config";
import { randomInt } from "node:crypto";
import { createServer } from "node:http";
import next from "next";
import { Server, type Socket } from "socket.io";
import { clientIp, IP_HEADER } from "./src/lib/client-ip";
import { createInvite, hasInviteAccess, listInvites, revokeInvites } from "./src/lib/invites";
import { claimPresence, releasePresence, releaseRoom, resetPresences } from "./src/lib/presence";
import { prisma } from "./src/lib/prisma";
import { codeAttempts } from "./src/lib/rate-limit";
import * as engine from "./src/lib/race/engine";
import { parseMessage, type ClientEvent, type ClientMessage } from "./src/lib/race/messages";
import {
  CONFIG_COLUMNS,
  configFromRow,
  configToRow,
  forgetRoom,
  pickText,
} from "./src/lib/race/room-store";
import { verifySocketToken, type SocketIdentity } from "./src/lib/socket-token";

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";
const secret = process.env.AUTH_SECRET ?? "";

const TICK_MS = 100; // 10 diffusions par seconde pendant la course (COURSE-05)
const MAX_KEY_MESSAGES_PER_SECOND = 15; // PERF-02 : le navigateur en envoie au plus 10

const app = next({ dev });
const handle = app.getRequestHandler();

// Salles ouvertes, en mémoire, par code.
const rooms = new Map<string, engine.Room>();

type Data = {
  user: SocketIdentity;
  ip: string;
  code?: string;
  keyWindow: { second: number; count: number };
};

async function loadRoom(code: string): Promise<engine.Room | null> {
  const existing = rooms.get(code);
  if (existing) return existing;
  const row = await prisma.room.findUnique({
    where: { code },
    select: { status: true, organizerId: true, ...CONFIG_COLUMNS },
  });
  if (!row || row.status === "CLOSED") return null;
  // Un autre message a pu créer la salle pendant la lecture de la base.
  const raced = rooms.get(code);
  if (raced) return raced;
  const room = engine.createRoom(code, row.organizerId, configFromRow(row));
  rooms.set(code, room);
  return room;
}

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    // L'adresse IP calculée ici remplace toute valeur envoyée par le visiteur.
    req.headers[IP_HEADER] = clientIp(req.headers, req.socket.remoteAddress);
    return handle(req, res);
  });
  // destroyUpgrade: false laisse passer le rechargement à chaud de Next.js en développement.
  const io = new Server(httpServer, { destroyUpgrade: false });

  const broadcast = (room: engine.Room) =>
    io.to(room.code).emit("room:state", engine.snapshot(room, Date.now()));

  // L'état de frappe gardé par le serveur : pour reprendre après un
  // rechargement (COURSE-08) ou corriger le navigateur après un lot refusé.
  const sendResync = (socket: Socket, room: engine.Room, racer: engine.Racer) =>
    socket.emit("race:resync", {
      raceNo: room.raceNo,
      typed: racer.typing.typed,
      keystrokes: racer.typing.keystrokes,
      errors: racer.typing.errors,
    });

  // Le texte part une seule fois par course, pas à chaque diffusion.
  const sendRace = (socket: Socket, room: engine.Room, uid: string) => {
    if (room.text === null) return;
    const racer = room.racers.get(uid);
    socket.emit("race:text", { raceNo: room.raceNo, text: racer?.text ?? room.text });
    if (racer) sendResync(socket, room, racer);
  };

  const socketsOf = (uid: string, code: string) =>
    [...io.sockets.sockets.values()].filter((s) => {
      const d = s.data as Data;
      return d.user?.uid === uid && d.code === code;
    });

  const closeRoom = async (room: engine.Room) => {
    broadcast(room);
    io.in(room.code).socketsLeave(room.code);
    rooms.delete(room.code);
    forgetRoom(room.code);
    await releaseRoom(room.code);
    await prisma.room.update({
      where: { code: room.code },
      data: { status: "CLOSED", closedAt: new Date() },
    });
  };

  // Authentification : le jeton signé fourni par la page de salle.
  io.use((socket, nextFn) => {
    const user = verifySocketToken(socket.handshake.auth?.token, secret);
    if (!user) return nextFn(new Error("unauthorized"));
    const ip = clientIp(socket.handshake.headers, socket.handshake.address);
    socket.data = { user, ip, keyWindow: { second: 0, count: 0 } } satisfies Data;
    nextFn();
  });

  io.on("connection", (socket: Socket) => {
    const data = socket.data as Data;
    const { uid, name } = data.user;
    const roomOf = () => (data.code ? rooms.get(data.code) : undefined);

    // Chaque message est validé par son schéma Zod avant d'arriver au moteur (TECH-07).
    function on<E extends ClientEvent>(
      event: E,
      handler: (message: ClientMessage<E>, ack: (reply: unknown) => void) => unknown,
    ) {
      socket.on(event as string, (payload: unknown, maybeAck?: unknown) => {
        const ack = typeof maybeAck === "function" ? (maybeAck as (r: unknown) => void) : () => {};
        const message = parseMessage(event, payload);
        if (!message) return ack({ ok: false, reason: "invalid" });
        Promise.resolve(handler(message, ack)).catch((error: unknown) => {
          console.error(`Erreur sur ${event} :`, error);
        });
      });
    }

    // Le moteur vérifie le droit d'agir (SEC-01), puis on diffuse le nouvel état.
    function act(change: (room: engine.Room, now: number) => boolean) {
      const room = roomOf();
      if (!room || !change(room, Date.now())) return;
      if (room.phase === "CLOSED") void closeRoom(room);
      else broadcast(room);
    }

    // Retire tous les onglets d'une personne du canal de la salle.
    function detach(id: string, code: string) {
      for (const s of socketsOf(id, code)) {
        void s.leave(code);
        (s.data as Data).code = undefined;
      }
    }

    // SALLE-06 : quitter la salle où l'on est, quand on choisit d'en rejoindre une autre.
    async function leaveOtherRooms(code: string) {
      for (const other of rooms.values()) {
        if (other.code === code || !other.members.has(uid)) continue;
        engine.removeMember(other, uid, Date.now());
        for (const s of socketsOf(uid, other.code)) s.emit("room:moved");
        detach(uid, other.code);
        if (other.phase === "CLOSED") void closeRoom(other);
        else broadcast(other);
        await releasePresence([uid], other.code);
      }
    }

    on("room:join", async ({ code, leaveOther }, ack) => {
      // SALLE-10 : une personne déjà dans la salle revient toujours ; les
      // autres sont bloquées après 10 codes ratés par minute.
      if (codeAttempts.isBlocked(data.ip) && !rooms.get(code)?.members.has(uid))
        return ack({ ok: false, reason: "too_many" });
      const room = await loadRoom(code);
      if (!room) {
        codeAttempts.record(data.ip);
        return ack({ ok: false, reason: "closed" });
      }
      // SALLE-03, SALLE-04 : le code seul ne suffit pas pour une salle privée.
      // L'hôte et les personnes déjà dans la salle (reconnexion) passent.
      const invited =
        room.config.visibility !== "PRIVATE" ||
        room.hostId === uid ||
        room.members.has(uid) ||
        (await hasInviteAccess(code, uid, data.ip));
      if (!invited) return ack({ ok: false, reason: "private" });

      // SALLE-06 : une seule salle à la fois, garanti par la base. Un deuxième
      // onglet ou une reconnexion (déjà membre) ne crée rien de nouveau.
      const newcomer = !room.members.has(uid);
      if (newcomer) {
        if (leaveOther) await leaveOtherRooms(code);
        const presence = await claimPresence(
          uid,
          code,
          (other) => rooms.get(other)?.members.has(uid) ?? false,
        );
        if (!presence.ok)
          return ack({ ok: false, reason: "elsewhere", otherCode: presence.otherCode });
      }
      const result = engine.join(room, { id: uid, name }, "PLAYER", Date.now());
      if (!result.ok && newcomer) await releasePresence([uid], code);
      if (result.ok) {
        data.code = code;
        await socket.join(code);
        sendRace(socket, room, uid);
        broadcast(room);
        io.to(code).emit("invite:update"); // l'hôte rafraîchit le statut des liens
      }
      ack(result);
    });

    // CONF-12 : l'hôte change la configuration ; tout le monde la voit aussitôt,
    // et elle est gardée en base (la liste des salles l'affiche aussi).
    on("room:config", async (patch, ack) => {
      const room = roomOf();
      if (!room) return ack({ ok: false, reason: "forbidden" });
      const result = engine.updateConfig(room, uid, patch);
      if (result !== "ok") return ack({ ok: false, reason: result });
      broadcast(room);
      ack({ ok: true });
      await prisma.room.update({ where: { code: room.code }, data: configToRow(room.config) });
    });

    // SALLE-04 : l'hôte génère des liens et voit leur statut (SEC-01).
    on("invite:list", async (_, ack) => {
      const room = roomOf();
      if (!room || room.hostId !== uid) return ack({ ok: false, reason: "forbidden" });
      ack({ ok: true, invites: await listInvites(room.code) });
    });

    on("invite:create", async (_, ack) => {
      const room = roomOf();
      if (!room || room.hostId !== uid || room.phase === "CLOSED")
        return ack({ ok: false, reason: "forbidden" });
      await createInvite(room.code);
      ack({ ok: true, invites: await listInvites(room.code) });
    });

    on("room:role", ({ role }) => act((room) => engine.setRole(room, uid, role)));
    on("bot:add", ({ level }) => act((room, now) => engine.addBot(room, uid, level, now)));
    on("bot:remove", ({ id }) => act((room) => engine.removeBot(room, uid, id)));
    on("room:lobby", () => act((room) => engine.backToLobby(room, uid)));
    on("room:close", () => act((room) => engine.close(room, uid)));
    on("race:abandon", () => act((room, now) => engine.abandon(room, uid, now)));

    on("room:kick", ({ id }) =>
      act((room, now) => {
        if (!engine.kick(room, uid, id, now)) return false;
        // SALLE-04 : son lien ne marche plus ; l'hôte voit le nouveau statut.
        void revokeInvites(room.code, id).then(() => io.to(room.code).emit("invite:update"));
        void releasePresence([id], room.code);
        for (const s of socketsOf(id, room.code)) s.emit("room:kicked");
        detach(id, room.code);
        return true;
      }),
    );

    on("room:leave", () =>
      act((room, now) => {
        engine.removeMember(room, uid, now);
        detach(uid, room.code);
        void releasePresence([uid], room.code);
        return true;
      }),
    );

    on("race:start", async () => {
      const room = roomOf();
      if (!room || room.hostId !== uid || engine.startBlocker(room) !== null) return;
      const text = await pickText(room.code, room.config);
      if (!engine.startRace(room, uid, text, randomInt(2 ** 31), Date.now())) return;
      io.to(room.code).emit("race:text", { raceNo: room.raceNo, text });
      broadcast(room);
    });

    on("race:keys", ({ keys }) => {
      const room = roomOf();
      const racer = room?.racers.get(uid);
      if (!room || !racer) return;
      // PERF-02 : un navigateur honnête n'envoie jamais plus de 10 lots par seconde.
      const second = Math.floor(Date.now() / 1000);
      if (data.keyWindow.second !== second) data.keyWindow = { second, count: 0 };
      data.keyWindow.count += 1;
      const flooding = data.keyWindow.count > MAX_KEY_MESSAGES_PER_SECOND;
      const result = flooding ? "rejected" : engine.applyKeys(room, uid, keys, Date.now());
      console.log("keys", uid, keys.join(""), result, racer.typing.typed.length);
      if (result === "rejected") sendResync(socket, room, racer);
    });

    socket.on("disconnect", () => {
      const room = roomOf();
      if (!room) return;
      // Un autre onglet du même joueur est peut-être encore ouvert.
      if (socketsOf(uid, room.code).some((s) => s.id !== socket.id)) return;
      engine.disconnect(room, uid, Date.now());
      broadcast(room);
    });
  });

  // 10 fois par seconde : faire avancer chaque salle (décompte, bots, temps
  // limite, déconnexions) et diffuser son état s'il a changé.
  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      const { changed, removed } = engine.tick(room, now);
      if (removed.length > 0) void releasePresence(removed, room.code);
      if (room.phase === "CLOSED") void closeRoom(room);
      else if (changed) broadcast(room);
    }
  }, TICK_MS);

  // Les salles vivent en mémoire : au démarrage, toute présence est un reste.
  await resetPresences();

  httpServer.listen(port, () => {
    console.log(
      `> FastClap prêt sur http://localhost:${port} (${dev ? "développement" : "production"})`,
    );
  });
});

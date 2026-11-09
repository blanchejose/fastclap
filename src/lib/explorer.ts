// JOIN-02 : explorateur des salles publiques ; JOIN-03 : partie rapide.
// Code pur sur les salles en mémoire : testable sans serveur.
import type { Complexity, Language } from "./race/config";
import { players, type Phase, type Room } from "./race/engine";

export type RoomSummary = {
  code: string;
  hostName: string;
  phase: Exclude<Phase, "CLOSED">;
  players: number; // participants, bots compris ; spectateurs exclus
  maxPlayers: number;
  language: Language;
  complexity: Complexity;
  createdAt: number;
};

export type Filters = { language?: Language; complexity?: Complexity };

// Une salle est montrée si elle est publique et qu'une personne au moins y est
// connectée : une salle vide n'a personne pour lancer la course.
export function summarize(room: Room): RoomSummary | null {
  if (room.phase === "CLOSED" || room.config.visibility !== "PUBLIC") return null;
  const humans = [...room.members.values()].filter((m) => m.kind === "HUMAN" && m.connected);
  if (humans.length === 0) return null;
  return {
    code: room.code,
    hostName: room.members.get(room.hostId)?.name ?? humans[0].name,
    phase: room.phase,
    players: players(room).length,
    maxPlayers: room.config.maxPlayers,
    language: room.config.text.language,
    complexity: room.config.text.complexity,
    createdAt: room.createdAt,
  };
}

export function listRooms(rooms: Iterable<Room>, filters: Filters = {}): RoomSummary[] {
  return [...rooms]
    .map(summarize)
    .filter((r): r is RoomSummary => r !== null)
    .filter((r) => !filters.language || r.language === filters.language)
    .filter((r) => !filters.complexity || r.complexity === filters.complexity)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// JOIN-03 : parmi les salles joignables (en attente ou aux résultats, pas
// pleines), celle à qui il reste le moins de places ; à égalité, la plus ancienne.
export function pickQuickRoom(rooms: RoomSummary[]): RoomSummary | null {
  const open = rooms.filter(
    (r) => (r.phase === "WAITING" || r.phase === "RESULTS") && r.players < r.maxPlayers,
  );
  open.sort(
    (a, b) => a.maxPlayers - a.players - (b.maxPlayers - b.players) || a.createdAt - b.createdAt,
  );
  return open[0] ?? null;
}

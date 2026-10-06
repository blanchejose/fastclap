// Salle d'attente en temps réel : qui est dans la salle, en direct.
// Code pur, sans réseau ni base de données : le serveur Socket.IO l'appelle,
// et les tests Vitest le vérifient. La course elle-même (compte à rebours,
// frappe, podium) se développe sur la branche feature/course.

// LOBBY : en attente d'un 2e joueur. WAITING : assez de joueurs pour partir.
export type LobbyState = "LOBBY" | "WAITING";

export type Player = { id: string; username: string };

export type Lobby = {
  code: string;
  organizerId: string;
  state: LobbyState;
  minPlayers: number; // ROOM-2
  maxPlayers: number; // H-1
  players: Map<string, Player>;
  kicked: Set<string>; // ROOM-5 : un joueur retiré ne peut pas revenir
};

export type JoinResult =
  { ok: true; rejoined: boolean } | { ok: false; reason: "full" | "closed" | "kicked" };

export type LobbyView = {
  code: string;
  organizerId: string;
  state: LobbyState;
  minPlayers: number;
  players: Player[];
};

export function createLobby(code: string, organizerId: string, maxPlayers = 30): Lobby {
  return {
    code,
    organizerId,
    state: "LOBBY",
    minPlayers: 2,
    maxPlayers,
    players: new Map(),
    kicked: new Set(),
  };
}

// LOBBY ⇄ WAITING selon le nombre de joueurs (ROOM-2).
function update(lobby: Lobby) {
  lobby.state = lobby.players.size >= lobby.minPlayers ? "WAITING" : "LOBBY";
}

export function joinLobby(lobby: Lobby, id: string, username: string): JoinResult {
  if (lobby.kicked.has(id)) return { ok: false, reason: "kicked" };
  if (lobby.players.has(id)) return { ok: true, rejoined: true };
  if (lobby.players.size >= lobby.maxPlayers) return { ok: false, reason: "full" };
  lobby.players.set(id, { id, username });
  update(lobby);
  return { ok: true, rejoined: false };
}

export function leaveLobby(lobby: Lobby, id: string) {
  lobby.players.delete(id);
  update(lobby);
}

// ROOM-5 : seul l'organisateur retire un participant, jamais lui-même.
export function kick(lobby: Lobby, organizerId: string, id: string): boolean {
  if (organizerId !== lobby.organizerId || id === lobby.organizerId) return false;
  if (!lobby.players.has(id)) return false;
  lobby.players.delete(id);
  lobby.kicked.add(id);
  update(lobby);
  return true;
}

// Ce que le serveur envoie aux navigateurs à chaque changement.
export function snapshot(lobby: Lobby): LobbyView {
  return {
    code: lobby.code,
    organizerId: lobby.organizerId,
    state: lobby.state,
    minPlayers: lobby.minPlayers,
    players: [...lobby.players.values()],
  };
}

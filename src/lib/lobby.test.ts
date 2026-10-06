import { describe, expect, it } from "vitest";
import { createLobby, joinLobby, kick, leaveLobby, snapshot } from "./lobby";

describe("salle d'attente (ROOM-2)", () => {
  it("reste en LOBBY avec un seul joueur", () => {
    const lobby = createLobby("K7X2QP", "orga");
    joinLobby(lobby, "orga", "Mme T");
    expect(lobby.state).toBe("LOBBY");
  });

  it("passe en WAITING dès 2 joueurs, puis revient en LOBBY si l'un part", () => {
    const lobby = createLobby("K7X2QP", "orga");
    joinLobby(lobby, "orga", "Mme T");
    joinLobby(lobby, "lea", "Léa");
    expect(lobby.state).toBe("WAITING");
    leaveLobby(lobby, "lea");
    expect(lobby.state).toBe("LOBBY");
  });

  it("reconnaît un joueur qui revient (deuxième onglet, reconnexion)", () => {
    const lobby = createLobby("K7X2QP", "orga");
    joinLobby(lobby, "lea", "Léa");
    expect(joinLobby(lobby, "lea", "Léa")).toEqual({ ok: true, rejoined: true });
    expect(lobby.players.size).toBe(1);
  });

  it("refuse un joueur quand la salle est pleine (H-1)", () => {
    const lobby = createLobby("K7X2QP", "orga", 2);
    joinLobby(lobby, "a", "A");
    joinLobby(lobby, "b", "B");
    expect(joinLobby(lobby, "c", "C")).toEqual({ ok: false, reason: "full" });
  });
});

describe("retrait d'un participant (ROOM-5)", () => {
  it("seul l'organisateur peut retirer, et le joueur retiré ne revient pas", () => {
    const lobby = createLobby("K7X2QP", "orga");
    joinLobby(lobby, "orga", "Mme T");
    joinLobby(lobby, "lea", "Léa");
    expect(kick(lobby, "lea", "orga")).toBe(false);
    expect(kick(lobby, "orga", "lea")).toBe(true);
    expect(joinLobby(lobby, "lea", "Léa")).toEqual({ ok: false, reason: "kicked" });
    expect(lobby.state).toBe("LOBBY");
  });

  it("l'organisateur ne peut pas se retirer lui-même", () => {
    const lobby = createLobby("K7X2QP", "orga");
    joinLobby(lobby, "orga", "Mme T");
    expect(kick(lobby, "orga", "orga")).toBe(false);
  });
});

describe("état envoyé aux navigateurs", () => {
  it("liste les joueurs dans l'ordre d'arrivée", () => {
    const lobby = createLobby("K7X2QP", "orga");
    joinLobby(lobby, "orga", "Mme T");
    joinLobby(lobby, "lea", "Léa");
    expect(snapshot(lobby)).toEqual({
      code: "K7X2QP",
      organizerId: "orga",
      state: "WAITING",
      minPlayers: 2,
      players: [
        { id: "orga", username: "Mme T" },
        { id: "lea", username: "Léa" },
      ],
    });
  });
});

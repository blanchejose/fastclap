import { describe, expect, it } from "vitest";
import type { RoomView } from "./engine";
import { initialRoomState, roomReducer, type RoomState } from "./room-state";

// Seuls les champs lus par le réducteur comptent ici.
const view = (raceNo: number, serverNow: number) => ({ raceNo, serverNow }) as RoomView;

describe("roomReducer", () => {
  it("garde la vue et calcule le décalage d'horloge", () => {
    const next = roomReducer(initialRoomState, {
      type: "state",
      view: view(1, 5_000),
      localNow: 4_200,
    });
    expect(next.view?.raceNo).toBe(1);
    expect(next.clockOffset).toBe(800);
  });

  it("n'applique le texte modifié qu'à la course en cours (BONUS-04)", () => {
    const racing: RoomState = { ...initialRoomState, race: { raceNo: 3, text: "abc" } };
    const same = roomReducer(racing, { type: "mytext", race: { raceNo: 3, text: "ab" } });
    expect(same.race?.text).toBe("ab");
    const old = roomReducer(racing, { type: "mytext", race: { raceNo: 2, text: "zz" } });
    expect(old).toBe(racing);
    expect(roomReducer(initialRoomState, { type: "mytext", race: { raceNo: 3, text: "x" } })).toBe(
      initialRoomState,
    );
  });

  it("note la dernière touche avec le numéro de la course", () => {
    const withView = roomReducer(initialRoomState, {
      type: "state",
      view: view(4, 0),
      localNow: 0,
    });
    expect(roomReducer(withView, { type: "typed", at: 1_234 }).lastKeyAt).toEqual({
      raceNo: 4,
      at: 1_234,
    });
    expect(roomReducer(initialRoomState, { type: "typed", at: 1 })).toBe(initialRoomState);
  });

  it("propose de quitter l'autre salle, puis l'oublie une fois entré (SALLE-06)", () => {
    const elsewhere = roomReducer(initialRoomState, { type: "elsewhere", code: "K7X2QP" });
    expect(elsewhere.elsewhere).toBe("K7X2QP");
    expect(roomReducer(elsewhere, { type: "joined" }).elsewhere).toBeNull();
  });

  it("efface l'erreur à la reconnexion", () => {
    const broken = roomReducer(initialRoomState, { type: "error", message: "coupé" });
    expect(broken.error).toBe("coupé");
    expect(roomReducer(broken, { type: "connected" }).error).toBeNull();
  });

  it("compte les mises à jour des liens d'invitation", () => {
    const once = roomReducer(initialRoomState, { type: "invites" });
    expect(roomReducer(once, { type: "invites" }).inviteVersion).toBe(2);
  });

  it("retient l'expulsion et le déplacement", () => {
    expect(roomReducer(initialRoomState, { type: "kicked" }).kicked).toBe(true);
    expect(roomReducer(initialRoomState, { type: "moved" }).moved).toBe(true);
  });
});

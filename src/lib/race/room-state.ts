import type { RoomView } from "./engine";

// État de la salle vu par le navigateur, tel que le serveur temps réel le
// diffuse. Un seul réducteur pur remplace la dizaine de useState de RoomLive :
// chaque message du serveur devient une action, et les transitions se testent
// sans navigateur ni socket.

export type Saved = { raceNo: number; raceId: string; records: string[] };
export type RaceText = { raceNo: number; text: string };

export type RoomState = {
  view: RoomView | null;
  // Décalage entre l'horloge du serveur et l'horloge locale (ms).
  clockOffset: number;
  race: RaceText | null; // mon texte pour la course en cours
  saved: Saved | null; // RES-04, RES-05 : course enregistrée et records battus
  inviteVersion: number; // le panneau des liens redemande la liste quand elle change
  // Dernière touche tapée (heure du serveur), pour prévenir avant l'abandon
  // automatique pour inactivité ; null = rien tapé depuis le départ.
  lastKeyAt: { raceNo: number; at: number } | null;
  error: string | null;
  kicked: boolean;
  moved: boolean;
  elsewhere: string | null; // SALLE-06 : code de l'autre salle où je suis déjà
};

export type RoomAction =
  | { type: "connected" }
  | { type: "joined" }
  | { type: "elsewhere"; code: string }
  | { type: "error"; message: string }
  | { type: "state"; view: RoomView; localNow: number }
  | { type: "saved"; saved: Saved }
  | { type: "text"; race: RaceText }
  | { type: "mytext"; race: RaceText }
  | { type: "typed"; at: number }
  | { type: "kicked" }
  | { type: "moved" }
  | { type: "invites" };

export const initialRoomState: RoomState = {
  view: null,
  clockOffset: 0,
  race: null,
  saved: null,
  inviteVersion: 0,
  lastKeyAt: null,
  error: null,
  kicked: false,
  moved: false,
  elsewhere: null,
};

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case "connected":
      return { ...state, error: null };
    case "joined":
      return { ...state, elsewhere: null };
    case "elsewhere":
      return { ...state, elsewhere: action.code };
    case "error":
      return { ...state, error: action.message };
    case "state":
      return {
        ...state,
        view: action.view,
        clockOffset: action.view.serverNow - action.localNow,
      };
    case "saved":
      return { ...state, saved: action.saved };
    case "text":
      return { ...state, race: action.race };
    case "mytext":
      // BONUS-04 : texte raccourci ou allongé, seulement pour la course en cours.
      return state.race && state.race.raceNo === action.race.raceNo
        ? { ...state, race: action.race }
        : state;
    case "typed":
      return state.view
        ? { ...state, lastKeyAt: { raceNo: state.view.raceNo, at: action.at } }
        : state;
    case "kicked":
      return { ...state, kicked: true };
    case "moved":
      return { ...state, moved: true };
    case "invites":
      return { ...state, inviteVersion: state.inviteVersion + 1 };
  }
}

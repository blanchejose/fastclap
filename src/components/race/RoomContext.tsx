"use client";

import { createContext, use } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { RoomView } from "@/lib/race/engine";

// Ce que les morceaux de la salle partagent : la vue diffusée par le serveur,
// qui je suis, et l'envoi d'un message au serveur. Le contexte évite de faire
// descendre `send`, `meId` et les textes de composant en composant.
export type RoomContextValue = {
  view: RoomView;
  meId: string;
  isHost: boolean;
  send: (event: string, payload?: object) => void;
  t: Pick<Dictionary, "room" | "config" | "levels">;
};

export const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom(): RoomContextValue {
  const room = use(RoomContext);
  if (!room) throw new Error("useRoom doit être appelé dans <RoomContext>");
  return room;
}

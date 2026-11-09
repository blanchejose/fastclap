// Les salles ouvertes vivent en mémoire, dans le serveur temps réel. Next.js
// charge ses propres copies des modules : le registre est rangé dans
// globalThis pour que l'explorateur (JOIN-02) et la partie rapide (JOIN-03)
// voient les mêmes salles que Socket.IO. Un seul serveur, un seul registre.
import type { Room } from "./engine";

const shared = globalThis as typeof globalThis & { fastclapRooms?: Map<string, Room> };
export const liveRooms: Map<string, Room> = (shared.fastclapRooms ??= new Map());

// Messages temps réel envoyés par les navigateurs, validés par Zod (TECH-07).
// Le serveur ignore tout message qui ne respecte pas son schéma.
import { z } from "zod";
import { ROOM_CODE_ALPHABET } from "../room-code";
import { BOT_LEVELS } from "./bots";
import { MAX_KEYS_PER_BATCH } from "./engine";

const roomCode = z.string().regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]{6}$`));

export const clientMessages = {
  "room:join": z.object({ code: roomCode }),
  "room:role": z.object({ role: z.enum(["PLAYER", "SPECTATOR"]) }),
  "room:kick": z.object({ id: z.string().min(1).max(64) }),
  "room:leave": z.object({}),
  "room:lobby": z.object({}),
  "room:close": z.object({}),
  "bot:add": z.object({ level: z.enum(BOT_LEVELS) }),
  "bot:remove": z.object({ id: z.string().min(1).max(64) }),
  "race:start": z.object({}),
  "race:abandon": z.object({}),
  // Lot de touches : un caractère chacune, ou « \b » pour effacer (PERF-02).
  "race:keys": z.object({
    keys: z.array(z.string().length(1)).min(1).max(MAX_KEYS_PER_BATCH),
  }),
} as const;

export type ClientEvent = keyof typeof clientMessages;
export type ClientMessage<E extends ClientEvent> = z.infer<(typeof clientMessages)[E]>;

export function parseMessage<E extends ClientEvent>(
  event: E,
  payload: unknown,
): ClientMessage<E> | null {
  const result = clientMessages[event].safeParse(payload ?? {});
  return result.success ? result.data : null;
}

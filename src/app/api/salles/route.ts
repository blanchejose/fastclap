import { z } from "zod";
import { listRooms } from "@/lib/explorer";
import { COMPLEXITIES, LANGUAGES } from "@/lib/race/config";
import { liveRooms } from "@/lib/race/registry";

// TECH-07 : filtres de l'explorateur validés par Zod ; un filtre inconnu est ignoré.
const query = z.object({
  langue: z.enum(LANGUAGES).optional().catch(undefined),
  complexite: z.enum(COMPLEXITIES).optional().catch(undefined),
  limite: z.coerce.number().int().min(1).max(50).catch(50),
});

// JOIN-02 : les salles publiques ouvertes, lues dans la mémoire du serveur.
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { langue, complexite, limite } = query.parse(params);
  const rooms = listRooms(liveRooms.values(), { language: langue, complexity: complexite });
  return Response.json(rooms.slice(0, limite), { headers: { "Cache-Control": "no-store" } });
}

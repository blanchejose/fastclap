import { connection } from "next/server";
import { getDictionary } from "@/i18n/server";
import { listRooms } from "@/lib/explorer";
import { liveRooms } from "@/lib/race/registry";
import { LiveRooms } from "./LiveRooms";

// JOIN-02 : premier rendu sur le serveur (salles en mémoire), puis mise à jour
// automatique dans le navigateur.
export async function RoomList({ limit, filters = false }: { limit: number; filters?: boolean }) {
  await connection(); // la liste change à chaque instant : rendu à chaque requête
  const t = await getDictionary();
  return (
    <LiveRooms
      initial={listRooms(liveRooms.values()).slice(0, limit)}
      limit={limit}
      showFilters={filters}
      t={{ ...t.explorer, levels: t.levels, languages: t.config.languages }}
    />
  );
}

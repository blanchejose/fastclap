import { auth } from "@/auth";
import { createRoomFor } from "@/lib/rooms";
import { prisma } from "@/lib/prisma";

// HOME-2 : « Rejoindre une course » mène à la prochaine course publique
// disponible, sans étape intermédiaire. S'il n'y en a pas, on en crée une.
export async function GET(request: Request) {
  const go = (path: string) => Response.redirect(new URL(path, request.url), 303);

  const room = await prisma.room.findFirst({
    where: { visibility: "PUBLIC", status: "OPEN" },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  if (room) return go(`/salle/${room.code}`);

  const session = await auth();
  if (!session) return go("/connexion?suite=/go");
  return go(`/salle/${await createRoomFor(session.user.id, "PUBLIC", "BEGINNER")}`);
}

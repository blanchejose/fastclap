import { auth } from "@/auth";
import { createRoomFor } from "@/lib/rooms";
import { prisma } from "@/lib/prisma";

// HOME-2 : « Rejoindre une course » mène à la prochaine course publique
// disponible, sans étape intermédiaire. S'il n'y en a pas, on en crée une.
export async function GET() {
  // Redirection relative : derrière le proxy de l'hébergeur, l'adresse vue par
  // le serveur est http://localhost, que le navigateur ne doit jamais recevoir.
  const go = (path: string) => new Response(null, { status: 303, headers: { Location: path } });

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

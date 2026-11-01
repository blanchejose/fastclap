import { z } from "zod";
import { prisma } from "@/lib/prisma";

const params = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/) });

// AUTH-04 : sert la photo de profil, déjà redimensionnée. L'adresse change à
// chaque nouvelle photo (?v=), d'où un cache long.
export async function GET(_request: Request, context: RouteContext<"/api/avatar/[id]">) {
  const input = params.safeParse(await context.params); // TECH-07
  if (!input.success) return new Response(null, { status: 404 });
  const user = await prisma.user.findUnique({
    where: { id: input.data.id },
    select: { avatar: true },
  });
  if (!user?.avatar) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(user.avatar), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { prisma } from "@/lib/prisma";

// Vérifie que l'application répond et que la base est joignable.
// Sert de « health check » à l'hébergeur après chaque déploiement.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "up" });
  } catch {
    return Response.json({ status: "error", database: "down" }, { status: 503 });
  }
}

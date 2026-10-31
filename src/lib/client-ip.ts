// Adresse IP de la personne, pour lier un lien d'invitation (SALLE-04) et
// limiter les essais de code (SALLE-10).
//
// Derrière un proxy (Railway), l'adresse vue par Node est celle du proxy ; la
// vraie arrive dans un en-tête. Un visiteur peut aussi envoyer cet en-tête
// lui-même : on ne le croit donc que si TRUST_PROXY_HEADER le nomme (sur
// Railway : x-real-ip, que le proxy remplace toujours).
export const IP_HEADER = "x-fastclap-ip"; // posé par server.ts pour Next.js

type Headers = Record<string, string | string[] | undefined>;

export function clientIp(
  headers: Headers,
  remoteAddress: string | undefined,
  trustedHeader = process.env.TRUST_PROXY_HEADER,
): string {
  if (trustedHeader) {
    const value = headers[trustedHeader.toLowerCase()];
    const first = (Array.isArray(value) ? value[0] : value)?.split(",")[0]?.trim();
    if (first) return first;
  }
  return (remoteAddress ?? "inconnue").replace(/^::ffff:/, "");
}

// SALLE-10 : limite d'essais par adresse IP sur une fenêtre glissante.
// Les essais sont gardés en mémoire : le site tourne sur un seul serveur.

export type RateLimiter = {
  isBlocked: (key: string, now?: number) => boolean;
  record: (key: string, now?: number) => void;
};

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();
  const recent = (key: string, now: number) =>
    (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  return {
    isBlocked(key, now = Date.now()) {
      const kept = recent(key, now);
      if (kept.length === 0) hits.delete(key);
      else hits.set(key, kept);
      return kept.length >= limit;
    },
    record(key, now = Date.now()) {
      hits.set(key, [...recent(key, now), now]);
    },
  };
}

// Essais de code ratés : 10 par minute et par adresse IP. Next.js et le
// serveur temps réel chargent ce module séparément : la limite est rangée
// dans globalThis pour qu'ils partagent le même compteur.
export const CODE_ATTEMPTS = { limit: 10, windowMs: 60_000 } as const;

const shared = globalThis as typeof globalThis & { fastclapCodeAttempts?: RateLimiter };
export const codeAttempts: RateLimiter = (shared.fastclapCodeAttempts ??= createRateLimiter(
  CODE_ATTEMPTS.limit,
  CODE_ATTEMPTS.windowMs,
));

// Générateur pseudo-aléatoire à graine (mulberry32) : la même graine donne
// toujours la même suite, ce qui rend les bots testables (BOT-05).

export type Rng = () => number; // nombre dans [0, 1[

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function between(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

// Graine stable tirée d'un texte (code de salle, identifiant de bot…).
export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Règles de frappe, communes au navigateur (affichage immédiat) et au serveur
// (source de vérité, COURSE-06). Le serveur rejoue les mêmes touches que le
// navigateur : les deux arrivent donc au même état sans s'envoyer le texte tapé.

// CONF-08 : correction obligatoire (STRICT) ou erreurs laissées derrière (FREE).
export type ErrorMode = "STRICT" | "FREE";

// Touche « effacer » dans les lots envoyés au serveur.
export const BACKSPACE = "\b";

export type Typing = {
  typed: string; // ce que le joueur a tapé ; en STRICT, toujours un début exact du texte
  keystrokes: number; // touches de caractère pressées (pas les effacements)
  errors: number; // fautes, jamais décomptées même si elles sont corrigées
  missed: Record<string, number>; // caractère attendu → nombre de fautes (RES-03)
};

export type KeyOutcome = "correct" | "wrong" | "erased" | "ignored";

export function newTyping(): Typing {
  return { typed: "", keystrokes: 0, errors: 0, missed: {} };
}

export function applyKey(typing: Typing, text: string, key: string, mode: ErrorMode): KeyOutcome {
  if (key === BACKSPACE) {
    // En STRICT, il n'y a jamais rien de faux à effacer.
    if (mode === "STRICT" || typing.typed.length === 0) return "ignored";
    typing.typed = typing.typed.slice(0, -1);
    return "erased";
  }
  if (key.length !== 1 || typing.typed.length >= text.length) return "ignored";

  typing.keystrokes += 1;
  const expected = text[typing.typed.length];
  if (key === expected) {
    typing.typed += key;
    return "correct";
  }
  typing.errors += 1;
  typing.missed[expected] = (typing.missed[expected] ?? 0) + 1;
  if (mode === "FREE") typing.typed += key;
  return "wrong";
}

// Caractères justes à leur place : la base du MPM net.
export function correctChars(typing: Typing, text: string): number {
  let count = 0;
  for (let i = 0; i < typing.typed.length; i++) if (typing.typed[i] === text[i]) count++;
  return count;
}

export function progress(typing: Typing, text: string): number {
  return text.length === 0 ? 0 : Math.min(1, typing.typed.length / text.length);
}

// Arrivé quand tout le texte est couvert. En FREE, les fautes laissées
// derrière ne bloquent pas l'arrivée : elles comptent dans la précision.
export function isComplete(typing: Typing, text: string): boolean {
  return text.length > 0 && typing.typed.length >= text.length;
}

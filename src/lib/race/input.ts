// Traduit ce que le navigateur écrit dans le champ de frappe en touches pour
// le moteur (typing.ts). Le champ garde toujours le dernier caractère tapé :
// sur Mac, maintenir « e » puis choisir « é » dans la bulle d'accents
// remplace ce caractère au lieu d'en ajouter un.
import { BACKSPACE } from "./typing";

export type FieldState = {
  value: string; // ce que contient le champ après le dernier passage
  pending: string | null; // lettre de base retenue : elle attend peut-être son accent
};

export const EMPTY_FIELD: FieldState = { value: "", pending: null };

// « e » est la base de « é », « c » celle de « ç »…
function isBaseOf(char: string, expected: string | undefined): boolean {
  if (!expected || expected === char) return false;
  const decomposed = expected.normalize("NFD");
  return decomposed.length > 1 && decomposed[0] === char;
}

// `expected` : le caractère que le joueur doit taper maintenant.
export function readField(
  state: FieldState,
  rawValue: string,
  expected: string | undefined,
): { keys: string[]; state: FieldState } {
  const value = rawValue.normalize("NFC");
  const keys: string[] = [];
  let added: string;
  if (value.startsWith(state.value)) {
    added = value.slice(state.value.length);
    // Un nouveau caractère arrive : la lettre retenue n'attendait pas d'accent.
    if (added && state.pending) keys.push(state.pending);
  } else {
    // Le dernier caractère a été remplacé (bulle d'accents, correction du système).
    added = value;
    if (!state.pending) keys.push(BACKSPACE);
  }

  const chars = [...added];
  let pending: string | null = null;
  chars.forEach((char, i) => {
    const last = i === chars.length - 1;
    if (last && chars.length === 1 && isBaseOf(char, expected)) pending = char;
    else keys.push(char);
  });
  if (!added) pending = state.pending;

  return { keys, state: { value: value.slice(-1), pending } };
}

// Retour arrière : une lettre retenue n'a jamais été envoyée, on l'oublie.
export function eraseField(state: FieldState): { keys: string[]; state: FieldState } {
  if (state.pending) return { keys: [], state: { value: "", pending: null } };
  return { keys: [BACKSPACE], state: { value: "", pending: null } };
}

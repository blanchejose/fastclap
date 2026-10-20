// Mesures de vitesse et de précision (annexe A). Un « mot » vaut 5 caractères,
// espaces compris : c'est la convention des tests de frappe.

const CHARS_PER_WORD = 5;

function perMinute(chars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return chars / CHARS_PER_WORD / (elapsedMs / 60_000);
}

// MPM net : seulement les caractères justes à leur place.
export function netWpm(correctChars: number, elapsedMs: number): number {
  return Math.round(perMinute(correctChars, elapsedMs));
}

// MPM brut : toutes les touches de caractère, justes ou non.
export function rawWpm(keystrokes: number, elapsedMs: number): number {
  return Math.round(perMinute(keystrokes, elapsedMs));
}

// Précision en % : touches justes sur touches pressées.
export function accuracy(keystrokes: number, errors: number): number {
  if (keystrokes === 0) return 100;
  return Math.round(((keystrokes - errors) / keystrokes) * 1000) / 10;
}

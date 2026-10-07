import { randomInt } from "node:crypto";

// Alphabet sans caractères ambigus : pas de 0/O, 1/I/L.
export const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

// Accepte « k7x-2qp » ou « K7X 2QP » et renvoie « K7X2QP », ou null si invalide.
export function normalizeRoomCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== ROOM_CODE_LENGTH) return null;
  for (const char of code) {
    if (!ROOM_CODE_ALPHABET.includes(char)) return null;
  }
  return code;
}

// Règles d'un nom d'utilisateur FastClap : 3 à 20 caractères,
// lettres non accentuées, chiffres, tiret et tiret bas.
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

// Transforme un nom de profil Discord/GitHub en base de username valide.
// « Blanche Djiofack » → « Blanche_Djiofack ».
export function usernameBaseFrom(name: string | null | undefined): string {
  const cleaned = (name ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 15);
  return cleaned.length >= 3 ? cleaned : "joueur";
}

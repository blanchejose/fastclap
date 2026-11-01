// AUTH-05 : pseudonyme d'affichage, distinct du nom d'utilisateur qui sert à
// se connecter. 3 à 20 caractères : lettres (accents compris), chiffres,
// espaces, apostrophe, tiret et tiret bas.
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} '_-]{3,20}$/u;

export function normalizeDisplayName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  return DISPLAY_NAME_PATTERN.test(name) ? name : null;
}

export function displayNameOf(user: { username: string; name: string | null }): string {
  return user.name?.trim() || user.username;
}

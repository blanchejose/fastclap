// Les invités (AUTH-02) n'ont pas de compte : leur identifiant commence par
// ce préfixe, qu'aucun identifiant de la base (cuid) ne peut avoir.
export const GUEST_PREFIX = "guest_";

export function isGuestId(id: string): boolean {
  return id.startsWith(GUEST_PREFIX);
}

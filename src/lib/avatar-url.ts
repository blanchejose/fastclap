// Adresse de la photo d'un utilisateur. Le numéro de version change à chaque
// nouvelle photo : le navigateur peut garder l'image en cache sans risque.
export function avatarUrl(userId: string, updatedAt: Date | null): string | null {
  return updatedAt ? `/api/avatar/${userId}?v=${updatedAt.getTime()}` : null;
}

export const AVATAR_URL_PATTERN = /^\/api\/avatar\/[A-Za-z0-9_-]{1,40}\?v=\d{1,15}$/;

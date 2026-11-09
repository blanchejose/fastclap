// AUTH-04, SEC-02 : photo de profil. Le type est lu dans les premiers octets
// du fichier (pas dans son nom ni dans ce que le navigateur annonce), puis
// l'image est redimensionnée avant d'être gardée.
import sharp from "sharp";
import { AVATAR_MAX_BYTES, AVATAR_SIZE } from "./avatar-limits";

export { AVATAR_MAX_BYTES, AVATAR_SIZE };

export type ImageType = "jpeg" | "png" | "webp";

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // « RIFF » … « WEBP »
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8))
    return "webp";
  return null;
}

export type AvatarCheck =
  { ok: true; type: ImageType } | { ok: false; reason: "empty" | "too_big" | "bad_type" };

export function checkAvatar(bytes: Uint8Array): AvatarCheck {
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > AVATAR_MAX_BYTES) return { ok: false, reason: "too_big" };
  const type = detectImageType(bytes);
  return type ? { ok: true, type } : { ok: false, reason: "bad_type" };
}

// Carré de 256 px en WebP, orienté selon l'appareil photo, sans métadonnées.
export async function resizeAvatar(bytes: Uint8Array): Promise<Buffer> {
  return sharp(bytes)
    .rotate()
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();
}

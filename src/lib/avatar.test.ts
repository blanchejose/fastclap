import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  AVATAR_MAX_BYTES,
  AVATAR_SIZE,
  checkAvatar,
  detectImageType,
  resizeAvatar,
} from "./avatar";
import { avatarUrl, AVATAR_URL_PATTERN } from "./avatar-url";
import { displayNameOf, normalizeDisplayName } from "./display-name";

const image = (format: "jpeg" | "png" | "webp", size = 600) =>
  sharp({ create: { width: size, height: size / 2, channels: 3, background: "#2448ff" } })
    .toFormat(format)
    .toBuffer();

describe("photo de profil (AUTH-04, SEC-02)", () => {
  it("reconnaît le vrai type d'un JPEG, d'un PNG et d'un WebP", async () => {
    expect(detectImageType(await image("jpeg"))).toBe("jpeg");
    expect(detectImageType(await image("png"))).toBe("png");
    expect(detectImageType(await image("webp"))).toBe("webp");
  });

  it("refuse un fichier qui n'est pas une image, même renommé en .png", () => {
    const fake = new TextEncoder().encode("<svg onload=alert(1)>");
    expect(checkAvatar(fake)).toEqual({ ok: false, reason: "bad_type" });
    expect(checkAvatar(new TextEncoder().encode("GIF89a..."))).toEqual({
      ok: false,
      reason: "bad_type",
    });
  });

  it("refuse un fichier vide ou de plus de 2 Mo", () => {
    expect(checkAvatar(new Uint8Array())).toEqual({ ok: false, reason: "empty" });
    const big = new Uint8Array(AVATAR_MAX_BYTES + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(checkAvatar(big)).toEqual({ ok: false, reason: "too_big" });
  });

  it("redimensionne en carré WebP de 256 px", async () => {
    const out = await resizeAvatar(await image("png", 1200));
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
    expect([meta.width, meta.height]).toEqual([AVATAR_SIZE, AVATAR_SIZE]);
  });

  it("donne une adresse versionnée, et rien sans photo", () => {
    const url = avatarUrl("cmvf123", new Date(1_700_000_000_000));
    expect(url).toMatch(AVATAR_URL_PATTERN);
    expect(avatarUrl("cmvf123", null)).toBeNull();
  });
});

describe("pseudonyme d'affichage (AUTH-05)", () => {
  it("accepte 3 à 20 caractères, accents et espaces compris", () => {
    expect(normalizeDisplayName("  Léa   la rapide ")).toBe("Léa la rapide");
    expect(normalizeDisplayName("O'Neil-2")).toBe("O'Neil-2");
  });

  it("refuse trop court, trop long ou avec des symboles", () => {
    expect(normalizeDisplayName("ab")).toBeNull();
    expect(normalizeDisplayName("a".repeat(21))).toBeNull();
    expect(normalizeDisplayName("<script>")).toBeNull();
  });

  it("revient au nom d'utilisateur sans pseudonyme", () => {
    expect(displayNameOf({ username: "lea_03", name: null })).toBe("lea_03");
    expect(displayNameOf({ username: "lea_03", name: "Léa" })).toBe("Léa");
  });
});

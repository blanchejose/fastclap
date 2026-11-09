import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("limite d'essais de code (SALLE-10)", () => {
  it("bloque après 10 essais ratés dans la minute", () => {
    const limiter = createRateLimiter(10, 60_000);
    for (let i = 0; i < 9; i++) limiter.record("1.1.1.1", i * 1000);
    expect(limiter.isBlocked("1.1.1.1", 9_500)).toBe(false);
    limiter.record("1.1.1.1", 10_000);
    expect(limiter.isBlocked("1.1.1.1", 10_500)).toBe(true);
  });

  it("compte chaque adresse séparément", () => {
    const limiter = createRateLimiter(10, 60_000);
    for (let i = 0; i < 10; i++) limiter.record("1.1.1.1", 0);
    expect(limiter.isBlocked("2.2.2.2", 0)).toBe(false);
  });

  it("débloque quand les essais sortent de la fenêtre", () => {
    const limiter = createRateLimiter(10, 60_000);
    for (let i = 0; i < 10; i++) limiter.record("1.1.1.1", 0);
    expect(limiter.isBlocked("1.1.1.1", 59_999)).toBe(true);
    expect(limiter.isBlocked("1.1.1.1", 60_000)).toBe(false);
  });
});

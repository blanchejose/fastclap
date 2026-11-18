import { expect, test } from "@playwright/test";
import { loginWithPassword } from "./helpers";

// TECH-04, HIST-01, AUTH-06 : un compte de démonstration du seed a déjà un
// historique et des statistiques.
test("le compte de démonstration a un historique et un profil", async ({ page }) => {
  await loginWithPassword(page, "demo_lea", "fastclap-demo");
  // Le lien existe aussi dans le pied de page : on prend celui de l'en-tête.
  await page.getByRole("banner").getByRole("link", { name: "Historique", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await expect(page.getByText("Page 1 sur 2")).toBeVisible();

  await page.goto("/profil");
  await expect(page.getByRole("heading", { level: 1, name: "Léa" })).toBeVisible();
  // Le seed donne 12 courses ; une base où l'on a joué depuis en a davantage.
  const races = page.locator("dl > div").filter({ hasText: "Courses" }).locator("dd").first();
  expect(Number((await races.innerText()).match(/\d+/)?.[0])).toBeGreaterThanOrEqual(12);
  await expect(page.getByRole("img", { name: "Progression du MPM" })).toBeVisible();
});

// I18N-01, I18N-02 : l'interface passe en anglais, et le choix est gardé.
test("le sélecteur de langue passe le site en anglais", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "Switch to English" }).click();
  await expect(page.getByRole("link", { name: /Quick race/ }).first()).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

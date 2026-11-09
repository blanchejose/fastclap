import { expect, test, type Page } from "@playwright/test";
import { addBot, createRoom, loginWithPassword } from "./helpers";

// DES-06 : toutes les pages sont utilisables à 360 px de large, sans défilement
// horizontal ; pendant la course, un message recommande un clavier physique.
test.use({ viewport: { width: 360, height: 740 } });

async function expectNoHorizontalScroll(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, label).toBeLessThanOrEqual(0);
}

test("les pages tiennent dans un écran de 360 px", async ({ page }) => {
  for (const path of ["/", "/salles", "/connexion", "/go", "/page-introuvable"]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page, path);
  }
  await loginWithPassword(page, "demo_lea", "fastclap-demo");
  for (const path of ["/profil", "/historique"]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page, path);
  }
  await page.locator("tbody a").first().click();
  await expect(page.getByRole("heading", { name: "Résultats" })).toBeVisible();
  await expectNoHorizontalScroll(page, "page d'une course");
});

test("sur mobile, la course est remplacée par un message", async ({ page }) => {
  await loginWithPassword(page, "demo_zoe", "fastclap-demo");
  await createRoom(page);
  await expectNoHorizontalScroll(page, "salle d'attente");
  await addBot(page, "NOOB");
  await page.getByRole("button", { name: /Lancer la course/ }).click();
  await expect(page.getByText(/clavier physique/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("textbox", { name: "Texte à taper" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Piste de la course" })).toBeAttached();
  await expectNoHorizontalScroll(page, "course");
});

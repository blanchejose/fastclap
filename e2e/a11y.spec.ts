import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addBot, createRoom, loginWithPassword, typeRaceText } from "./helpers";

// A11Y-01 à A11Y-04 : axe (le moteur d'accessibilité de Lighthouse) vérifie
// les pages connectées, dans les deux thèmes : contrastes WCAG AA, libellés,
// balises, noms accessibles.
async function expectAccessible(page: Page, label: string) {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target}`);
    expect(summary, `${label}, thème ${colorScheme}`).toEqual([]);
  }
}

test("les pages publiques et connectées respectent WCAG AA", async ({ page }) => {
  await page.goto("/");
  await expectAccessible(page, "accueil");
  await page.goto("/salles");
  await expectAccessible(page, "salles");
  await page.goto("/page-qui-n-existe-pas");
  await expectAccessible(page, "page introuvable");

  await loginWithPassword(page, "demo_zoe", "fastclap-demo");
  await page.goto("/profil");
  await expectAccessible(page, "profil");
  await page.goto("/historique");
  await expectAccessible(page, "historique");
  await page.locator("tbody a").first().click();
  await expect(page.getByRole("heading", { name: "Résultats" })).toBeVisible();
  await expectAccessible(page, "page d'une course");
});

test("la salle, la course et les résultats respectent WCAG AA", async ({ page }) => {
  await loginWithPassword(page, "demo_max", "fastclap-demo");
  await createRoom(page);
  await addBot(page, "IMPOSSIBLE");
  await expectAccessible(page, "salle d'attente");
  await page.getByRole("button", { name: /Lancer la course/ }).click();
  await expect(page.getByRole("textbox", { name: "Texte à taper" })).toBeEnabled({
    timeout: 10_000,
  });
  await page.keyboard.type("x"); // une faute, pour vérifier son contraste
  await expectAccessible(page, "course");
  await typeRaceText(page);
  await expect(page.getByRole("heading", { name: "Résultats" })).toBeVisible({ timeout: 60_000 });
  await expectAccessible(page, "résultats");
});

// A11Y-04 : tout se fait au clavier, avec un indicateur de focus visible.
test("on peut naviguer et rejoindre une course au clavier", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe("solid");

  // Jusqu'au formulaire de code, uniquement avec Tab.
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    if (
      await page
        .getByLabel("Un ami t'a donné un code ?")
        .evaluate((el) => el === document.activeElement)
    )
      break;
  }
  await expect(page.getByLabel("Un ami t'a donné un code ?")).toBeFocused();
  await page.keyboard.type("ZZZZZZ");
  await page.keyboard.press("Enter");
  await expect(page.locator("#code-erreur")).toBeVisible();
});

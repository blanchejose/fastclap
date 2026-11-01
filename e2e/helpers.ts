import { expect, type Browser, type Page } from "@playwright/test";

let counter = 0;

// Un nom d'utilisateur neuf à chaque appel : les tests ne se gênent pas.
export function uniqueName(prefix: string) {
  counter += 1;
  return `${prefix}${Date.now().toString(36).slice(-5)}${counter}`;
}

// Un navigateur séparé (cookies séparés), avec sa propre adresse IP simulée.
export async function newVisitor(browser: Browser, ip: string): Promise<Page> {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-real-ip": ip } });
  return context.newPage();
}

// TEST-03 : connexion par nom d'utilisateur et mot de passe. Si le nom est
// libre, le compte est créé avec ce mot de passe.
export async function loginWithPassword(
  page: Page,
  username: string,
  password = "mot-de-passe-e2e",
) {
  await page.goto("/connexion");
  await page.getByText("J'ai un mot de passe").click();
  await page.locator("#mdp-pseudo").fill(username);
  await page.locator("#mdp").fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).not.toHaveURL(/\/connexion/);
}

export async function createRoom(page: Page): Promise<string> {
  await page.goto("/salles");
  await page.getByRole("button", { name: "Créer la salle" }).click();
  await expect(page).toHaveURL(/\/salle\/[A-Z0-9]{6}$/);
  await expect(page.getByRole("heading", { name: /Participants/ })).toBeVisible();
  return page.url().split("/").pop()!;
}

export async function addBot(page: Page, level: string) {
  await page.getByLabel("Niveau du bot").selectOption(level);
  await page.getByRole("button", { name: "Ajouter un bot" }).click();
}

// Attend le départ, puis tape le texte affiché (relu à chaque lettre : un
// bonus peut l'allonger ou le raccourcir), à une vitesse humaine.
export async function typeRaceText(page: Page) {
  const field = page.getByRole("textbox", { name: "Texte à taper" });
  await expect(field).toBeEnabled({ timeout: 10_000 });
  await field.focus();
  for (let i = 0; ; i++) {
    const text = await page
      .locator("#texte-complet")
      .textContent()
      .catch(() => null);
    if (text === null || i >= text.length) break;
    await page.keyboard.type(text[i], { delay: 60 });
  }
}

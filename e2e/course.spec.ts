import { expect, test } from "@playwright/test";
import { addBot, createRoom, loginWithPassword, typeRaceText, uniqueName } from "./helpers";

// COURSE-01 à COURSE-04, BOT-04, RES-01 à RES-05, HIST-01, HIST-02 : une course
// complète contre un bot, puis ses résultats dans l'historique.
test("une course complète contre un bot, enregistrée dans l'historique", async ({ page }) => {
  await loginWithPassword(page, uniqueName("course"));
  await createRoom(page);

  // COURSE-02 : pas de départ seul.
  const start = page.getByRole("button", { name: /Lancer la course/ });
  await expect(start).toBeDisabled();
  // Sans bonus de remontée : un bot en retard recevrait des « −3 mots » et
  // pourrait gagner. Les bonus ont leurs propres tests (bonus.test.ts).
  await page.getByRole("checkbox", { name: "Bonus de remontée" }).click(); // confirmé par le serveur
  await expect(page.getByRole("checkbox", { name: "Bonus de remontée" })).not.toBeChecked();
  await addBot(page, "EXPERT"); // assez rapide pour que la course finisse vite
  await expect(page.getByText("BOT · Expert")).toBeVisible();
  await expect(start).toBeEnabled();

  await start.click();
  await expect(page.getByRole("status").filter({ hasText: /Départ dans/ })).toBeVisible();
  await typeRaceText(page);

  await expect(page.getByRole("heading", { name: "Résultats" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Tu as gagné !")).toBeVisible();
  await expect(page.getByRole("list", { name: "Podium" })).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Arrivé");
  await expect(page.getByText(/Nouveau record personnel/)).toBeVisible();
  await expect(page.getByRole("img", { name: "Évolution du MPM" })).toBeVisible();

  await page.getByRole("link", { name: "Voir cette course dans mon historique" }).click();
  await expect(page).toHaveURL(/\/course\//);
  await expect(page.getByText("Tu as gagné !")).toBeVisible();

  await page.getByRole("link", { name: "Historique", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("1re sur 2");
});

test("le coller est désactivé dans la zone de frappe (COURSE-04)", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await loginWithPassword(page, uniqueName("coller"));
  await createRoom(page);
  await addBot(page, "NOOB");
  await page.getByRole("button", { name: /Lancer la course/ }).click();
  const field = page.getByRole("textbox", { name: "Texte à taper" });
  await expect(field).toBeEnabled({ timeout: 10_000 });
  const text = (await page.locator("#texte-complet").textContent()) ?? "";
  await page.evaluate((value) => navigator.clipboard.writeText(value), text);
  await field.focus();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(page.locator("p[aria-hidden] span.text-juste")).toHaveCount(0);
});

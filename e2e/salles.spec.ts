import { expect, test } from "@playwright/test";
import { addBot, createRoom, loginWithPassword, newVisitor, uniqueName } from "./helpers";

// AUTH-02, AUTH-03 : une personne sans compte entre avec un pseudo.
test("une invitée rejoint une salle avec un pseudo", async ({ page, browser }) => {
  await loginWithPassword(page, uniqueName("hote"));
  await createRoom(page);

  const guest = await newVisitor(browser, "203.0.113.20");
  await guest.goto(page.url());
  await guest.getByLabel("Ton pseudo").fill("zoe_e2e");
  await guest.getByRole("button", { name: "Entrer dans la salle" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "zoe_e2e" })).toContainText("(invité)");

  await guest.goto("/salles");
  await expect(guest.getByRole("button", { name: "Créer la salle" })).toHaveCount(0);
});

// SALLE-03, SALLE-04 : salle privée, lien d'invitation lié à une adresse IP.
test("une salle privée ne s'ouvre qu'avec un lien d'invitation", async ({ page, browser }) => {
  await loginWithPassword(page, uniqueName("prive"));
  const code = await createRoom(page);
  await page.getByRole("radio", { name: /Privée/ }).click();
  await page.getByRole("button", { name: "Générer un lien" }).click();
  const link = await page.getByRole("textbox", { name: "Lien 1" }).inputValue();

  const stranger = await newVisitor(browser, "203.0.113.30");
  await stranger.goto("/");
  await stranger.getByLabel("Un ami t'a donné un code ?").fill(code);
  await stranger.getByRole("button", { name: "Entrer", exact: true }).click();
  await expect(stranger.getByText(/Cette salle est privée/)).toBeVisible();

  const invited = await newVisitor(browser, "203.0.113.31");
  await invited.goto(link);
  await invited.getByLabel("Ton pseudo").fill("ana_e2e");
  await invited.getByRole("button", { name: "Entrer dans la salle" }).click();
  await expect(invited).toHaveURL(new RegExp(`/salle/${code}$`));
  await expect(page.getByText("Utilisé par ana_e2e")).toBeVisible();

  const other = await newVisitor(browser, "203.0.113.32");
  await other.goto(link);
  await other.getByLabel("Ton pseudo").fill("ben_e2e");
  await other.getByRole("button", { name: "Entrer dans la salle" }).click();
  await expect(other.getByText(/déjà été utilisé/)).toBeVisible();
});

// JOIN-02, JOIN-03 : la salle apparaît dans l'explorateur ; la partie rapide y mène.
test("l'explorateur montre la salle et la partie rapide y mène", async ({ page, browser }) => {
  await loginWithPassword(page, uniqueName("explo"));
  const code = await createRoom(page);
  await page.getByLabel(/Capacité/).fill("2");
  await page.getByLabel(/Capacité/).press("Tab");

  const visitor = await newVisitor(browser, "203.0.113.40");
  await visitor.goto("/salles");
  const card = visitor.getByRole("link", {
    name: new RegExp(`${code.slice(0, 3)}-${code.slice(3)}`),
  });
  await expect(card).toContainText("1/2 participants");
  await addBot(page, "NOOB");
  await expect(card).toContainText("2/2 participants"); // sans recharger

  // Salle pleine : la partie rapide ne la propose plus.
  await loginWithPassword(visitor, uniqueName("rapide"));
  await visitor.goto("/go");
  await expect(visitor).not.toHaveURL(new RegExp(`/salle/${code}$`));
});

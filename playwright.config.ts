import { defineConfig, devices } from "@playwright/test";

// TEST-02 : tests de bout en bout. Ils lancent le vrai serveur (Next.js +
// Socket.IO) sur une vraie base PostgreSQL ; la connexion se fait par nom
// d'utilisateur et mot de passe (TEST-03), jamais par OAuth.
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // un seul serveur et une seule base pour tous les tests
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "fr-CA",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    // En CI : le build de production ; en local : réutilise « npm run dev ».
    command: process.env.CI ? "npm start" : "npm run dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { TRUST_PROXY_HEADER: "x-real-ip" }, // chaque test peut simuler son adresse IP
  },
});

# FastClap

Courses de frappe au clavier en temps réel pour les élèves de 12 à 17 ans.
À vos claviers, prêts… go !
Projet Web V (420-5U3-SO), Cégep de Sorel-Tracy.

## Stack

- Next.js (App Router : composants serveur et composants clients)
- React, TypeScript, Tailwind CSS v4 (thème FastClap dans `src/app/globals.css`)
- ESLint + Prettier
- PostgreSQL + Prisma 7
- Auth.js (next-auth v5) : Discord, GitHub, pseudo seul, pseudo + mot de passe
- Socket.IO pour le temps réel (serveur `server.ts`)
- Vitest pour les tests unitaires
- Français et anglais (`src/i18n/`)

## Production

Hébergé sur Railway (Docker, HTTPS, toujours allumé), base PostgreSQL sur Neon. Voir le
[guide de déploiement](docs/DEPLOIEMENT.md).

## Démarrer

```bash
npm install
cp .env.example .env        # puis adapte DATABASE_URL si besoin
docker compose up -d        # lance PostgreSQL en local
npm run db:migrate          # crée les tables
npm run db:seed             # ajoute les textes de départ
npm run dev
```

Ouvre http://localhost:3000. Pages utiles :

- `/salles` : liste des salles publiques (lue dans la base)
- `/api/health` : vérifie que l'application et la base répondent

## Comptes de démonstration

Le seed (`npm run db:seed`) crée trois comptes avec un historique de 12
courses, pour voir tout de suite l'historique, les graphiques et le profil
(TECH-04). Connexion par mot de passe sur `/connexion` (« J'ai un mot de
passe ») :

| Nom d'utilisateur | Mot de passe    |
| ----------------- | --------------- |
| `demo_lea`        | `fastclap-demo` |
| `demo_max`        | `fastclap-demo` |
| `demo_zoe`        | `fastclap-demo` |

Ce sont des comptes de démonstration sans droit particulier ; le mot de passe
est volontairement public.

## Tests de bout en bout

```bash
npm run test:e2e    # lance le serveur s'il ne tourne pas, puis les scénarios
```

Les scénarios (`e2e/`) se connectent par nom d'utilisateur et mot de passe
(TEST-03), jamais par OAuth. Ils couvrent une course complète contre un bot,
le coller bloqué, une invitée, une salle privée avec lien d'invitation,
l'explorateur, la partie rapide, l'historique et le profil du compte de
démonstration, et le changement de langue. La CI les exécute sur le build de
production avec une vraie base PostgreSQL.

## Scripts

| Script                 | Rôle                                            |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Serveur de développement (Next.js + Socket.IO)  |
| `npm run build`        | Build de production                             |
| `npm run lint`         | ESLint (inclut la vérification Prettier)        |
| `npm run lint:fix`     | Corrige automatiquement ESLint et le formatage  |
| `npm run format`       | Formate tout le projet avec Prettier            |
| `npm run format:check` | Vérifie le formatage sans modifier (utilisé CI) |
| `npm run typecheck`    | Vérification TypeScript                         |
| `npm test`             | Tests unitaires (Vitest)                        |
| `npm run test:e2e`     | Tests de bout en bout (Playwright, TEST-02)     |
| `npm run db:migrate`   | Crée ou met à jour les tables (développement)   |
| `npm run db:deploy`    | Applique les migrations en production           |
| `npm run db:seed`      | Ajoute les données de départ                    |
| `npm run db:studio`    | Ouvre Prisma Studio pour voir les données       |

## Composants serveur et clients

Dans l'App Router, chaque composant est un **composant serveur** par défaut.
On ajoute `"use client"` en haut d'un fichier seulement quand il a besoin
d'interactivité (état, événements, `localStorage`, API du navigateur).

- `src/app/page.tsx` : composant serveur (page d'accueil)
- `src/components/JoinRaceButton.tsx` : composant client (clic)
- `src/components/ThemeToggle.tsx` : composant client (thème sombre/clair)
- `src/app/salles/page.tsx` : composant serveur asynchrone qui lit la base avec Prisma

## Salles et courses en temps réel

`server.ts` démarre Next.js et Socket.IO sur le même port (voir l'ADR temps réel
dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)).

- `src/lib/race/engine.ts` : la salle et la machine à états de la course
  (attente, décompte, course, résultats), sans réseau, testée dans `engine.test.ts`
- `src/lib/race/typing.ts` : règles de frappe partagées par le navigateur et le serveur
- `src/lib/race/bots.ts` : bots déterministes à graine, 5 niveaux
- `src/lib/race/messages.ts` : schémas Zod des messages temps réel
- `server.ts` : reçoit les touches par lots, fait avancer les salles 10 fois par
  seconde et diffuse leur état
- `src/components/RoomLive.tsx` et `src/components/race/` : la salle, la piste,
  la zone de frappe et les résultats dans le navigateur
- `src/lib/socket-token.ts` : jeton signé qui identifie le joueur auprès de Socket.IO

Créer une salle : page `/salles`. La rejoindre : son code sur l'accueil.

## Documentation

- [Démarche créative](docs/DEMARCHE-CREATIVE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Matrice de traçabilité](docs/MATRICE.md) : chaque exigence, où et comment elle est vérifiée
- [Exigences](docs/EXIGENCES.md) : les choix faits quand l'énoncé est ambigu
- [Guide de déploiement](docs/DEPLOIEMENT.md)

## Authentification

Page `/connexion`, dans l'ordre demandé par le cahier des charges :

1. Discord et GitHub (AUTH-01) : boutons actifs seulement si les clés
   `AUTH_DISCORD_*` / `AUTH_GITHUB_*` sont dans `.env`
2. Pseudo seul, sans mot de passe : un pseudo déjà pris est refusé
3. Pseudo + mot de passe (AUTH-01, utilisé par les tests de bout en bout), replié en bas de page : crée le compte si le
   pseudo est libre, sinon vérifie le mot de passe (bcrypt)

Fichiers : `src/auth.ts` (configuration), `src/app/connexion/` (page et Server
Actions), `src/components/UserMenu.tsx` (nom affiché dans l'en-tête).

Génère `AUTH_SECRET` avec `npx auth secret` avant le premier lancement.

## Base de données

- `prisma/schema.prisma` : les tables (voir la page Architecture)
- `prisma/migrations/` : l'historique des changements de la base, versionné dans Git
- `prisma/seed.ts` : les données de départ
- `src/lib/prisma.ts` : la connexion unique à la base utilisée par l'application

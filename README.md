# FastClap

Course de frappe au clavier en temps réel pour les élèves de 12 à 17 ans.
Projet Web V (420-5U3-SO), Cégep de Sorel-Tracy.

## Stack

- Next.js (App Router : composants serveur et composants clients)
- React, TypeScript, Tailwind CSS
- ESLint + Prettier
- PostgreSQL + Prisma 7
- Auth.js (next-auth v5) : Discord, GitHub, pseudo seul, pseudo + mot de passe

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

## Scripts

| Script                 | Rôle                                            |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Serveur de développement                        |
| `npm run build`        | Build de production                             |
| `npm run lint`         | ESLint (inclut la vérification Prettier)        |
| `npm run lint:fix`     | Corrige automatiquement ESLint et le formatage  |
| `npm run format`       | Formate tout le projet avec Prettier            |
| `npm run format:check` | Vérifie le formatage sans modifier (utilisé CI) |
| `npm run typecheck`    | Vérification TypeScript                         |
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

## Authentification

Page `/connexion`, dans l'ordre demandé par le cahier des charges :

1. Discord (AUTH-1) et GitHub (AUTH-2) : boutons actifs seulement si les clés
   `AUTH_DISCORD_*` / `AUTH_GITHUB_*` sont dans `.env`
2. Pseudo seul, sans mot de passe (AUTH-3) : un pseudo déjà pris est refusé
3. Pseudo + mot de passe (AUTH-4), replié en bas de page : crée le compte si le
   pseudo est libre, sinon vérifie le mot de passe (bcrypt)

Fichiers : `src/auth.ts` (configuration), `src/app/connexion/` (page et Server
Actions), `src/components/UserMenu.tsx` (nom affiché dans l'en-tête).

Génère `AUTH_SECRET` avec `npx auth secret` avant le premier lancement.

## Base de données

- `prisma/schema.prisma` : les tables (voir la page Architecture)
- `prisma/migrations/` : l'historique des changements de la base, versionné dans Git
- `prisma/seed.ts` : les données de départ
- `src/lib/prisma.ts` : la connexion unique à la base utilisée par l'application

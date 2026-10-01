# FastClap

Course de frappe au clavier en temps réel pour les élèves de 12 à 17 ans.
Projet Web V (420-5U3-SO), Cégep de Sorel-Tracy.

## Stack

- Next.js (App Router : composants serveur et composants clients)
- React, TypeScript, Tailwind CSS
- ESLint + Prettier
- PostgreSQL (à venir, via Prisma)

## Démarrer

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000.

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

## Composants serveur et clients

Dans l'App Router, chaque composant est un **composant serveur** par défaut.
On ajoute `"use client"` en haut d'un fichier seulement quand il a besoin
d'interactivité (état, événements, `localStorage`, API du navigateur).

- `src/app/page.tsx` : composant serveur (page d'accueil)
- `src/components/JoinRaceButton.tsx` : composant client (clic)
- `src/components/ThemeToggle.tsx` : composant client (thème sombre/clair)

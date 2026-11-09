# FastClap

Courses de frappe au clavier en temps réel pour les élèves de 12 à 17 ans.
À vos claviers, prêts… go !
Projet Web V (420-5U3-SO), Cégep de Sorel-Tracy.

**Production : https://fastclap-production.up.railway.app**

Les joueurs se retrouvent dans une salle identifiée par un code de 6
caractères et tapent le même texte. Chacun voit la progression des autres en
direct sur la piste. Des bots de cinq niveaux complètent la salle, et des
bonus de remontée gardent la course serrée jusqu'à la fin. Après la course :
podium, tableau complet, courbe du MPM de chacun et clavier des touches
manquées. Tout est gardé dans l'historique et le profil.

## Captures d'écran

| Accueil                                      | Salle d'attente et configuration                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| ![Accueil](docs/images/captures/accueil.png) | ![Salle d'attente](docs/images/captures/salle-attente.png) |
| **Course (bonus « brouillard » en cours)**   | **Résultats**                                              |
| ![Course](docs/images/captures/course.png)   | ![Résultats](docs/images/captures/resultats.png)           |
| **Profil et progression**                    | **Historique (thème sombre)**                              |
| ![Profil](docs/images/captures/profil.png)   | ![Historique](docs/images/captures/historique-sombre.png)  |

## Technologies

- **Next.js 16** (App Router) et **React 19**, en **TypeScript** strict
- **Tailwind CSS 4** (thème FastClap dans `src/app/globals.css`)
- **Socket.IO** pour le temps réel, dans le même serveur que Next.js (`server.ts`)
- **PostgreSQL** avec **Prisma 7** (migrations versionnées dans `prisma/migrations/`)
- **Auth.js v5** : Discord, GitHub, pseudo seul, pseudo et mot de passe (bcrypt)
- **Zod** pour valider toutes les entrées du serveur
- **sharp** pour redimensionner les photos de profil
- **Vitest** (tests unitaires), **Playwright** et **axe** (tests de bout en bout et accessibilité)
- **GitHub Actions** (CI), **Docker**, **Railway** (serveur) et **Neon** (base PostgreSQL, forfait gratuit)

## Installation locale

Il faut Node.js 22 et Docker.

```bash
npm install
cp .env.example .env        # puis remplis AUTH_SECRET (voir plus bas)
npx auth secret             # génère AUTH_SECRET dans .env.local, à recopier dans .env
docker compose up -d        # lance PostgreSQL 16 en local (docker-compose.yml)
npm run db:migrate          # crée les tables
npm run db:seed             # textes, comptes de démonstration et historique
npm run dev                 # http://localhost:3000
```

Pour tester comme en production : `npm run build` puis `npm start`.

## Comptes de démonstration

Le seed crée trois comptes avec un historique de 12 courses, pour voir tout
de suite l'historique, les graphiques et le profil. Ils marchent aussi en
production. Connexion sur `/connexion`, section « J'ai un mot de passe » :

| Nom d'utilisateur | Mot de passe    |
| ----------------- | --------------- |
| `demo_lea`        | `fastclap-demo` |
| `demo_max`        | `fastclap-demo` |
| `demo_zoe`        | `fastclap-demo` |

Ce sont des comptes sans droit particulier ; le mot de passe est
volontairement public.

**Pour essayer une course seul :** connecte-toi, va dans « Salles », crée une
salle, ajoute un bot, puis « Go ! Lancer la course ». Pour jouer à deux, ouvre
une fenêtre privée et entre le code de la salle sur l'accueil.

## Variables d'environnement

Toutes sont documentées dans [`.env.example`](.env.example). Aucun secret
n'est commité (`.env` est ignoré par Git).

| Variable                                 | Obligatoire | Rôle                                                                                      |
| ---------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`                           | Oui         | Connexion PostgreSQL (local : Docker ; production : Neon, avec `?sslmode=require`)        |
| `AUTH_SECRET`                            | Oui         | Signe les sessions, les jetons du temps réel et le cookie des invités (`npx auth secret`) |
| `AUTH_TRUST_HOST`                        | Oui         | `true` : nécessaire à Auth.js derrière Railway et pour `npm start`                        |
| `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET` | Non         | Connexion Discord ; le bouton est désactivé sans ces clés                                 |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`   | Non         | Connexion GitHub ; le bouton est désactivé sans ces clés                                  |
| `TRUST_PROXY_HEADER`                     | En prod.    | En-tête qui contient la vraie adresse IP derrière le proxy (Railway : `x-real-ip`)        |
| `PORT`                                   | Non         | Port du serveur, 3000 par défaut (Railway le définit lui-même)                            |

## Tests

```bash
npm run lint         # ESLint (avec la vérification Prettier)
npm run typecheck    # tsc --noEmit
npm test             # tests unitaires (Vitest)
npm run test:e2e     # tests de bout en bout (Playwright), base locale requise
```

`npm run test:e2e` lance le serveur s'il ne tourne pas déjà. Les scénarios
(`e2e/`) se connectent par nom d'utilisateur et mot de passe, jamais par
OAuth. Ils couvrent une course complète contre un bot, le coller bloqué, une
invitée, une salle privée avec lien d'invitation, l'explorateur, la partie
rapide, le compte de démonstration, le changement de langue,
l'accessibilité (axe, thèmes clair et sombre), la navigation au clavier et
l'affichage à 360 px.

La CI (`.github/workflows/ci.yml`) lance le lint, la vérification des types
et les tests unitaires à chaque push, puis les tests de bout en bout sur le
build de production avec une vraie base PostgreSQL.

## Scripts

| Script               | Rôle                                             |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Serveur de développement (Next.js + Socket.IO)   |
| `npm run build`      | Build de production                              |
| `npm start`          | Lance le build de production                     |
| `npm run lint`       | ESLint (inclut la vérification Prettier)         |
| `npm run lint:fix`   | Corrige automatiquement ESLint et le formatage   |
| `npm run format`     | Formate tout le projet avec Prettier             |
| `npm run typecheck`  | Vérification TypeScript                          |
| `npm test`           | Tests unitaires (Vitest)                         |
| `npm run test:e2e`   | Tests de bout en bout (Playwright)               |
| `npm run db:migrate` | Crée ou met à jour les tables (développement)    |
| `npm run db:deploy`  | Applique les migrations en production            |
| `npm run db:seed`    | Ajoute les données de départ et de démonstration |
| `npm run db:studio`  | Ouvre Prisma Studio pour voir les données        |

## Organisation du code

- `server.ts` : démarre Next.js et Socket.IO sur le même port ; reçoit les
  touches par lots, fait avancer les salles 10 fois par seconde et diffuse
  leur état
- `src/lib/race/` : le cœur du jeu, en code pur et testé — machine à états
  (`engine.ts`), règles de frappe partagées par le navigateur et le serveur
  (`typing.ts`), bots à graine (`bots.ts`), bonus (`bonus.ts`), configuration
  et messages validés par Zod (`config.ts`, `messages.ts`)
- `src/lib/text/` : génération des textes (corpus et mots aléatoires, complexité)
- `src/app/` : les pages (App Router) et les Server Actions
- `src/components/` : les composants ; `race/` contient la piste, la zone de
  frappe, les résultats et les graphiques
- `src/i18n/` : les textes de l'interface en français et en anglais
- `prisma/` : schéma, migrations et seed
- `e2e/` : tests Playwright

## Documentation

- [Architecture](docs/ARCHITECTURE.md) : modèle de données, machine à états,
  flux des messages temps réel, ADR (temps réel et bots)
- [Exigences](docs/EXIGENCES.md) : matrice de traçabilité et choix documentés
- [Démarche créative](docs/DEMARCHE-CREATIVE.md) : nom, logo, moodboard,
  palette, typographies
- [Utilisation de l'IA](docs/IA.md)
- [Guide de déploiement](docs/DEPLOIEMENT.md)

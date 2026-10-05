# Matrice des exigences

Suivi de chaque exigence du cahier des charges : où elle est réalisée et comment
elle est vérifiée. Mise à jour au checkpoint 1.

Légende : ✅ fait · 🟡 en partie · ⏳ à faire (livraison finale)

## Authentification

| ID     | Exigence                                     | Statut | Où                                                     | Vérification                            |
| ------ | -------------------------------------------- | ------ | ------------------------------------------------------ | --------------------------------------- |
| AUTH-1 | Connexion Discord                            | ✅     | `src/auth.ts`, `src/app/connexion/`                    | Testé en production                     |
| AUTH-2 | Connexion GitHub                             | ✅     | `src/auth.ts`, `src/app/connexion/`                    | Testé en production                     |
| AUTH-3 | Compte avec pseudo seul                      | ✅     | `src/auth.ts` (fournisseur `username`)                 | Test navigateur (course à deux joueurs) |
| AUTH-4 | Pseudo + mot de passe, visuellement déprécié | ✅     | `src/auth.ts` (bcrypt), section repliée en bas de page | Test navigateur                         |
| AUTH-5 | Aucune récupération par courriel             | ✅     | Aucun courriel collecté ni envoyé                      | Revue du code                           |
| AUTH-6 | Lien unique pour une course privée           | ⏳     | Table `InviteLink` déjà dans le schéma                 | —                                       |

## Accueil

| ID     | Exigence                                 | Statut | Où                    | Vérification    |
| ------ | ---------------------------------------- | ------ | --------------------- | --------------- |
| HOME-1 | Bouton « Rejoindre une course » dominant | ✅     | `src/app/page.tsx`    | Revue visuelle  |
| HOME-2 | Mène à la prochaine course sans friction | ✅     | `src/app/go/route.ts` | Test navigateur |

## Salles

| ID     | Exigence                                        | Statut | Où                                                   | Vérification                       |
| ------ | ----------------------------------------------- | ------ | ---------------------------------------------------- | ---------------------------------- |
| ROOM-1 | Publique, semi-publique (code), privée (lien)   | 🟡     | `src/app/salles/`, `src/app/salle/actions.ts`        | Publique et code : test navigateur |
| ROOM-2 | Minimum 2 joueurs pour partir                   | ✅     | `src/lib/race/engine.ts` (`updateLobby`, `canStart`) | `engine.test.ts`                   |
| ROOM-3 | Délai pour les retardataires + compte à rebours | ✅     | `engine.ts` (`WAITING`, `COUNTDOWN`)                 | `engine.test.ts`                   |
| ROOM-4 | Copier-coller désactivé                         | ✅     | `src/components/RoomLive.tsx` (`onPaste`, `onDrop`)  | Revue du code                      |
| ROOM-5 | L'organisateur retire un participant            | ✅     | `engine.ts` (`kick`), `server.ts` (`room:kick`)      | `engine.test.ts`                   |
| ROOM-6 | Mode spectateur                                 | ⏳     | —                                                    | —                                  |

## Course

| ID     | Exigence                                         | Statut | Où                                                        | Vérification                      |
| ------ | ------------------------------------------------ | ------ | --------------------------------------------------------- | --------------------------------- |
| RACE-1 | Tous tapent en même temps, rang et WPM en direct | ✅     | `server.ts` (diffusion 10 fois/s), `RoomLive.tsx`         | Test navigateur à deux joueurs    |
| RACE-2 | Progression gardée à la déconnexion              | ✅     | `engine.ts` (`leaveRace`, `joinRace`)                     | `engine.test.ts`                  |
| RACE-3 | Abandon, classé dernier                          | ✅     | `engine.ts` (`abandon`, `ranking`)                        | `engine.test.ts`                  |
| RACE-4 | Bonne lettre obligatoire pour avancer            | ✅     | `engine.ts` (`applyKey`), vérifié côté serveur            | `engine.test.ts`, test navigateur |
| RACE-5 | Anti-triche : spam clavier pénalisé              | ✅     | `engine.ts` (20 touches/s maximum)                        | `engine.test.ts`                  |
| RACE-6 | Podium, statistiques, relancer ou fermer         | 🟡     | `RoomLive.tsx` (podium, tableau), `engine.ts` (`restart`) | Relance : test ; fermer : ⏳      |

## Bonus et bots

| ID      | Exigence                        | Statut | Où                             | Vérification |
| ------- | ------------------------------- | ------ | ------------------------------ | ------------ |
| BONUS-1 | Bonus à ramasser sur la piste   | ⏳     | —                              | —            |
| BONUS-2 | Malus pour le dernier           | ⏳     | —                              | —            |
| BONUS-3 | Brouillage de la moitié du haut | ⏳     | —                              | —            |
| BOT-1   | Bots de 4 niveaux               | ⏳     | Enum `BotLevel` dans le schéma | —            |
| BOT-2   | Bots réalistes                  | ⏳     | —                              | —            |

## Textes

| ID     | Exigence                                 | Statut | Où                                           | Vérification    |
| ------ | ---------------------------------------- | ------ | -------------------------------------------- | --------------- |
| TEXT-1 | Textes générés, jamais rédigés à la main | 🟡     | Corpus de départ (`prisma/seed.ts`)          | —               |
| TEXT-2 | Plusieurs sources de textes              | ⏳     | Champ `Text.source`                          | —               |
| TEXT-3 | Difficulté et longueur configurables     | 🟡     | Difficulté choisie à la création de salle    | Test navigateur |
| TEXT-4 | Caractères exclus, limite de temps       | ⏳     | Champs `Room.blacklist`, `Room.timeLimitSec` | —               |

## Statistiques

| ID      | Exigence                         | Statut | Où                          | Vérification |
| ------- | -------------------------------- | ------ | --------------------------- | ------------ |
| STATS-1 | Page de statistiques personnelle | ⏳     | Table `RaceResult`          | —            |
| STATS-2 | Heatmap du clavier               | ⏳     | Table `KeyStat`             | —            |
| STATS-3 | Niveaux ou badges (dossards)     | ⏳     | Tables `Badge`, `UserBadge` | —            |

## Interface

| ID   | Exigence                                              | Statut | Où                                                                          | Vérification                      |
| ---- | ----------------------------------------------------- | ------ | --------------------------------------------------------------------------- | --------------------------------- |
| UI-1 | Nom et logo, mode sombre/clair, bascule FR/EN partout | ✅     | `src/components/Logo.tsx`, `ThemeToggle.tsx`, `LangToggle.tsx`, `src/i18n/` | Test navigateur (thème et langue) |
| UI-2 | Page de paramètres                                    | ⏳     | —                                                                           | —                                 |
| UI-3 | Responsive, musique pendant les courses               | 🟡     | Mise en page Tailwind responsive ; musique ⏳                               | Test à 390 px de large            |

## Technique

| ID     | Exigence                                         | Statut | Où                                                      | Vérification                  |
| ------ | ------------------------------------------------ | ------ | ------------------------------------------------------- | ----------------------------- |
| TECH-1 | React, Next.js, TypeScript, Tailwind, PostgreSQL | ✅     | `package.json`, `prisma/schema.prisma`                  | CI (build)                    |
| TECH-2 | HTTPS, dépôt Git public                          | ✅     | Render (`render.yaml`), github.com/blanchejose/fastclap | https://fastclap.onrender.com |
| TECH-3 | Tests unitaires et documentation                 | 🟡     | `src/**/*.test.ts`, `docs/`                             | `npm test` dans la CI         |

## Qualité du code

- **CI** (`.github/workflows/ci.yml`) à chaque push : formatage Prettier, ESLint,
  TypeScript, tests Vitest, build de production.
- **Tests unitaires** : 27 tests (moteur de course, code de salle, pseudo, jeton
  temps réel).
- **Accessibilité** : lien d'évitement, focus visible, cibles de 44 px minimum,
  erreurs liées aux champs, animations coupées si « Réduire les animations ».

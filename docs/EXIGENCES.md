# Exigences

Toutes les exigences du cahier des charges, avec leur statut : où elles sont
réalisées et comment elles sont vérifiées. Les tableaux du checkpoint 1 gardent
les identifiants de la première version du cahier ; la section « Sprint 1 »
utilise ceux de l'énoncé du travail de session (COURSE-01, BOT-05…). La matrice
de traçabilité finale reprendra tout avec les identifiants de l'énoncé.

## Sprint 1 — une course jouable

| ID                    | Exigence                                                   | Statut | Où                                                       | Vérification                           |
| --------------------- | ---------------------------------------------------------- | ------ | -------------------------------------------------------- | -------------------------------------- |
| COURSE-01             | Machine à états documentée                                 | ✅     | `src/lib/race/engine.ts`, `ARCHITECTURE.md` (section 2)  | `engine.test.ts`                       |
| COURSE-02             | ≥ 2 participants dont ≥ 1 humain ; bots oui, spect. non    | ✅     | `engine.ts` (`startBlocker`)                             | `engine.test.ts`                       |
| COURSE-03             | Décompte 3-2-1 synchronisé, texte révélé au décompte       | ✅     | `engine.ts`, `server.ts` (`race:text`), `Countdown.tsx`  | `engine.test.ts`, test navigateur      |
| COURSE-04             | Retour immédiat, MPM et précision en direct, coller bloqué | ✅     | `TypingZone.tsx`, `RoomLive.tsx`                         | Test navigateur                        |
| COURSE-05 · PERF-03   | Piste en direct, interpolée, joueur local mis en évidence  | ✅     | `src/components/race/Track.tsx`                          | Test navigateur : 57 i/s à 30 coureurs |
| COURSE-06 · PERF-02   | Serveur autoritaire, touches par lots (≤ 10/s)             | ✅     | `engine.ts` (`applyKeys`), `server.ts`, `RoomLive.tsx`   | `engine.test.ts`                       |
| COURSE-07             | Abandon avec confirmation                                  | ✅     | `RoomLive.tsx` (`RaceStatus`), `engine.ts` (`abandon`)   | Test navigateur                        |
| COURSE-08             | Reprise dans les 30 s, sinon abandon                       | ✅     | `engine.ts` (`disconnect`, `tick`), `server.ts` (resync) | `engine.test.ts`, test navigateur      |
| COURSE-09 · COURSE-10 | Fin de course et classement à 3 niveaux                    | ✅     | `engine.ts` (`tick`, `ranking`)                          | `engine.test.ts`                       |
| COURSE-11             | Relancer ou fermer depuis les résultats                    | ✅     | `engine.ts` (`backToLobby`, `close`), `RoomLive.tsx`     | `engine.test.ts`, test navigateur      |
| BOT-01 à BOT-05       | 5 niveaux, vitesse variable, fautes, identifiés, graine    | ✅     | `src/lib/race/bots.ts`, `random.ts`                      | `bots.test.ts`                         |
| CONF-08               | Correction obligatoire ou mode libre                       | 🟡     | `typing.ts` ; choix par l'hôte au sprint 2               | `typing.test.ts`                       |
| SALLE-01              | L'hôte (et chacun) choisit de courir ou de regarder        | ✅     | `engine.ts` (`setRole`), `WaitingRoom.tsx`               | `engine.test.ts`                       |
| SALLE-07 · SALLE-09   | Expulsion définitive ; entrée seulement hors course        | ✅     | `engine.ts` (`kick`, `join`)                             | `engine.test.ts`                       |
| SALLE-08              | Transfert d'hôte au plus ancien humain, sinon fermeture    | ✅     | `engine.ts` (`transferHost`)                             | `engine.test.ts`                       |
| TECH-07               | Messages temps réel validés par Zod                        | ✅     | `src/lib/race/messages.ts`, `server.ts`                  | `messages.test.ts`                     |
| TECH-09               | CI à chaque push                                           | ✅     | `.github/workflows/ci.yml`                               | GitHub Actions                         |
| I18N-02               | Langue du navigateur par défaut, choix gardé en cookie     | ✅     | `src/i18n/server.ts`                                     | Test navigateur                        |

### Choix documentés (section 2.2 de l'énoncé)

- **MPM (annexe A).** Un mot vaut 5 caractères, espaces compris. MPM net :
  caractères justes à leur place ÷ 5 ÷ minutes. MPM brut : toutes les touches de
  caractère ÷ 5 ÷ minutes. Précision : touches justes ÷ touches pressées. Une
  faute corrigée reste comptée.
- **Mode libre.** Le joueur avance sur une faute et peut l'effacer avec Retour
  arrière. Il arrive quand il a couvert tout le texte, même avec des fautes
  laissées derrière : elles baissent son MPM net et sa précision.
- **Vitesse irréaliste (COURSE-06).** Le serveur refuse un lot de plus de 30
  touches, plus de 50 touches en 2 secondes, ou une moyenne de plus de 25
  touches par seconde depuis le départ (≈ 300 MPM, au-delà de tout humain), avec
  10 touches de marge pour la latence. Un lot refusé n'est pas appliqué : le
  serveur renvoie son état et le navigateur s'y aligne.
- **Salle pleine.** Une personne qui entre dans une salle pleine y entre comme
  spectatrice (les spectateurs ne comptent pas dans la capacité).
- **Absence.** Le délai de 30 s de COURSE-08 s'applique aussi en salle
  d'attente : une personne partie depuis 30 s est retirée de la salle, et si
  c'était l'hôte, le rôle passe au plus ancien humain connecté (SALLE-08).
- **Rôle.** Chaque personne humaine (pas seulement l'hôte) choisit entre « Je
  cours » et « Je regarde » dans la salle d'attente.

Légende : ✅ fait · 🟡 en partie · ⏳ à faire (livraison finale)

## Livrables du checkpoint 1

| Livrable                                                    | Statut | Où                                                                |
| ----------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| Démarche créative : noms, logo, moodboard, palette, polices | ✅     | [`DEMARCHE-CREATIVE.md`](DEMARCHE-CREATIVE.md)                    |
| Architecture : données, machine à états, ADR, bots          | ✅     | [`ARCHITECTURE.md`](ARCHITECTURE.md)                              |
| Déploiement HTTPS                                           | ✅     | Railway ([`DEPLOIEMENT.md`](DEPLOIEMENT.md))                      |
| Authentification                                            | ✅     | Discord, GitHub, pseudo (`src/auth.ts`)                           |
| Base de données et migrations                               | ✅     | Neon, `prisma/migrations/`                                        |
| Salle créée, rejointe par code, liste en temps réel         | ✅     | `src/app/salle/`, `src/lib/race/engine.ts`, `server.ts`           |
| Sélecteurs de langue et de thème                            | ✅     | `src/components/LangToggle.tsx`, `src/components/ThemeToggle.tsx` |
| Identité visuelle appliquée                                 | ✅     | `src/components/Logo.tsx`, `src/app/globals.css`, `src/fonts/`    |
| Intégration continue et tests unitaires                     | ✅     | `.github/workflows/ci.yml`, `src/**/*.test.ts`                    |

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

| ID     | Exigence                                        | Statut | Où                                                | Vérification                       |
| ------ | ----------------------------------------------- | ------ | ------------------------------------------------- | ---------------------------------- |
| ROOM-1 | Publique, semi-publique (code), privée (lien)   | 🟡     | `src/app/salles/`, `src/app/salle/actions.ts`     | Publique et code : test navigateur |
| ROOM-2 | Minimum 2 joueurs pour partir                   | 🟡     | `src/lib/race/engine.ts` (`startBlocker`)         | `engine.test.ts`                   |
| ROOM-3 | Délai pour les retardataires + compte à rebours | ⏳     | Prévu dans la machine à états (`ARCHITECTURE.md`) | —                                  |
| ROOM-4 | Copier-coller désactivé                         | ⏳     | Avec la zone de frappe de la course               | —                                  |
| ROOM-5 | L'organisateur retire un participant            | ✅     | `src/lib/race/engine.ts` (`kick`), `server.ts`    | `engine.test.ts`, test navigateur  |
| ROOM-6 | Mode spectateur                                 | ⏳     | —                                                 | —                                  |

## Course

| ID     | Exigence                                         | Statut | Où                       | Vérification |
| ------ | ------------------------------------------------ | ------ | ------------------------ | ------------ |
| RACE-1 | Tous tapent en même temps, rang et WPM en direct | ⏳     | Voir la section Sprint 1 | —            |
| RACE-2 | Progression gardée à la déconnexion              | ⏳     | Voir la section Sprint 1 | —            |
| RACE-3 | Abandon, classé dernier                          | ⏳     | Voir la section Sprint 1 | —            |
| RACE-4 | Bonne lettre obligatoire pour avancer            | ⏳     | Voir la section Sprint 1 | —            |
| RACE-5 | Anti-triche : spam clavier pénalisé              | ⏳     | Voir la section Sprint 1 | —            |
| RACE-6 | Podium, statistiques, relancer ou fermer         | ⏳     | Voir la section Sprint 1 | —            |

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

| ID     | Exigence                                         | Statut | Où                                                                            | Vérification                |
| ------ | ------------------------------------------------ | ------ | ----------------------------------------------------------------------------- | --------------------------- |
| TECH-1 | React, Next.js, TypeScript, Tailwind, PostgreSQL | ✅     | `package.json`, `prisma/schema.prisma`                                        | CI (build)                  |
| TECH-2 | HTTPS, dépôt Git public                          | ✅     | Railway (`Dockerfile`, `railway.json`), Neon, github.com/blanchejose/fastclap | `/api/health` en production |
| TECH-3 | Tests unitaires et documentation                 | 🟡     | `src/**/*.test.ts`, `docs/`                                                   | `npm test` dans la CI       |

## Qualité du code

- **CI** (`.github/workflows/ci.yml`) à chaque push : formatage Prettier, ESLint,
  TypeScript, tests Vitest, build de production.
- **Tests unitaires** : 15 tests (salle d'attente, code de salle, pseudo, jeton
  temps réel).
- **Accessibilité** : lien d'évitement, focus visible, cibles de 44 px minimum,
  erreurs liées aux champs, animations coupées si « Réduire les animations ».

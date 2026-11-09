# Exigences — matrice de traçabilité

Ce document répond à la section 8 de l'énoncé (livrable 5). Il a deux parties :

1. **La matrice** : chaque exigence de l'énoncé, son statut, les fichiers
   principaux qui la réalisent et les tests qui la vérifient.
2. **Les choix documentés** : quand une exigence était ambiguë ou incomplète,
   le choix retenu et sa raison (section 2.2 de l'énoncé). La colonne « Notes
   et choix » de la matrice renvoie vers ces explications.

## 1. Matrice

**Statuts.** _complet_ : l'exigence est entièrement réalisée et vérifiée ;
_partiel_ : réalisée en partie, la note dit ce qui manque ; _non fait_. Les 90
exigences sont au statut _complet_.

**Tests associés.**

- **Unitaire** : test Vitest (`npm test`), fichier `*.test.ts` à côté du code.
- **E2E** : test Playwright (`npm run test:e2e`), dossier `e2e/`, exécuté par
  la CI sur le build de production avec PostgreSQL.
- **axe** : audit d'accessibilité automatique dans `e2e/a11y.spec.ts`
  (WCAG 2.1 AA, thèmes clair et sombre).
- **Manuel** : vérifié à la main (navigateur, revue du code, production).

### 3. Contraintes techniques

| ID      | Statut  | Fichiers principaux                                                                                                                       | Tests associés                                       | Notes et choix                                                               |
| ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| TECH-01 | complet | `package.json` (Next 16), `src/app/`                                                                                                      | CI (build)                                           | Next.js (App Router) avec React                                              |
| TECH-02 | complet | `tsconfig.json` (`strict: true`), règle `@typescript-eslint/no-explicit-any` en erreur (`eslint-config-next`), aucun fichier `.js`/`.jsx` | CI (`npm run lint`, `npm run typecheck`)             | TypeScript à 100 %, `strict`, pas de `any` explicite, pas de `@ts-ignore`    |
| TECH-03 | complet | `src/app/globals.css` (Tailwind 4, thème FastClap)                                                                                        | Manuel                                               | Tailwind CSS                                                                 |
| TECH-04 | complet | `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`, `prisma/seed-demo.ts`                                                     | CI e2e (`db:deploy`, `db:seed`) ; E2E `demo.spec.ts` | PostgreSQL + ORM, migrations versionnées, seed (textes, comptes, historique) |
| TECH-05 | complet | Railway (conteneur Docker toujours allumé), `Dockerfile`, `railway.json`, [`DEPLOIEMENT.md`](DEPLOIEMENT.md)                              | Manuel (`/api/health` en production)                 | Déploiement sur un serveur, HTTPS public                                     |
| TECH-06 | complet | Socket.IO : `server.ts`, `src/lib/race/engine.ts`, `src/components/RoomLive.tsx`                                                          | E2E `course.spec.ts`                                 | Progression en temps réel                                                    |
| TECH-07 | complet | Zod : `src/lib/race/messages.ts` (temps réel), `src/lib/race/config.ts`, `src/app/*/actions.ts`, `src/auth.ts`, `src/app/api/*/route.ts`  | Unitaire `messages.test.ts`                          | Entrées serveur validées par schéma (actions, routes API, temps réel)        |
| TECH-08 | complet | Railway (serveur), Neon (PostgreSQL, forfait gratuit) ; photos gardées en base, sans service externe                                      | Manuel                                               | Coûts : seul le serveur est payant — choix : [voir plus bas](#profil)        |
| TECH-09 | complet | `.github/workflows/ci.yml` (job `check`, plus job `e2e`)                                                                                  | GitHub Actions                                       | CI à chaque push : lint, `tsc --noEmit`, tests unitaires                     |
| TECH-10 | complet | `.env.example`, `.gitignore` (`.env`) ; secret de la CI généré à chaque exécution                                                         | Manuel                                               | `.env.example` documente toutes les variables, aucun secret commité          |

### 4. Identité visuelle et design

| ID     | Statut  | Fichiers principaux                                                                             | Tests associés             | Notes et choix                                                       |
| ------ | ------- | ----------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| DES-01 | complet | [`DEMARCHE-CREATIVE.md`](DEMARCHE-CREATIVE.md)                                                  | Manuel                     | Nom trouvé sans IA, démarche documentée                              |
| DES-02 | complet | [`DEMARCHE-CREATIVE.md`](DEMARCHE-CREATIVE.md), `src/components/Logo.tsx`, `src/app/icon.svg`   | Manuel                     | Logo conçu sans IA, croquis, utilisé dans l'app et comme favicon     |
| DES-03 | complet | [`DEMARCHE-CREATIVE.md`](DEMARCHE-CREATIVE.md), `docs/images/`                                  | Manuel                     | Direction artistique : moodboard, palette, typographies              |
| DES-04 | complet | `src/components/race/Track.tsx` (couloirs, coureurs, ligne à damier), `RaceDemo.tsx`            | Manuel                     | Design unique ; la piste est un élément signature                    |
| DES-05 | complet | `ThemeToggle.tsx`, script dans `src/app/layout.tsx` (appliqué avant l'affichage), `globals.css` | axe (deux thèmes) ; Manuel | Thèmes clair et sombre, préférence système, sans flash               |
| DES-06 | complet | Mise en page Tailwind, `TypingZone.tsx` (masquée sur mobile), `RoomLive.tsx`                    | E2E `mobile.spec.ts`       | Utilisable à 360 px ; message « clavier physique » pendant la course |

### 5.2 Comptes et profil

| ID      | Statut  | Fichiers principaux                                                                   | Tests associés                                                  | Notes et choix                                                                                                        |
| ------- | ------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| AUTH-01 | complet | `src/auth.ts`, `src/app/connexion/`                                                   | E2E (connexion par mot de passe) ; Manuel (OAuth en production) | OAuth Discord et GitHub ; nom d'utilisateur + mot de passe                                                            |
| AUTH-02 | complet | `src/lib/guest-token.ts`, `joinAsGuest` (`src/app/salle/actions.ts`), `GuestForm.tsx` | Unitaire `guest-token.test.ts` ; E2E `salles.spec.ts`           | Invité : pseudo de 3 à 20 caractères, cookie signé — choix : [voir plus bas](#salles-et-comptes)                      |
| AUTH-03 | complet | `createRoom` (session exigée), `record.ts` (pas de lien au compte), `Avatar.tsx`      | Unitaire `record.test.ts` ; E2E `salles.spec.ts`                | Invité : pas de création de salle, pas d'historique, avatar généré — choix : [voir plus bas](#salles-et-comptes)      |
| AUTH-04 | complet | `src/lib/avatar.ts`, `src/app/profil/actions.ts`, `/api/avatar/[id]`                  | Unitaire `avatar.test.ts` ; Manuel                              | Photo de profil JPEG/PNG/WebP, 2 Mo, redimensionnée — choix : [voir plus bas](#profil)                                |
| AUTH-05 | complet | `src/lib/display-name.ts`, `updateDisplayName`                                        | Unitaire `avatar.test.ts` ; Manuel                              | Modifier son pseudonyme d'affichage — choix : [voir plus bas](#profil)                                                |
| AUTH-06 | complet | `src/lib/profile.ts`, `src/app/profil/page.tsx`, `ProgressChart.tsx`                  | Unitaire `profile.test.ts` ; E2E `demo.spec.ts`                 | Profil : meilleur MPM, MPM moyen, précision moyenne, courses, victoires, graphique — choix : [voir plus bas](#profil) |

### 5.3 Salles et visibilité

| ID       | Statut  | Fichiers principaux                                                                       | Tests associés                                                              | Notes et choix                                                                                                                                      |
| -------- | ------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| SALLE-01 | complet | `createRoom`, `engine.ts` (`setRole`), `WaitingRoom.tsx`                                  | Unitaire `engine.test.ts` ; E2E                                             | Un utilisateur connecté crée une salle ; l'hôte court ou regarde                                                                                    |
| SALLE-02 | complet | `src/lib/room-code.ts`, contrainte unique sur `Room.code`                                 | Unitaire `room-code.test.ts`                                                | Code unique de 6 caractères sans caractères ambigus                                                                                                 |
| SALLE-03 | complet | `config.ts`, `joinByCode`, `server.ts` (`room:join`), `explorer.ts`                       | Unitaire `explorer.test.ts` ; E2E `salles.spec.ts`                          | Visibilités publique, sur code, privée                                                                                                              |
| SALLE-04 | complet | `src/lib/invite-rules.ts`, `src/lib/invites.ts`, `/invitation/[token]`, `InvitePanel.tsx` | Unitaire `invite-rules.test.ts`, `client-ip.test.ts` ; E2E `salles.spec.ts` | Liens d'invitation : un par invité, jeton ≥ 128 bits, liés à l'IP, révoqués, invalides à la fermeture — choix : [voir plus bas](#salles-et-comptes) |
| SALLE-05 | complet | `config.ts` (`LIMITS`), `engine.ts` (`players`, `updateConfig`)                           | Unitaire `engine.test.ts`, `messages.test.ts`                               | Capacité de 2 à 30, spectateurs non comptés                                                                                                         |
| SALLE-06 | complet | Table `RoomPresence` (clé primaire `personId`), `src/lib/presence.ts`, `leaveOther`       | Unitaire `presence.test.ts`, `engine.test.ts` ; Manuel (contrainte SQL)     | Une seule salle à la fois, garanti en base ; proposer de quitter ; pas de doublon par onglet — choix : [voir plus bas](#salles-et-comptes)          |
| SALLE-07 | complet | `engine.ts` (`kick`), `server.ts` (révocation du lien)                                    | Unitaire `engine.test.ts`                                                   | Expulsion définitive                                                                                                                                |
| SALLE-08 | complet | `engine.ts` (`transferHost`)                                                              | Unitaire `engine.test.ts`                                                   | Transfert d'hôte au plus ancien humain connecté, sinon fermeture — choix : [voir plus bas](#salles-et-comptes)                                      |
| SALLE-09 | complet | `engine.ts` (`join`)                                                                      | Unitaire `engine.test.ts`                                                   | Entrer seulement en attente ou aux résultats — choix : [voir plus bas](#salles-et-comptes)                                                          |
| SALLE-10 | complet | `src/lib/rate-limit.ts`, `joinByCode`, page de salle, `room:join`                         | Unitaire `rate-limit.test.ts` ; Manuel                                      | Limite de tentatives de code par IP (10 par minute) — choix : [voir plus bas](#salles-et-comptes)                                                   |

### 5.4 Rejoindre une course

| ID      | Statut  | Fichiers principaux                                       | Tests associés                                     | Notes et choix                                                                                                                                              |
| ------- | ------- | --------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JOIN-01 | complet | `RoomCodeForm.tsx`, `joinByCode`                          | E2E `salles.spec.ts`, `a11y.spec.ts`               | Rejoindre par code dès l'accueil                                                                                                                            |
| JOIN-02 | complet | `src/lib/explorer.ts`, `/api/salles`, `LiveRooms.tsx`     | Unitaire `explorer.test.ts` ; E2E `salles.spec.ts` | Explorateur : participants/capacité, langue, complexité, hôte, état ; filtres ; mise à jour sans recharger — choix : [voir plus bas](#rejoindre-une-course) |
| JOIN-03 | complet | `pickQuickRoom`, `src/app/go/page.tsx`, `createQuickRoom` | Unitaire `explorer.test.ts` ; E2E `salles.spec.ts` | « Faire une course » : salle la plus proche de sa capacité ; états vides (compte, invité) — choix : [voir plus bas](#rejoindre-une-course)                  |

### 5.5 Configuration de la course

| ID      | Statut  | Fichiers principaux                                                                | Tests associés                                   | Notes et choix                                                                                                                   |
| ------- | ------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| CONF-01 | complet | `config.ts`, `engine.ts` (`deadline`), `ConfigPanel.tsx`                           | Unitaire `engine.test.ts`, `messages.test.ts`    | Temps maximal : aucun, ou 30 s à 10 min                                                                                          |
| CONF-02 | complet | `config.ts`, `room-store.ts` (`pickText`)                                          | Unitaire `generate.test.ts`                      | Langue du texte FR ou EN                                                                                                         |
| CONF-03 | complet | `src/lib/text/generate.ts`, `words-fr.ts`, `words-en.ts`, `prisma/seed.ts`         | Unitaire `generate.test.ts`                      | Texte cohérent (corpus en base) ou aléatoire (dictionnaire)                                                                      |
| CONF-04 | complet | `generateRandomText`, `composeCoherent`                                            | Unitaire `generate.test.ts`                      | Longueur en mots — choix : [voir plus bas](#configuration-de-la-course)                                                          |
| CONF-05 | complet | `RANDOM_TIERS`, `classifyText` ; critères dans [la section 2](#2-choix-documentés) | Unitaire `generate.test.ts`                      | Complexité facile/moyen/difficile, critères mesurables documentés — choix : [voir plus bas](#configuration-de-la-course)         |
| CONF-06 | complet | `generateRandomText`, `adaptPassage`                                               | Unitaire `generate.test.ts`                      | Ponctuation, nombres, majuscules, accents — choix : [voir plus bas](#configuration-de-la-course)                                 |
| CONF-07 | complet | `wordPool`, `generateRandomText`                                                   | Unitaire `generate.test.ts`                      | Caractères à inclure ou exclure (comportement en mode cohérent documenté) — choix : [voir plus bas](#configuration-de-la-course) |
| CONF-08 | complet | `src/lib/race/typing.ts`, `bots.ts`                                                | Unitaire `typing.test.ts`, `bots.test.ts`        | Correction obligatoire ou mode libre                                                                                             |
| CONF-09 | complet | `config.ts`, `engine.ts` (`tick`)                                                  | Unitaire `bonus.test.ts` ; E2E `course.spec.ts`  | Bonus activés ou non                                                                                                             |
| CONF-10 | complet | `engine.ts` (`addBot`, `removeBot`), `WaitingRoom.tsx`                             | Unitaire `engine.test.ts` ; E2E                  | Ajout et retrait de bots avec leur niveau                                                                                        |
| CONF-11 | complet | `config.ts`, `ConfigPanel.tsx`                                                     | Unitaire `engine.test.ts` ; E2E `salles.spec.ts` | Visibilité et capacité                                                                                                           |
| CONF-12 | complet | `server.ts` (`room:config`, diffusion), `ConfigPanel.tsx` (résumé)                 | Manuel                                           | Configuration visible en direct par tous                                                                                         |

### 5.6 Déroulement d'une course

| ID        | Statut  | Fichiers principaux                                                            | Tests associés                                           | Notes et choix                                                                              |
| --------- | ------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| COURSE-01 | complet | `src/lib/race/engine.ts` ; diagramme dans [`ARCHITECTURE.md`](ARCHITECTURE.md) | Unitaire `engine.test.ts`                                | Machine à états documentée — choix : [voir plus bas](#course)                               |
| COURSE-02 | complet | `engine.ts` (`startBlocker`)                                                   | Unitaire `engine.test.ts` ; E2E `course.spec.ts`         | ≥ 2 participants dont ≥ 1 humain (bots oui, spectateurs non)                                |
| COURSE-03 | complet | `engine.ts` (`startRace`), `server.ts` (`race:text`), `Countdown.tsx`          | Unitaire `engine.test.ts` ; E2E `course.spec.ts`         | Décompte synchronisé ; texte révélé au début du décompte                                    |
| COURSE-04 | complet | `TypingZone.tsx`, `src/lib/race/input.ts`, `RoomLive.tsx`                      | Unitaire `input.test.ts` ; E2E `course.spec.ts` (coller) | Retour visuel immédiat, MPM et précision en direct, coller désactivé                        |
| COURSE-05 | complet | `src/components/race/Track.tsx` (interpolation CSS, 10 mises à jour/s)         | E2E ; Manuel (spectateur)                                | Piste : avatar, nom, position, MPM ; fluide ; joueur local mis en évidence ; vue spectateur |
| COURSE-06 | complet | `engine.ts` (`applyKeys` : lots, vitesse), `server.ts`                         | Unitaire `engine.test.ts`                                | Serveur autoritaire ; rejet des progressions impossibles — choix : [voir plus bas](#course) |
| COURSE-07 | complet | `ConfirmButton.tsx`, `engine.ts` (`abandon`)                                   | Unitaire `engine.test.ts` ; Manuel                       | Abandon avec confirmation                                                                   |
| COURSE-08 | complet | `engine.ts` (`disconnect`, `tick`), `server.ts` (`race:resync`)                | Unitaire `engine.test.ts` ; Manuel (rechargement)        | Reprise dans les 30 s, sinon abandon — choix : [voir plus bas](#course)                     |
| COURSE-09 | complet | `engine.ts` (`tick`)                                                           | Unitaire `engine.test.ts`                                | Fin quand tous ont fini ou abandonné, ou temps écoulé                                       |
| COURSE-10 | complet | `engine.ts` (`ranking`)                                                        | Unitaire `engine.test.ts`                                | Classement : arrivés, puis temps écoulé, puis abandons                                      |
| COURSE-11 | complet | `engine.ts` (`backToLobby`, `close`), `RoomLive.tsx`                           | Unitaire `engine.test.ts` ; Manuel                       | Aux résultats, l'hôte relance ou ferme — choix : [voir plus bas](#course)                   |

### 5.7 Bots

| ID     | Statut  | Fichiers principaux                                                                         | Tests associés                                    | Notes et choix                                                     |
| ------ | ------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| BOT-01 | complet | `src/lib/race/bots.ts` (`BOT_PROFILES`) ; valeurs dans [`ARCHITECTURE.md`](ARCHITECTURE.md) | Unitaire `bots.test.ts` (MPM moyen dans la plage) | Cinq niveaux, valeurs documentées — choix : [voir plus bas](#bots) |
| BOT-02 | complet | `bots.ts` (`delayFor`)                                                                      | Unitaire `bots.test.ts`                           | Vitesse variable (accélérations, hésitations, mots difficiles)     |
| BOT-03 | complet | `bots.ts` (`stepBot`)                                                                       | Unitaire `bots.test.ts`                           | Fautes qui ralentissent ; respect du mode d'erreur                 |
| BOT-04 | complet | Étiquette « BOT » (`Track.tsx`, `Results.tsx`), `applyBonuses`                              | Unitaire `bonus.test.ts` ; E2E                    | Bots identifiés ; soumis aux bonus et malus                        |
| BOT-05 | complet | `src/lib/race/random.ts`, `bots.ts`                                                         | Unitaire `bots.test.ts`                           | Moteur déterministe à partir d'une graine                          |

### 5.8 Bonus de remontée

| ID       | Statut  | Fichiers principaux                                         | Tests associés                    | Notes et choix                                                                                                       |
| -------- | ------- | ----------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| BONUS-01 | complet | `src/lib/race/bonus.ts` (`applyBonuses`, `behindRacers`)    | Unitaire `bonus.test.ts`          | Bonus aux joueurs en retard à 25/50/75 %, 3 au plus ; règle documentée — choix : [voir plus bas](#bonus-de-remontée) |
| BONUS-02 | complet | `bonus.ts` (−3 mots, +3 mots, brouillard), `TypingZone.tsx` | Unitaire `bonus.test.ts` ; Manuel | Au moins 3 types : aide au retardataire, frein au meneur — choix : [voir plus bas](#bonus-de-remontée)               |
| BONUS-03 | complet | `BonusFeed.tsx`, `Track.tsx`                                | Manuel                            | Annonce sur la piste et chez le joueur ciblé                                                                         |
| BONUS-04 | complet | Texte propre à chaque coureur (`Racer.text`), `race:mytext` | Unitaire `bonus.test.ts`          | Progression et MPM cohérents avec un texte modifié — choix : [voir plus bas](#bonus-de-remontée)                     |

### 5.9 Résultats et statistiques

| ID     | Statut  | Fichiers principaux                                         | Tests associés                                   | Notes et choix                                                                                           |
| ------ | ------- | ----------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| RES-01 | complet | `src/components/race/Results.tsx`                           | E2E `course.spec.ts`                             | Podium des 3 premiers                                                                                    |
| RES-02 | complet | `Results.tsx`                                               | E2E `course.spec.ts`                             | Tableau complet (rang, MPM, brut, précision, fautes, temps, statut, bonus)                               |
| RES-03 | complet | `WpmChart.tsx`, `KeyHeatmap.tsx`                            | E2E `course.spec.ts` ; Manuel (thèmes)           | Courbe du MPM de tous ; touches les plus manquées — choix : [voir plus bas](#résultats-et-historique)    |
| RES-04 | complet | `src/lib/race/record.ts` (`isNewRecord`), `results.ts`      | Unitaire `record.test.ts` ; E2E `course.spec.ts` | Indicateur de record personnel — choix : [voir plus bas](#résultats-et-historique)                       |
| RES-05 | complet | `record.ts`, `src/lib/results.ts`, migration `race_results` | Unitaire `record.test.ts` ; E2E (historique)     | Résultats persistés, avec la série temporelle du MPM — choix : [voir plus bas](#résultats-et-historique) |

### 5.10 Historique

| ID      | Statut  | Fichiers principaux                                 | Tests associés                                    | Notes et choix                                                                                                  |
| ------- | ------- | --------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| HIST-01 | complet | `src/app/historique/page.tsx`, `src/lib/history.ts` | Unitaire `history.test.ts` ; E2E `demo.spec.ts`   | Historique paginé de l'utilisateur connecté — choix : [voir plus bas](#résultats-et-historique)                 |
| HIST-02 | complet | `src/app/course/[id]/page.tsx`, `getRaceForUser`    | Unitaire `history.test.ts` ; E2E `course.spec.ts` | Une course de l'historique réaffiche ses résultats complets — choix : [voir plus bas](#résultats-et-historique) |

### 5.11 Internationalisation

| ID      | Statut  | Fichiers principaux                                                                                                       | Tests associés                        | Notes et choix                                                               |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| I18N-01 | complet | `src/i18n/dictionaries.ts` (le type anglais doit avoir toutes les clés du français), pages `not-found.tsx` et `error.tsx` | CI (`typecheck`) ; E2E `demo.spec.ts` | Tous les textes en FR et EN, y compris erreurs, états vides, métadonnées     |
| I18N-02 | complet | `LangToggle.tsx` (en-tête commun), cookie `locale`, `src/i18n/server.ts` (`Accept-Language`)                              | E2E `demo.spec.ts`                    | Sélecteur sur toutes les pages, choix gardé, langue du navigateur par défaut |
| I18N-03 | complet | `Intl.DateTimeFormat`, `Intl.NumberFormat` (fr-CA, en-CA), `ordinal`                                                      | Manuel ; E2E (« 1re sur 2 »)          | Dates et nombres selon la langue                                             |

### 6. Qualité

| ID      | Statut  | Fichiers principaux                                                                                             | Tests associés                            | Notes et choix                                                                             |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| TEST-01 | complet | 146 tests, `src/**/*.test.ts`                                                                                   | CI                                        | Tests unitaires sur la logique                                                             |
| TEST-02 | complet | `e2e/`, `playwright.config.ts`                                                                                  | CI (job `e2e`)                            | Tests de bout en bout avec Playwright                                                      |
| TEST-03 | complet | `e2e/helpers.ts` (`loginWithPassword`)                                                                          | CI                                        | E2E par nom d'utilisateur et mot de passe, pas OAuth                                       |
| PERF-01 | complet | Ordinateur : 100/100/100/100 ; mobile : 98/100/100/100 (build de production)                                    | Manuel (Lighthouse 12)                    | Lighthouse ≥ 90 partout sur l'accueil                                                      |
| PERF-02 | complet | Lots de touches toutes les 100 ms (`RoomLive.tsx`), limite côté serveur, une écriture par course (`results.ts`) | Unitaire `engine.test.ts` ; revue du code | Mises à jour regroupées ; pas d'écriture en base à chaque frappe                           |
| PERF-03 | complet | Couloirs fixes, animation par `transform` (`Track.tsx`)                                                         | Manuel (57 images/s à 30 coureurs)        | Piste fluide à 30 participants                                                             |
| A11Y-01 | complet | Couleurs de `globals.css` ; palette des graphiques validée                                                      | axe (clair et sombre)                     | Contraste WCAG AA dans les deux thèmes                                                     |
| A11Y-02 | complet | Composants, tableaux des résultats et de l'historique                                                           | axe ; Lighthouse                          | Bonnes balises (`button`, `a`, titres, `header`/`nav`/`main`/`footer`, `table`)            |
| A11Y-03 | complet | `Avatar.tsx` (décoratif, nom à côté), formulaires avec `label`                                                  | axe                                       | Texte alternatif des images, libellés des champs                                           |
| A11Y-04 | complet | `:focus-visible` dans `globals.css`, lien d'évitement                                                           | E2E `a11y.spec.ts`                        | Navigation au clavier, focus visible                                                       |
| SEC-01  | complet | `engine.ts` (lancer, configurer, expulser, fermer, bots), `server.ts` (liens d'invitation)                      | Unitaire `engine.test.ts`                 | Actions de l'hôte autorisées côté serveur                                                  |
| SEC-02  | complet | `checkAvatar` (signatures de fichier), `photoSchema`                                                            | Unitaire `avatar.test.ts`                 | Téléversement validé côté serveur : type réel et taille — choix : [voir plus bas](#profil) |
| SEC-03  | complet | `src/auth.ts` (`bcryptjs`, coût 10), `prisma/seed-demo.ts`                                                      | Revue du code                             | Mots de passe hachés (bcrypt), jamais stockés ni journalisés en clair                      |

## 2. Choix documentés

### Course

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
- **Absence.** Le délai de 30 s de COURSE-08 s'applique aussi en salle
  d'attente : une personne partie depuis 30 s est retirée de la salle, et si
  c'était l'hôte, le rôle passe au plus ancien humain connecté (SALLE-08).
- **Choix du texte.** Le texte est tiré au hasard parmi ceux du niveau de la
  salle. Une salle passe par tous les textes de son niveau avant d'en reprendre
  un, et ne court jamais deux fois de suite le même texte.

La machine à états (COURSE-01) est décrite dans
[`ARCHITECTURE.md`](ARCHITECTURE.md), section 2.

### Salles et comptes

- **Salle pleine.** Une personne qui entre dans une salle pleine y entre comme
  spectatrice (les spectateurs ne comptent pas dans la capacité).
- **Rôle.** Chaque personne humaine (pas seulement l'hôte) choisit entre « Je
  cours » et « Je regarde » dans la salle d'attente.

Légende : ✅ fait · 🟡 en partie · ⏳ à faire (livraison finale)

- **Invités (AUTH-02).** Le cookie `fastclap_invite` contient un identifiant
  aléatoire (128 bits) et le pseudo, signés avec `AUTH_SECRET` (HMAC-SHA256) ;
  il dure 30 jours, en `httpOnly` et `SameSite=Lax`. Un invité qui change de
  pseudo garde le même identifiant. Le pseudo suit les mêmes règles qu'un nom
  d'utilisateur ; il n'a pas à être unique, et l'interface affiche « invité » à
  côté pour éviter la confusion avec un compte.
- **Hôte et invités (SALLE-08).** « La personne humaine connectée » est
  comprise comme un utilisateur avec un compte : un invité ne peut pas créer de
  salle (AUTH-03), il ne devient donc jamais hôte. S'il ne reste que des
  invités, la salle est fermée.
- **Liens d'invitation (SALLE-04).** Le jeton fait 256 bits (32 octets
  aléatoires en base64url). À la première ouverture, le lien est lié à la
  personne (compte ou invité) et à son adresse IP. Ensuite, il ne marche que
  pour cette personne depuis la même adresse : une autre adresse est refusée,
  et une autre personne derrière la même adresse (même réseau d'école) aussi.
  La liaison se fait par une mise à jour conditionnelle en base : deux personnes
  qui ouvrent le lien en même temps ne peuvent pas l'obtenir toutes les deux.
- **Adresse IP.** Derrière le proxy de Railway, l'adresse arrive dans un
  en-tête. On ne le croit que si la variable `TRUST_PROXY_HEADER` le nomme
  (`x-real-ip` sur Railway) ; sinon, c'est l'adresse de la connexion.
  `server.ts` calcule l'adresse et remplace l'en-tête interne `x-fastclap-ip`,
  pour qu'un visiteur ne puisse pas l'inventer.
- **Salle privée.** Le serveur temps réel décide qui entre : l'hôte, les
  personnes déjà dans la salle (reconnexion, ou salle devenue privée après leur
  arrivée) et celles qui ont un lien valide. Sans lien, la page affiche un
  message au lieu du formulaire d'invité, et le formulaire de code de l'accueil
  explique que la salle est privée.
- **Une salle à la fois (SALLE-06).** La table `RoomPresence` a une ligne au
  plus par personne (compte ou invité) : sa clé primaire est l'identifiant de
  la personne, donc PostgreSQL refuse une deuxième ligne, même si deux onglets
  essaient en même temps. Les spectateurs comptent aussi. La présence est
  libérée quand la personne quitte, est expulsée, reste absente plus de 30 s
  ou quand la salle ferme. Les salles vivant en mémoire, le serveur efface
  toutes les présences à son démarrage. Si une présence pointe vers une salle
  où la personne n'est plus (reste d'un arrêt brutal), elle est remplacée.
- **Limite d'essais (SALLE-10).** On compte les essais **ratés** (code mal
  formé, salle introuvable ou fermée) par adresse IP : sur le formulaire de
  l'accueil, à l'adresse `/salle/CODE` et par le serveur temps réel. Après 10
  essais en une minute, plus aucun code ne s'ouvre depuis cette adresse
  jusqu'à la fin de la fenêtre glissante, même un bon code, pour ne rien
  révéler. Une personne déjà dans une salle peut toujours s'y reconnecter. Le
  compteur est en mémoire, partagé entre Next.js et Socket.IO par `globalThis`
  (un seul serveur). Limite connue : toute une classe derrière la même adresse
  partage le compteur.

### Configuration de la course

- **Options en mode cohérent (CONF-06).** On ne peut pas ajouter de ponctuation
  ou de nombres à un vrai passage. Une option désactivée retire donc ce qu'elle
  concerne : ponctuation (sauf les apostrophes et les traits d'union dans les
  mots), majuscules (tout en minuscules), accents (lettres sans accent, œ → oe).
  Sans nombres, les passages qui n'en contiennent pas sont choisis en premier.
- **Caractères à inclure ou à exclure (CONF-07).** Réglage du texte aléatoire
  seulement : en mode cohérent, il est désactivé, pour ne pas abîmer les vrais
  passages. Exclure : aucun mot ni signe ajouté ne contient ces caractères.
  Inclure : seuls les mots qui contiennent au moins un de ces caractères sont
  gardés. Si un filtre laisse moins de 5 mots, il est ignoré pour que la course
  reste possible.
- **Longueur en mode cohérent (CONF-04).** Les passages du niveau choisi sont
  enchaînés (ceux pas encore courus d'abord) jusqu'à la longueur demandée, puis
  le texte est coupé au bon nombre de mots. Si le niveau ne suffit pas, on
  complète avec les passages des autres niveaux de la même langue.
- **Quand changer la configuration.** Dans la salle d'attente seulement. Sur
  l'écran des résultats, « Nouvelle course » ramène en salle d'attente, où l'hôte
  modifie la configuration avant de relancer (COURSE-11).
- **Capacité.** Elle ne peut pas descendre sous le nombre actuel de participants.

La configuration est gardée en base (colonnes de `Room`) : elle survit à un
redémarrage du serveur.

#### Critères de complexité (CONF-05)

**Texte aléatoire.** Les dictionnaires sont classés du mot le plus fréquent au
moins fréquent.

| Complexité | Mots permis                                                                                     | Nombres (option) |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| Facile     | Les 150 mots les plus fréquents, de 5 lettres au plus                                           | 1 à 99           |
| Moyen      | Tous les mots fréquents, de 8 lettres au plus                                                   | 1 à 999          |
| Difficile  | Tous les mots fréquents et une liste de mots rares et longs ; ponctuation plus variée (! ? ; :) | 1 à 9999         |

**Texte cohérent.** Chaque passage reçoit un score calculé par `textScore` :
longueur moyenne des mots (en lettres) + 10 × proportion de caractères
spéciaux (majuscules, chiffres, ponctuation, lettres accentuées) parmi les
caractères non blancs. Facile : score < 5 ; moyen : 5 à 6 ; difficile : ≥ 6.
Le seed recalcule ce classement à chaque déploiement.

### Bots

Les valeurs des cinq niveaux (BOT-01 : MPM visé, taux d'erreur) et le
comportement des bots (variations, hésitations, fautes, graine) sont décrits
dans [`ARCHITECTURE.md`](ARCHITECTURE.md), section 4.

### Bonus de remontée

- **Règle des bonus (BONUS-01).** La progression d'un coureur est la part de
  **son** texte déjà tapée. Le meneur est le coureur le plus avancé, arrivés
  compris. Les points de contrôle sont atteints quand il passe 25 %, 50 % et
  75 % ; chacun ne compte qu'une fois par course (s'il en passe deux d'un coup,
  les deux sont distribués). À chaque point, est « en retard » tout coureur
  encore en course, autre que le meneur, qui est soit le moins avancé, soit à
  25 points de pourcentage ou plus derrière le meneur. Chacun reçoit un bonus,
  tant qu'il en a reçu moins de 3 dans la course.
- **Types de bonus (BONUS-02).** Le type est tiré au hasard, avec une graine
  propre à la course (testable). −3 mots : les 3 derniers mots du texte du
  joueur en retard disparaissent, sans jamais toucher à ce qu'il a déjà tapé ;
  s'il avait déjà tapé tout le reste, il arrive. +3 mots : 3 mots tirés du texte
  de la course sont ajoutés au texte du meneur. Brouillard : la fin du mot en
  cours et les 3 mots suivants du meneur sont flous pendant 5 s. Le meneur ne
  subit qu'un +3 mots et un brouillard par point de contrôle (sinon, à 30
  joueurs, il en recevrait des dizaines) : un tirage en trop devient −3 mots.
  Si le meneur est déjà arrivé, seuls des −3 mots sont distribués.
- **Cohérence (BONUS-04).** Chaque coureur a son propre texte dans le moteur.
  Le serveur rejoue les touches sur ce texte, calcule la progression sur sa
  longueur et le MPM sur les caractères justes tapés ; il envoie le nouveau
  texte au joueur concerné (`race:mytext`) sans toucher à sa frappe.

### Rejoindre une course

- **Salles montrées (JOIN-02).** Les salles publiques ouvertes où au moins une
  personne est connectée : une salle vide n'a personne pour lancer la course.
  Les données (participants, état, configuration) viennent de la mémoire du
  serveur temps réel, partagée avec Next.js par `globalThis` (un seul serveur).
  Les participants comptent les bots, pas les spectateurs. Une salle en course
  reste visible, avec son état, mais on n'y entre qu'aux résultats (SALLE-09).
- **Mise à jour (JOIN-02).** Le navigateur redemande la liste toutes les 3 s à
  `/api/salles`, avec les filtres de langue et de complexité (validés par Zod).
- **Partie rapide (JOIN-03).** « La plus proche de sa capacité maximale » est
  comprise comme la salle à qui il reste le **moins de places libres**, parmi
  les salles publiques en attente ou aux résultats et pas pleines ; à égalité,
  la plus ancienne. Sans salle libre : un utilisateur connecté voit le message
  et un bouton pour créer une salle publique avec la configuration par défaut ;
  un invité voit le message et un lien vers les salles.

### Résultats et historique

- **Historique (HIST-01, HIST-02).** 10 courses par page, de la plus récente à
  la plus ancienne ; un numéro de page invalide revient à la page 1 ou à la
  dernière. Les abandons y figurent aussi. La page d'une course n'est ouverte
  qu'aux utilisateurs qui l'ont courue (les autres reçoivent une page
  introuvable) ; elle réaffiche le même écran que la fin de course, graphiques
  compris, à partir de la base.

- **Ce qui est gardé (RES-05).** À la fin de chaque course, une seule écriture
  en base (jamais pendant la frappe) : la course (texte, langue, heures) et
  chaque participant, avec son classement, MPM, MPM brut, précision, fautes,
  temps, statut, bonus reçus, courbe du MPM (un point par seconde, plus un point
  final) et fautes par touche attendue. Les invités et les bots sont gardés
  aussi, pour réafficher le tableau complet (HIST-02), mais le résultat n'est
  lié à un compte (donc à un historique) que pour un utilisateur connecté.
- **Record personnel (RES-04).** Un MPM plus haut que le meilleur MPM des
  courses précédentes que la personne a **terminées**. La première course
  terminée est un record. Un abandon ou un temps écoulé n'en est jamais un.
- **Graphiques (RES-03).** Une couleur par coureur, attribuée par couloir (la
  couleur suit la personne, jamais son rang) ; palette catégorielle de 8
  couleurs vérifiée par le script de validation dans les deux thèmes (contraste,
  séparation pour le daltonisme). Au-delà de 8 coureurs, les suivants sont
  gris. Le joueur local a un trait plus épais. Légende, étiquettes en bout de
  ligne (4 coureurs ou moins), infobulle au survol et tableau des données
  (lisible au clavier et au lecteur d'écran). Clavier QWERTY (claviers
  canadiens) en une seule teinte du clair au foncé, avec le nombre de fautes
  écrit sur chaque touche ; les caractères absents du clavier (accents,
  guillemets) ont leur propre rangée.

### Profil

- **Statistiques (AUTH-06).** Le meilleur MPM, le MPM moyen, la précision
  moyenne et la courbe de progression comptent les courses **terminées** (un
  abandon à 0 MPM ne dit rien de la vitesse). Le nombre de courses compte aussi
  les abandons. Une victoire est une 1re place à l'arrivée. La courbe montre les
  50 dernières courses terminées.
- **Pseudonyme (AUTH-05).** Il est gardé à part (`User.name`) : le nom
  d'utilisateur qui sert à se connecter ne change pas, sinon un compte avec mot
  de passe perdrait son identifiant. 3 à 20 caractères : lettres (accents
  compris), chiffres, espaces, apostrophe, tiret et tiret bas ; il n'a pas à
  être unique. Il s'affiche dans le menu, la salle et les résultats des courses
  suivantes (une course passée garde le nom du moment).
- **Photo (AUTH-04, SEC-02).** Le serveur vérifie la taille (2 Mo au plus) et
  le **vrai type** dans les premiers octets du fichier (signatures JPEG, PNG,
  WebP) ; le nom du fichier et le type annoncé par le navigateur sont ignorés.
  L'image est ensuite recadrée en carré de 256 px, convertie en WebP sans
  métadonnées (`sharp`), et gardée en base : le disque du serveur Railway est
  effacé à chaque déploiement, et un service d'images externe ajouterait un
  compte et un coût (TECH-08). Le navigateur vérifie aussi la taille avant
  l'envoi, pour éviter de téléverser une grosse image pour rien.

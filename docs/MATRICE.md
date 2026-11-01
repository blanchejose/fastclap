# Matrice de traçabilité

Chaque exigence de l'énoncé, où elle est réalisée dans le code et comment elle
est vérifiée. Les choix faits quand l'énoncé est ambigu sont expliqués dans
[`EXIGENCES.md`](EXIGENCES.md).

**Légende des vérifications**

- **Unitaire** : test Vitest (`npm test`), fichier `*.test.ts` à côté du code.
- **E2E** : test Playwright (`npm run test:e2e`), dossier `e2e/`, exécuté par
  la CI sur le build de production.
- **axe** : audit d'accessibilité automatique dans `e2e/a11y.spec.ts`
  (WCAG 2.1 AA, thèmes clair et sombre).
- **Manuel** : vérifié à la main (navigateur, revue du code, production).

Statut : ✅ fait.

## 3. Contraintes techniques

| ID      | Exigence                                                                     | Statut | Où                                                                                                                                        | Vérification                                         |
| ------- | ---------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| TECH-01 | Next.js (App Router) avec React                                              | ✅     | `package.json` (Next 16), `src/app/`                                                                                                      | CI (build)                                           |
| TECH-02 | TypeScript à 100 %, `strict`, pas de `any` explicite, pas de `@ts-ignore`    | ✅     | `tsconfig.json` (`strict: true`), règle `@typescript-eslint/no-explicit-any` en erreur (`eslint-config-next`), aucun fichier `.js`/`.jsx` | CI (`npm run lint`, `npm run typecheck`)             |
| TECH-03 | Tailwind CSS                                                                 | ✅     | `src/app/globals.css` (Tailwind 4, thème FastClap)                                                                                        | Manuel                                               |
| TECH-04 | PostgreSQL + ORM, migrations versionnées, seed (textes, comptes, historique) | ✅     | `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`, `prisma/seed-demo.ts`                                                     | CI e2e (`db:deploy`, `db:seed`) ; E2E `demo.spec.ts` |
| TECH-05 | Déploiement sur un serveur, HTTPS public                                     | ✅     | Railway (conteneur Docker toujours allumé), `Dockerfile`, `railway.json`, [`DEPLOIEMENT.md`](DEPLOIEMENT.md)                              | Manuel (`/api/health` en production)                 |
| TECH-06 | Progression en temps réel                                                    | ✅     | Socket.IO : `server.ts`, `src/lib/race/engine.ts`, `src/components/RoomLive.tsx`                                                          | E2E `course.spec.ts`                                 |
| TECH-07 | Entrées serveur validées par schéma (actions, routes API, temps réel)        | ✅     | Zod : `src/lib/race/messages.ts` (temps réel), `src/lib/race/config.ts`, `src/app/*/actions.ts`, `src/auth.ts`, `src/app/api/*/route.ts`  | Unitaire `messages.test.ts`                          |
| TECH-08 | Coûts : seul le serveur est payant                                           | ✅     | Railway (serveur), Neon (PostgreSQL, forfait gratuit) ; photos gardées en base, sans service externe                                      | Manuel                                               |
| TECH-09 | CI à chaque push : lint, `tsc --noEmit`, tests unitaires                     | ✅     | `.github/workflows/ci.yml` (job `check`, plus job `e2e`)                                                                                  | GitHub Actions                                       |
| TECH-10 | `.env.example` documente toutes les variables, aucun secret commité          | ✅     | `.env.example`, `.gitignore` (`.env`) ; secret de la CI généré à chaque exécution                                                         | Manuel                                               |

## 4. Identité visuelle et design

| ID     | Exigence                                                             | Statut | Où                                                                                              | Vérification               |
| ------ | -------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- | -------------------------- |
| DES-01 | Nom trouvé sans IA, démarche documentée                              | ✅     | [`DEMARCHE-CREATIVE.md`](DEMARCHE-CREATIVE.md)                                                  | Manuel                     |
| DES-02 | Logo conçu sans IA, croquis, utilisé dans l'app et comme favicon     | ✅     | [`DEMARCHE-CREATIVE.md`](DEMARCHE-CREATIVE.md), `src/components/Logo.tsx`, `src/app/icon.svg`   | Manuel                     |
| DES-03 | Direction artistique : moodboard, palette, typographies              | ✅     | [`DEMARCHE-CREATIVE.md`](DEMARCHE-CREATIVE.md), `docs/images/`                                  | Manuel                     |
| DES-04 | Design unique ; la piste est un élément signature                    | ✅     | `src/components/race/Track.tsx` (couloirs, coureurs, ligne à damier), `RaceDemo.tsx`            | Manuel                     |
| DES-05 | Thèmes clair et sombre, préférence système, sans flash               | ✅     | `ThemeToggle.tsx`, script dans `src/app/layout.tsx` (appliqué avant l'affichage), `globals.css` | axe (deux thèmes) ; Manuel |
| DES-06 | Utilisable à 360 px ; message « clavier physique » pendant la course | ✅     | Mise en page Tailwind, `TypingZone.tsx` (masquée sur mobile), `RoomLive.tsx`                    | E2E `mobile.spec.ts`       |

## 5.2 Comptes et profil

| ID      | Exigence                                                                           | Statut | Où                                                                                    | Vérification                                                    |
| ------- | ---------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| AUTH-01 | OAuth Discord et GitHub ; nom d'utilisateur + mot de passe                         | ✅     | `src/auth.ts`, `src/app/connexion/`                                                   | E2E (connexion par mot de passe) ; Manuel (OAuth en production) |
| AUTH-02 | Invité : pseudo de 3 à 20 caractères, cookie signé                                 | ✅     | `src/lib/guest-token.ts`, `joinAsGuest` (`src/app/salle/actions.ts`), `GuestForm.tsx` | Unitaire `guest-token.test.ts` ; E2E `salles.spec.ts`           |
| AUTH-03 | Invité : pas de création de salle, pas d'historique, avatar généré                 | ✅     | `createRoom` (session exigée), `record.ts` (pas de lien au compte), `Avatar.tsx`      | Unitaire `record.test.ts` ; E2E `salles.spec.ts`                |
| AUTH-04 | Photo de profil JPEG/PNG/WebP, 2 Mo, redimensionnée                                | ✅     | `src/lib/avatar.ts`, `src/app/profil/actions.ts`, `/api/avatar/[id]`                  | Unitaire `avatar.test.ts` ; Manuel                              |
| AUTH-05 | Modifier son pseudonyme d'affichage                                                | ✅     | `src/lib/display-name.ts`, `updateDisplayName`                                        | Unitaire `avatar.test.ts` ; Manuel                              |
| AUTH-06 | Profil : meilleur MPM, MPM moyen, précision moyenne, courses, victoires, graphique | ✅     | `src/lib/profile.ts`, `src/app/profil/page.tsx`, `ProgressChart.tsx`                  | Unitaire `profile.test.ts` ; E2E `demo.spec.ts`                 |

## 5.3 Salles et visibilité

| ID       | Exigence                                                                                              | Statut | Où                                                                                        | Vérification                                                                |
| -------- | ----------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| SALLE-01 | Un utilisateur connecté crée une salle ; l'hôte court ou regarde                                      | ✅     | `createRoom`, `engine.ts` (`setRole`), `WaitingRoom.tsx`                                  | Unitaire `engine.test.ts` ; E2E                                             |
| SALLE-02 | Code unique de 6 caractères sans caractères ambigus                                                   | ✅     | `src/lib/room-code.ts`, contrainte unique sur `Room.code`                                 | Unitaire `room-code.test.ts`                                                |
| SALLE-03 | Visibilités publique, sur code, privée                                                                | ✅     | `config.ts`, `joinByCode`, `server.ts` (`room:join`), `explorer.ts`                       | Unitaire `explorer.test.ts` ; E2E `salles.spec.ts`                          |
| SALLE-04 | Liens d'invitation : un par invité, jeton ≥ 128 bits, liés à l'IP, révoqués, invalides à la fermeture | ✅     | `src/lib/invite-rules.ts`, `src/lib/invites.ts`, `/invitation/[token]`, `InvitePanel.tsx` | Unitaire `invite-rules.test.ts`, `client-ip.test.ts` ; E2E `salles.spec.ts` |
| SALLE-05 | Capacité de 2 à 30, spectateurs non comptés                                                           | ✅     | `config.ts` (`LIMITS`), `engine.ts` (`players`, `updateConfig`)                           | Unitaire `engine.test.ts`, `messages.test.ts`                               |
| SALLE-06 | Une seule salle à la fois, garanti en base ; proposer de quitter ; pas de doublon par onglet          | ✅     | Table `RoomPresence` (clé primaire `personId`), `src/lib/presence.ts`, `leaveOther`       | Unitaire `presence.test.ts`, `engine.test.ts` ; Manuel (contrainte SQL)     |
| SALLE-07 | Expulsion définitive                                                                                  | ✅     | `engine.ts` (`kick`), `server.ts` (révocation du lien)                                    | Unitaire `engine.test.ts`                                                   |
| SALLE-08 | Transfert d'hôte au plus ancien humain connecté, sinon fermeture                                      | ✅     | `engine.ts` (`transferHost`)                                                              | Unitaire `engine.test.ts`                                                   |
| SALLE-09 | Entrer seulement en attente ou aux résultats                                                          | ✅     | `engine.ts` (`join`)                                                                      | Unitaire `engine.test.ts`                                                   |
| SALLE-10 | Limite de tentatives de code par IP (10 par minute)                                                   | ✅     | `src/lib/rate-limit.ts`, `joinByCode`, page de salle, `room:join`                         | Unitaire `rate-limit.test.ts` ; Manuel                                      |

## 5.4 Rejoindre une course

| ID      | Exigence                                                                                                   | Statut | Où                                                        | Vérification                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------- | -------------------------------------------------- |
| JOIN-01 | Rejoindre par code dès l'accueil                                                                           | ✅     | `RoomCodeForm.tsx`, `joinByCode`                          | E2E `salles.spec.ts`, `a11y.spec.ts`               |
| JOIN-02 | Explorateur : participants/capacité, langue, complexité, hôte, état ; filtres ; mise à jour sans recharger | ✅     | `src/lib/explorer.ts`, `/api/salles`, `LiveRooms.tsx`     | Unitaire `explorer.test.ts` ; E2E `salles.spec.ts` |
| JOIN-03 | « Faire une course » : salle la plus proche de sa capacité ; états vides (compte, invité)                  | ✅     | `pickQuickRoom`, `src/app/go/page.tsx`, `createQuickRoom` | Unitaire `explorer.test.ts` ; E2E `salles.spec.ts` |

## 5.5 Configuration de la course

| ID      | Exigence                                                                  | Statut | Où                                                                            | Vérification                                     |
| ------- | ------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| CONF-01 | Temps maximal : aucun, ou 30 s à 10 min                                   | ✅     | `config.ts`, `engine.ts` (`deadline`), `ConfigPanel.tsx`                      | Unitaire `engine.test.ts`, `messages.test.ts`    |
| CONF-02 | Langue du texte FR ou EN                                                  | ✅     | `config.ts`, `room-store.ts` (`pickText`)                                     | Unitaire `generate.test.ts`                      |
| CONF-03 | Texte cohérent (corpus en base) ou aléatoire (dictionnaire)               | ✅     | `src/lib/text/generate.ts`, `words-fr.ts`, `words-en.ts`, `prisma/seed.ts`    | Unitaire `generate.test.ts`                      |
| CONF-04 | Longueur en mots                                                          | ✅     | `generateRandomText`, `composeCoherent`                                       | Unitaire `generate.test.ts`                      |
| CONF-05 | Complexité facile/moyen/difficile, critères mesurables documentés         | ✅     | `RANDOM_TIERS`, `classifyText` ; critères dans [`EXIGENCES.md`](EXIGENCES.md) | Unitaire `generate.test.ts`                      |
| CONF-06 | Ponctuation, nombres, majuscules, accents                                 | ✅     | `generateRandomText`, `adaptPassage`                                          | Unitaire `generate.test.ts`                      |
| CONF-07 | Caractères à inclure ou exclure (comportement en mode cohérent documenté) | ✅     | `wordPool`, `generateRandomText`                                              | Unitaire `generate.test.ts`                      |
| CONF-08 | Correction obligatoire ou mode libre                                      | ✅     | `src/lib/race/typing.ts`, `bots.ts`                                           | Unitaire `typing.test.ts`, `bots.test.ts`        |
| CONF-09 | Bonus activés ou non                                                      | ✅     | `config.ts`, `engine.ts` (`tick`)                                             | Unitaire `bonus.test.ts` ; E2E `course.spec.ts`  |
| CONF-10 | Ajout et retrait de bots avec leur niveau                                 | ✅     | `engine.ts` (`addBot`, `removeBot`), `WaitingRoom.tsx`                        | Unitaire `engine.test.ts` ; E2E                  |
| CONF-11 | Visibilité et capacité                                                    | ✅     | `config.ts`, `ConfigPanel.tsx`                                                | Unitaire `engine.test.ts` ; E2E `salles.spec.ts` |
| CONF-12 | Configuration visible en direct par tous                                  | ✅     | `server.ts` (`room:config`, diffusion), `ConfigPanel.tsx` (résumé)            | Manuel                                           |

## 5.6 Déroulement d'une course

| ID        | Exigence                                                                                    | Statut | Où                                                                             | Vérification                                             |
| --------- | ------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| COURSE-01 | Machine à états documentée                                                                  | ✅     | `src/lib/race/engine.ts` ; diagramme dans [`ARCHITECTURE.md`](ARCHITECTURE.md) | Unitaire `engine.test.ts`                                |
| COURSE-02 | ≥ 2 participants dont ≥ 1 humain (bots oui, spectateurs non)                                | ✅     | `engine.ts` (`startBlocker`)                                                   | Unitaire `engine.test.ts` ; E2E `course.spec.ts`         |
| COURSE-03 | Décompte synchronisé ; texte révélé au début du décompte                                    | ✅     | `engine.ts` (`startRace`), `server.ts` (`race:text`), `Countdown.tsx`          | Unitaire `engine.test.ts` ; E2E `course.spec.ts`         |
| COURSE-04 | Retour visuel immédiat, MPM et précision en direct, coller désactivé                        | ✅     | `TypingZone.tsx`, `src/lib/race/input.ts`, `RoomLive.tsx`                      | Unitaire `input.test.ts` ; E2E `course.spec.ts` (coller) |
| COURSE-05 | Piste : avatar, nom, position, MPM ; fluide ; joueur local mis en évidence ; vue spectateur | ✅     | `src/components/race/Track.tsx` (interpolation CSS, 10 mises à jour/s)         | E2E ; Manuel (spectateur)                                |
| COURSE-06 | Serveur autoritaire ; rejet des progressions impossibles                                    | ✅     | `engine.ts` (`applyKeys` : lots, vitesse), `server.ts`                         | Unitaire `engine.test.ts`                                |
| COURSE-07 | Abandon avec confirmation                                                                   | ✅     | `ConfirmButton.tsx`, `engine.ts` (`abandon`)                                   | Unitaire `engine.test.ts` ; Manuel                       |
| COURSE-08 | Reprise dans les 30 s, sinon abandon                                                        | ✅     | `engine.ts` (`disconnect`, `tick`), `server.ts` (`race:resync`)                | Unitaire `engine.test.ts` ; Manuel (rechargement)        |
| COURSE-09 | Fin quand tous ont fini ou abandonné, ou temps écoulé                                       | ✅     | `engine.ts` (`tick`)                                                           | Unitaire `engine.test.ts`                                |
| COURSE-10 | Classement : arrivés, puis temps écoulé, puis abandons                                      | ✅     | `engine.ts` (`ranking`)                                                        | Unitaire `engine.test.ts`                                |
| COURSE-11 | Aux résultats, l'hôte relance ou ferme                                                      | ✅     | `engine.ts` (`backToLobby`, `close`), `RoomLive.tsx`                           | Unitaire `engine.test.ts` ; Manuel                       |

## 5.7 Bots

| ID     | Exigence                                                       | Statut | Où                                                                                          | Vérification                                      |
| ------ | -------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| BOT-01 | Cinq niveaux, valeurs documentées                              | ✅     | `src/lib/race/bots.ts` (`BOT_PROFILES`) ; valeurs dans [`ARCHITECTURE.md`](ARCHITECTURE.md) | Unitaire `bots.test.ts` (MPM moyen dans la plage) |
| BOT-02 | Vitesse variable (accélérations, hésitations, mots difficiles) | ✅     | `bots.ts` (`delayFor`)                                                                      | Unitaire `bots.test.ts`                           |
| BOT-03 | Fautes qui ralentissent ; respect du mode d'erreur             | ✅     | `bots.ts` (`stepBot`)                                                                       | Unitaire `bots.test.ts`                           |
| BOT-04 | Bots identifiés ; soumis aux bonus et malus                    | ✅     | Étiquette « BOT » (`Track.tsx`, `Results.tsx`), `applyBonuses`                              | Unitaire `bonus.test.ts` ; E2E                    |
| BOT-05 | Moteur déterministe à partir d'une graine                      | ✅     | `src/lib/race/random.ts`, `bots.ts`                                                         | Unitaire `bots.test.ts`                           |

## 5.8 Bonus de remontée

| ID       | Exigence                                                               | Statut | Où                                                          | Vérification                      |
| -------- | ---------------------------------------------------------------------- | ------ | ----------------------------------------------------------- | --------------------------------- |
| BONUS-01 | Bonus aux joueurs en retard à 25/50/75 %, 3 au plus ; règle documentée | ✅     | `src/lib/race/bonus.ts` (`applyBonuses`, `behindRacers`)    | Unitaire `bonus.test.ts`          |
| BONUS-02 | Au moins 3 types : aide au retardataire, frein au meneur               | ✅     | `bonus.ts` (−3 mots, +3 mots, brouillard), `TypingZone.tsx` | Unitaire `bonus.test.ts` ; Manuel |
| BONUS-03 | Annonce sur la piste et chez le joueur ciblé                           | ✅     | `BonusFeed.tsx`, `Track.tsx`                                | Manuel                            |
| BONUS-04 | Progression et MPM cohérents avec un texte modifié                     | ✅     | Texte propre à chaque coureur (`Racer.text`), `race:mytext` | Unitaire `bonus.test.ts`          |

## 5.9 Résultats et statistiques

| ID     | Exigence                                                                   | Statut | Où                                                          | Vérification                                     |
| ------ | -------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- | ------------------------------------------------ |
| RES-01 | Podium des 3 premiers                                                      | ✅     | `src/components/race/Results.tsx`                           | E2E `course.spec.ts`                             |
| RES-02 | Tableau complet (rang, MPM, brut, précision, fautes, temps, statut, bonus) | ✅     | `Results.tsx`                                               | E2E `course.spec.ts`                             |
| RES-03 | Courbe du MPM de tous ; touches les plus manquées                          | ✅     | `WpmChart.tsx`, `KeyHeatmap.tsx`                            | E2E `course.spec.ts` ; Manuel (thèmes)           |
| RES-04 | Indicateur de record personnel                                             | ✅     | `src/lib/race/record.ts` (`isNewRecord`), `results.ts`      | Unitaire `record.test.ts` ; E2E `course.spec.ts` |
| RES-05 | Résultats persistés, avec la série temporelle du MPM                       | ✅     | `record.ts`, `src/lib/results.ts`, migration `race_results` | Unitaire `record.test.ts` ; E2E (historique)     |

## 5.10 Historique

| ID      | Exigence                                                    | Statut | Où                                                  | Vérification                                      |
| ------- | ----------------------------------------------------------- | ------ | --------------------------------------------------- | ------------------------------------------------- |
| HIST-01 | Historique paginé de l'utilisateur connecté                 | ✅     | `src/app/historique/page.tsx`, `src/lib/history.ts` | Unitaire `history.test.ts` ; E2E `demo.spec.ts`   |
| HIST-02 | Une course de l'historique réaffiche ses résultats complets | ✅     | `src/app/course/[id]/page.tsx`, `getRaceForUser`    | Unitaire `history.test.ts` ; E2E `course.spec.ts` |

## 5.11 Internationalisation

| ID      | Exigence                                                                     | Statut | Où                                                                                                                        | Vérification                          |
| ------- | ---------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| I18N-01 | Tous les textes en FR et EN, y compris erreurs, états vides, métadonnées     | ✅     | `src/i18n/dictionaries.ts` (le type anglais doit avoir toutes les clés du français), pages `not-found.tsx` et `error.tsx` | CI (`typecheck`) ; E2E `demo.spec.ts` |
| I18N-02 | Sélecteur sur toutes les pages, choix gardé, langue du navigateur par défaut | ✅     | `LangToggle.tsx` (en-tête commun), cookie `locale`, `src/i18n/server.ts` (`Accept-Language`)                              | E2E `demo.spec.ts`                    |
| I18N-03 | Dates et nombres selon la langue                                             | ✅     | `Intl.DateTimeFormat`, `Intl.NumberFormat` (fr-CA, en-CA), `ordinal`                                                      | Manuel ; E2E (« 1re sur 2 »)          |

## 6. Qualité

| ID      | Exigence                                                                        | Statut | Où                                                                                                              | Vérification                              |
| ------- | ------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| TEST-01 | Tests unitaires sur la logique                                                  | ✅     | 146 tests, `src/**/*.test.ts`                                                                                   | CI                                        |
| TEST-02 | Tests de bout en bout avec Playwright                                           | ✅     | `e2e/`, `playwright.config.ts`                                                                                  | CI (job `e2e`)                            |
| TEST-03 | E2E par nom d'utilisateur et mot de passe, pas OAuth                            | ✅     | `e2e/helpers.ts` (`loginWithPassword`)                                                                          | CI                                        |
| PERF-01 | Lighthouse ≥ 90 partout sur l'accueil                                           | ✅     | Ordinateur : 100/100/100/100 ; mobile : 98/100/100/100 (build de production)                                    | Manuel (Lighthouse 12)                    |
| PERF-02 | Mises à jour regroupées ; pas d'écriture en base à chaque frappe                | ✅     | Lots de touches toutes les 100 ms (`RoomLive.tsx`), limite côté serveur, une écriture par course (`results.ts`) | Unitaire `engine.test.ts` ; revue du code |
| PERF-03 | Piste fluide à 30 participants                                                  | ✅     | Couloirs fixes, animation par `transform` (`Track.tsx`)                                                         | Manuel (57 images/s à 30 coureurs)        |
| A11Y-01 | Contraste WCAG AA dans les deux thèmes                                          | ✅     | Couleurs de `globals.css` ; palette des graphiques validée                                                      | axe (clair et sombre)                     |
| A11Y-02 | Bonnes balises (`button`, `a`, titres, `header`/`nav`/`main`/`footer`, `table`) | ✅     | Composants, tableaux des résultats et de l'historique                                                           | axe ; Lighthouse                          |
| A11Y-03 | Texte alternatif des images, libellés des champs                                | ✅     | `Avatar.tsx` (décoratif, nom à côté), formulaires avec `label`                                                  | axe                                       |
| A11Y-04 | Navigation au clavier, focus visible                                            | ✅     | `:focus-visible` dans `globals.css`, lien d'évitement                                                           | E2E `a11y.spec.ts`                        |
| SEC-01  | Actions de l'hôte autorisées côté serveur                                       | ✅     | `engine.ts` (lancer, configurer, expulser, fermer, bots), `server.ts` (liens d'invitation)                      | Unitaire `engine.test.ts`                 |
| SEC-02  | Téléversement validé côté serveur : type réel et taille                         | ✅     | `checkAvatar` (signatures de fichier), `photoSchema`                                                            | Unitaire `avatar.test.ts`                 |
| SEC-03  | Mots de passe hachés (bcrypt), jamais stockés ni journalisés en clair           | ✅     | `src/auth.ts` (`bcryptjs`, coût 10), `prisma/seed-demo.ts`                                                      | Revue du code                             |

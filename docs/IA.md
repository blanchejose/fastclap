# Utilisation de l'IA

> **Brouillon à relire et à réécrire avec tes mots.** Les faits ci-dessous
> (outils, erreurs, corrections) viennent de l'historique du projet. La
> réflexion de la section 4 est personnelle : l'énoncé la demande à toi, pas
> à l'agent. Supprime cet encadré une fois le texte relu.

## 1. Agents et outils utilisés

- **Claude Code** (agent de Anthropic), dans le navigateur et l'application :
  écriture du code, des tests et de la documentation, sur une branche de
  travail, avec une pull request par grande étape (sprint 1, puis sprints 2
  et 3).
- **GitHub Actions** pour vérifier chaque push de l'agent : lint, types,
  tests unitaires et tests de bout en bout sur le build de production.
- **Outils de vérification** utilisés par l'agent et par moi : Playwright
  (scénarios de jeu), axe (accessibilité), Lighthouse (performance), et des
  tests manuels sur mon Mac avec Docker.
- **Planification** : le planning poker et le découpage en sprints ont été
  proposés par l'agent à partir de l'énoncé, puis suivis sprint par sprint.
- **Sans IA** : le nom, le logo et la démarche créative (DES-01 à DES-03).

## 2. Fichiers d'instructions d'agent

- [`CLAUDE.md`](../CLAUDE.md), à la racine : règles du projet (TypeScript
  strict, Zod sur toutes les entrées, serveur autoritaire, textes traduits,
  accessibilité), commandes à lancer avant chaque commit, et règles de
  collaboration (expliquer avant de pousser, ne jamais fusionner sans
  demande, ne pas toucher à la démarche créative).
- L'énoncé lui-même, donné à l'agent au début de chaque sprint : chaque
  fonctionnalité est rattachée à un identifiant d'exigence, et la matrice de
  [`EXIGENCES.md`](EXIGENCES.md) est mise à jour dans le même commit.

## 3. Trois situations où l'IA s'est trompée

### 3.1 Les accents bloquaient la frappe sur Mac

- **Erreur.** La zone de frappe vidait le champ après chaque touche. Sur Mac,
  un accent se tape en maintenant la lettre (bulle de choix) ou en deux temps
  (`^` puis `e`). Le champ vidé faisait perdre la lettre de base : le joueur
  restait bloqué sur un « é » pourtant bien tapé.
- **Détection.** En jouant moi-même sur mon Mac : je « calais » sur chaque
  accent. Les tests de l'agent tapaient les caractères directement et ne
  pouvaient pas voir le problème.
- **Correction.** Le champ garde maintenant le dernier caractère, attend la
  fin de la composition et normalise le texte (Unicode NFC) avant de le
  comparer (`src/lib/race/input.ts`). Des tests unitaires reproduisent les
  deux façons de taper un accent (`input.test.ts`).

### 3.2 Les bots étaient plus lents que leur niveau

- **Erreur.** L'agent réglait la vitesse de base de chaque bot sur la plage
  de MPM visée (BOT-01), sans compter que les hésitations et les fautes
  ajoutées ensuite (BOT-02, BOT-03) leur font perdre environ 20 % de vitesse.
  Un bot « Expert » finissait souvent sous 70 MPM.
- **Détection.** Un test de calibrage qui fait courir chaque niveau sur 20
  graines et vérifie que le MPM moyen tombe dans la plage annoncée.
- **Correction.** Le rythme de base est accéléré pour compenser
  (`SLOWDOWN_COMPENSATION` dans `bots.ts`), et le test de calibrage reste dans
  `bots.test.ts` pour qu'un futur réglage ne casse pas les niveaux.

### 3.3 Toujours la même phrase, et un test qui échouait une fois sur trois

- **Erreur.** Le choix du texte prenait un passage au hasard parmi très peu de
  passages : je retombais sans cesse sur la même phrase. Plus tard, un test de
  bout en bout échouait au hasard ; l'agent était prêt à le traiter comme un
  test « instable ».
- **Détection.** La phrase répétée : en jouant plusieurs courses de suite. Le
  test : en relançant la CI et en lisant les captures d'écran de l'échec. La
  vraie cause était que le bot, en retard, recevait des bonus « −3 mots » et
  pouvait gagner la course.
- **Correction.** Une salle passe maintenant par tous les textes de son niveau
  avant d'en répéter un (`pickText` dans `room-store.ts`). Le test désactive
  les bonus, qui ont leurs propres tests (`bonus.test.ts`), et passe à chaque
  fois. Je n'ai pas accepté de simplement relancer le test jusqu'à ce qu'il
  passe.

## 4. Réflexion sur ma façon de travailler avec les agents

_À écrire toi-même (quelques paragraphes). Pistes à partir de ce qui s'est
passé pendant le projet :_

- _Au début, l'agent poussait du code sans m'expliquer ce qu'il avait fait. Je
  lui ai demandé de résumer et de dire comment tester avant de pousser : ce
  que ça a changé pour toi._
- _Ce que les tests automatiques ne voient pas (accents sur Mac, texte
  répété) et que seul le fait de jouer a révélé._
- _Le découpage en petites étapes (sprints, puis une exigence à la fois) et
  la matrice de traçabilité pour garder le contrôle sur un projet de cette
  taille._
- _Ce que tu dois être capable d'expliquer toi-même (machine à états, serveur
  autoritaire, liens d'invitation liés à l'IP) et ce que tu as fait pour bien
  le comprendre._
- _Ce que tu ferais différemment au prochain projet._

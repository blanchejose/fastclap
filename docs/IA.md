# Utilisation de l'IA

## 1. Agents et outils utilisés

- **Claude Code** (l'agent d'Anthropic) : je l'ai utilisé pour écrire le code,
  les tests et la documentation. Il travaillait sur une branche à part, et
  chaque grande étape passait par une pull request que je relisais avant de
  fusionner.
- **GitHub Actions** : à chaque push, la CI vérifie le lint, les types, les
  tests unitaires et les tests de bout en bout. Ça me permettait de savoir si
  le code de l'agent cassait quelque chose.
- **Outils de vérification** : Playwright pour simuler des parties, axe pour
  l'accessibilité, Lighthouse pour la performance, et mes propres tests en
  jouant sur mon Mac.
- **Planification** : l'agent m'a aidée à découper le projet en sprints et à
  estimer les tâches à partir de l'énoncé.
- **Sans IA** : le nom FastClap, le logo et toute la démarche créative.

## 2. Fichiers d'instructions d'agent

- **`AGENTS.md`**, à la racine du projet : j'y ai mis les règles que l'agent
  devait respecter (TypeScript strict, validation des entrées avec Zod,
  serveur qui décide de tout, textes en français et en anglais,
  accessibilité), les commandes à lancer avant chaque commit, et des règles
  de collaboration : m'expliquer ce qu'il a fait avant de pousser, ne jamais
  fusionner sans ma permission et ne pas toucher à la démarche créative.

## 3. Trois situations où l'IA s'est trompée

### 3.1 Les accents bloquaient la frappe sur Mac

- **Erreur.** La zone de frappe se vidait après chaque touche. Sur Mac, on
  tape un accent en maintenant la lettre ou en deux temps (`^` puis `e`).
  Comme le champ se vidait, la lettre de base disparaissait et je restais
  bloquée sur un « é » pourtant bien tapé.
- **Comment je l'ai vue.** En jouant moi-même. Les tests de l'agent
  envoyaient les caractères directement, donc ils ne pouvaient pas voir le
  problème.
- **Correction.** Le champ attend maintenant la fin de la composition de
  l'accent et normalise le texte avant de le comparer
  (`src/lib/race/input.ts`). Des tests reproduisent les deux façons de taper
  un accent (`input.test.ts`).

### 3.2 Les bots étaient plus lents que leur niveau

- **Erreur.** L'agent a réglé la vitesse des bots sur la plage de MPM
  demandée, sans tenir compte des hésitations et des fautes ajoutées ensuite,
  qui leur font perdre environ 20 % de vitesse. Un bot « Expert » finissait
  souvent sous 70 MPM.
- **Comment je l'ai vue.** Avec un test qui fait courir chaque niveau 20 fois
  et vérifie que la moyenne tombe dans la bonne plage.
- **Correction.** La vitesse de base est accélérée pour compenser
  (`SLOWDOWN_COMPENSATION` dans `bots.ts`), et le test reste dans le projet
  pour qu'un futur changement ne casse pas les niveaux.

### 3.3 Toujours la même phrase, et un test qui échouait au hasard

- **Erreur.** Le texte était choisi au hasard parmi très peu de passages : je
  retombais tout le temps sur la même phrase. Plus tard, un test de bout en
  bout échouait de temps en temps, et l'agent voulait le marquer comme
  « instable ».
- **Comment je l'ai vue.** La phrase répétée, en jouant plusieurs courses de
  suite. Pour le test, en relançant la CI et en regardant les captures
  d'écran de l'échec : le bot, en retard, recevait des bonus et pouvait
  gagner la course.
- **Correction.** Une salle passe maintenant par tous les textes de son
  niveau avant d'en répéter un (`pickText` dans `room-store.ts`). Le test
  désactive les bonus, qui ont leurs propres tests, et il passe à chaque
  fois. J'ai refusé de simplement relancer le test jusqu'à ce qu'il passe.

## 4. Ma réflexion sur ma façon de travailler avec les agents

Au début du projet, l'agent poussait du code sans m'expliquer ce qu'il
avait fait. Je lui ai demandé de résumer ses changements et de me dire
comment les tester avant de pousser. Ça m'a apporté une meilleur responsabilité sur ce que l'IA génère.

Les tests automatiques n'ont pas vu le problème des accents ni la phrase qui
revenait toujours : c'est en jouant moi-même que je les ai trouvés.

Pour ne pas me perdre dans un projet de cette taille, j'ai travaillé par
petites étapes : des sprints, puis une exigence à la fois, avec la matrice
de traçabilité.

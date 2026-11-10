# Utilisation de l'IA

## 1. Agents et outils utilisés

- **Claude Code** (agent d'Anthropic), dans le navigateur et l'application
  Claude, à partir du 20 octobre, après la remise du checkpoint 1. L'agent a
  écrit la plus grande partie du code des sprints 1 à 3, les tests et la
  documentation finale, sur une branche de travail ; chaque étape arrivait
  dans `main` par une pull request que je fusionnais.
- **GitHub Actions** : lint, vérification des types et tests (unitaires et de
  bout en bout) à chaque push, pour vérifier le travail de l'agent.
- **Vérification** : Playwright, axe et Lighthouse (lancés par l'agent), et
  mes propres tests du site sur mon Mac avec Docker et en production.
- **Sans IA** : le nom, le logo et la démarche créative (DES-01 à DES-03).

**Mon rôle.** Je donnais l'énoncé et les priorités, je choisissais l'ordre
des étapes, je testais chaque version en jouant, je signalais ce qui
n'allait pas et je décidais quand fusionner. L'agent proposait le planning
(planning poker jusqu'au 10 novembre), écrivait le code et expliquait ce
qu'il avait fait et comment le tester.

**Historique Git.** Les commits de l'agent étaient d'abord signés « Claude ».
Le 10 novembre, je les ai fait réattribuer à mon compte GitHub ; les pull
requests #1 à #5 gardent les commits d'origine.

## 2. Fichiers d'instructions d'agent

- [`AGENTS.md`](../AGENTS.md) : règles du projet (TypeScript strict, Zod sur
  toutes les entrées, serveur autoritaire, textes traduits, accessibilité),
  commandes à lancer avant chaque commit, et règles de collaboration
  (expliquer avant de pousser, ne jamais fusionner sans ma demande, ne pas
  toucher à la démarche créative).
- L'énoncé, donné à l'agent au début de chaque sprint : chaque fonctionnalité
  est rattachée à un identifiant d'exigence de la matrice
  ([`EXIGENCES.md`](EXIGENCES.md)).

## 3. Trois situations où l'IA s'est trompée

### 3.1 Les accents bloquaient la frappe sur Mac

- **Erreur.** La zone de frappe vidait le champ après chaque touche. Sur Mac,
  un accent se tape en maintenant la lettre ou en deux temps (`^` puis `e`) :
  le champ vidé faisait perdre la lettre, et je n'avançais plus sur un « é »
  pourtant bien tapé.
- **Détection.** En jouant sur mon Mac ; j'ai envoyé une capture à l'agent.
  Ses tests tapaient les caractères directement et ne voyaient pas le
  problème.
- **Correction.** Le champ garde le dernier caractère, attend la fin de
  l'accent et normalise le texte (`src/lib/race/input.ts`). Des tests
  reproduisent les deux façons de taper un accent (`input.test.ts`).

### 3.2 Toujours la même phrase

- **Erreur.** Le texte était tiré au hasard parmi très peu de passages : je
  retombais presque toujours sur la même phrase, ce que l'énoncé ne permet pas
  (texte cohérent tiré d'un corpus, CONF-03).
- **Détection.** En jouant plusieurs courses de suite.
- **Correction.** Une salle passe par tous les textes de son niveau avant d'en
  reprendre un (`pickText`, `src/lib/race/room-store.ts`), et le corpus a été
  élargi avec des textes du domaine public.

### 3.3 Les bots étaient plus lents que leur niveau

- **Erreur.** La vitesse de base des bots correspondait à la plage visée
  (BOT-01), mais les hésitations et les fautes ajoutées ensuite (BOT-02,
  BOT-03) leur faisaient perdre environ 20 % : un bot « Expert » finissait
  souvent sous 70 MPM.
- **Détection.** Un test de calibrage qui fait courir chaque niveau sur 20
  graines et compare le MPM moyen à la plage.
- **Correction.** Le rythme de base est accéléré pour compenser
  (`bots.ts`), et le test reste dans `bots.test.ts`.

## 4. Réflexion

Au début, je laissais l'agent avancer et pousser son code, et je ne savais
plus exactement ce qui avait été fait. Je lui ai demandé de toujours
m'expliquer en mots simples ce qu'il avait changé et comment le tester avant
de pousser. Après ça, je testais chaque étape moi-même avant de fusionner.

Les tests automatiques passaient, mais c'est en jouant que j'ai trouvé les
vrais problèmes : les accents sur Mac, la phrase répétée, le bouton pour
ajouter un bot que je ne trouvais pas, des étiquettes qui ressemblaient à des
boutons. L'agent écrit vite, mais il ne sait pas ce qu'un vrai joueur
ressent ; ce travail-là restait le mien.

Découper le projet en sprints, puis en exigences numérotées, m'a permis de
garder le contrôle sur un projet de cette taille : à chaque étape, je savais
quelle exigence était faite et comment la vérifier. Comme je reste
responsable de chaque ligne, j'ai aussi demandé à l'agent de m'expliquer
l'organisation du code, dossier par dossier.

Au prochain projet, je commencerais à travailler avec l'agent plus tôt et par
plus petites étapes, pour que l'historique montre mieux mon travail au fil du
temps, et je relirais le code au fur et à mesure plutôt qu'à la fin.

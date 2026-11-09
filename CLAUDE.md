# Instructions pour les agents (Claude Code)

FastClap : course de frappe multijoueur en temps réel (travail de session Web V).
L'énoncé fait foi : chaque exigence a un identifiant (ex. `COURSE-04`) et la
matrice de `docs/EXIGENCES.md` doit rester vraie.

## Règles du projet

- **TypeScript seulement** : aucun fichier `.js`, `.jsx`, `.mjs` ou `.cjs` ;
  `strict: true` ; aucun `any` ; aucun `@ts-ignore` sans commentaire.
- **Toute entrée serveur passe par un schéma Zod** : Server Actions, routes
  API (`src/app/api/`) et messages Socket.IO (`src/lib/race/messages.ts`).
- **Le serveur fait foi** : la logique du jeu vit dans `src/lib/race/`, en code
  pur (le temps est passé en paramètre) et testé. Les actions de l'hôte sont
  vérifiées dans `engine.ts`, jamais seulement dans l'interface.
- **Aucun texte en dur dans l'interface** : tout passe par
  `src/i18n/dictionaries.ts`, en français et en anglais.
- **Accessibilité** : bonnes balises (`button`, `a`, titres, `table`), libellés
  sur les champs, contraste AA dans les deux thèmes, focus visible.
- **Base de données** : on modifie `prisma/schema.prisma` puis on crée une
  migration (`npm run db:migrate`) ; pas d'écriture en base à chaque frappe.
- **Aucun secret commité** : toute nouvelle variable va dans `.env.example`.
- **Commentaires et documentation en français.** Citer l'identifiant de
  l'exigence dans les commentaires utiles (`// SALLE-06 : …`).

## Avant chaque commit

```bash
npm run lint && npm run typecheck && npm test
```

Pour un changement visible ou dans le temps réel, lancer aussi
`npm run test:e2e` (PostgreSQL local requis : `docker compose up -d`).

Quand une exigence change de statut ou qu'un choix est fait sur une
ambiguïté, mettre à jour `docs/EXIGENCES.md` dans le même commit.

## Travail avec la personne étudiante

- Expliquer en français simple ce qui a été fait et comment le tester avant
  de pousser.
- Ne jamais pousser sur `main` ni fusionner une pull request sans demande
  explicite.
- Le nom, le logo et la démarche créative (`docs/DEMARCHE-CREATIVE.md`) sont
  faits par la personne étudiante, sans IA : ne pas les modifier.

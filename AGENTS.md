# Instructions pour les agents

L'énoncé fait foi : chaque exigence a un identifiant (ex. `COURSE-04`) et la
matrice de `docs/EXIGENCES.md` doit rester vraie.

## Règles

- TypeScript seulement, `strict`, aucun `any`, aucun fichier `.js`.
- Toute entrée serveur est validée par Zod (actions, routes API, messages
  Socket.IO dans `src/lib/race/messages.ts`).
- Le serveur fait foi : la logique du jeu est dans `src/lib/race/`, en code pur
  et testé ; les actions de l'hôte sont vérifiées dans `engine.ts`.
- Aucun texte en dur dans l'interface : tout passe par
  `src/i18n/dictionaries.ts`, en français et en anglais.
- Accessibilité : bonnes balises, libellés, contraste AA, focus visible.
- Base : modifier `prisma/schema.prisma`, puis créer une migration.
- Aucun secret commité ; toute nouvelle variable va dans `.env.example`.
- Commentaires et documentation en français.

## Avant chaque commit

```bash
npm run lint && npm run typecheck && npm test
```

Pour un changement visible : `npm run test:e2e`.

## Collaboration

- Expliquer ce qui a été fait et comment le tester avant de pousser.
- Ne jamais pousser sur `main` ni fusionner sans demande explicite.
- Ne pas modifier le nom, le logo ni `docs/DEMARCHE-CREATIVE.md`.

# Guide de déploiement — Railway + Neon

Le site FastClap tourne sur [Railway](https://railway.com) et sa base
PostgreSQL est chez [Neon](https://neon.tech).

| Ressource | Hébergeur | Rôle                                                         |
| --------- | --------- | ------------------------------------------------------------ |
| Site web  | Railway   | Conteneur Docker toujours allumé, HTTPS automatique          |
| Base      | Neon      | PostgreSQL gratuit, sans date d'expiration, connexion en TLS |

Pourquoi Railway : le service reste allumé en permanence (pas de mise en
veille), accepte les WebSockets de Socket.IO et redéploie à chaque push sur
`main`. Le site est servi en HTTPS avec un certificat géré par Railway.

## Fichiers de déploiement

- [`Dockerfile`](../Dockerfile) : construit l'image (dépendances, client
  Prisma, build Next.js). Au démarrage du conteneur : migrations
  (`db:deploy`), textes de départ (`db:seed`), puis `npm start`.
- [`railway.json`](../railway.json) : dit à Railway d'utiliser le Dockerfile et
  de vérifier `/api/health` avant de basculer le trafic sur une nouvelle version.

## 1. Base de données Neon

1. Créer un compte sur https://neon.tech (connexion avec GitHub possible)
2. **New project** : nom `fastclap`, région **AWS US East (N. Virginia)**
3. **Connect** : copier la chaîne de connexion **sans** « Connection pooling »
   (elle commence par `postgresql://` et se termine par `?sslmode=require`)

La base gratuite se met en veille après quelques minutes sans requête et se
réveille en moins d'une seconde : aucun effet visible pour les joueurs.

## 2. Site sur Railway

1. Créer un compte sur https://railway.com avec GitHub
2. **New Project → Deploy from GitHub repo**, choisir `blanchejose/fastclap`
3. Onglet **Variables** du service, ajouter :

   | Variable                                  | Valeur                                 |
   | ----------------------------------------- | -------------------------------------- |
   | `DATABASE_URL`                            | Chaîne de connexion Neon               |
   | `AUTH_SECRET`                             | Résultat de `openssl rand -base64 32`  |
   | `AUTH_TRUST_HOST`                         | `true` (Railway est derrière un proxy) |
   | `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | Application Discord (voir plus bas)    |
   | `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`   | OAuth App GitHub (voir plus bas)       |

4. Onglet **Settings → Networking → Generate Domain** : Railway donne une
   adresse `https://fastclap-production-xxxx.up.railway.app`
5. Le déploiement démarre tout seul. Il est terminé quand le statut est
   **Active**.

Les secrets ne sont jamais dans Git : ils se saisissent dans Railway.

## 3. Discord et GitHub

Mettre à jour l'URL de redirection avec l'adresse Railway :

- Discord : `https://<adresse>/api/auth/callback/discord`
  (https://discord.com/developers/applications → ton application → OAuth2 → Redirects)
- GitHub : `https://<adresse>/api/auth/callback/github`
  (https://github.com/settings/developers → ton OAuth App → _Authorization callback URL_,
  et _Homepage URL_ = l'adresse du site)

## À chaque push sur `main`

Railway reconstruit l'image avec le Dockerfile, démarre le nouveau conteneur
(migrations, textes, serveur), attend que `/api/health` réponde, puis bascule
le trafic. Si la vérification échoue, l'ancienne version reste en ligne.

## Vérifier que la production fonctionne

- `https://<adresse>/api/health` → `{"status":"ok","database":"up"}`
- `https://<adresse>/salles` → « 5 textes disponibles »
- Créer un compte avec un pseudo sur `/connexion`, puis une salle

## Tester l'image en local

```bash
docker build -t fastclap .
docker run -p 3000:3000 -e DATABASE_URL=... -e AUTH_SECRET=... -e AUTH_TRUST_HOST=true fastclap
```

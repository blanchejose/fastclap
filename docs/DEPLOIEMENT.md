# Guide de déploiement — Render

FastClap est hébergé sur [Render](https://render.com). Le fichier
[`render.yaml`](../render.yaml) décrit toute l'infrastructure (Blueprint) :

| Ressource     | Type                  | Plan | Rôle                            |
| ------------- | --------------------- | ---- | ------------------------------- |
| `fastclap`    | Web Service (Node 22) | Free | Site Next.js, HTTPS automatique |
| `fastclap-db` | PostgreSQL            | Free | Base de données                 |

## À chaque push sur `main`

Render redéploie automatiquement :

1. `npm ci --include=dev` : installe les dépendances (et génère le client Prisma)
2. `npm run db:deploy` : applique les nouvelles migrations Prisma
3. `npm run db:seed` : ajoute les textes de départ s'il n'y en a pas
4. `npm run build` : build de production Next.js
5. `npm start` : démarre le serveur
6. Render vérifie `/api/health` avant de basculer le trafic sur la nouvelle version

## Première mise en ligne

1. Se connecter sur https://dashboard.render.com avec GitHub
2. **New → Blueprint**, choisir le dépôt `blanchejose/fastclap`
3. Render lit `render.yaml` et propose de créer `fastclap` et `fastclap-db` : **Apply**
4. Les clés OAuth peuvent rester vides au début (les boutons Discord et GitHub
   affichent alors « non configuré »)
5. Attendre la fin du premier déploiement, puis ouvrir l'URL
   `https://fastclap-xxxx.onrender.com`

## Variables d'environnement

| Variable                                  | Valeur                                      |
| ----------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`                            | Fournie automatiquement par `fastclap-db`   |
| `AUTH_SECRET`                             | Générée automatiquement par Render          |
| `AUTH_TRUST_HOST`                         | `true` (Render est derrière un proxy HTTPS) |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | Application Discord (voir plus bas)         |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`   | OAuth App GitHub (voir plus bas)            |

Les secrets ne sont jamais dans Git : ils se saisissent dans
**fastclap → Environment** sur Render.

## Activer Discord et GitHub

URL de redirection à déclarer (remplacer par l'URL réelle du site) :

- Discord : `https://fastclap-xxxx.onrender.com/api/auth/callback/discord`
- GitHub : `https://fastclap-xxxx.onrender.com/api/auth/callback/github`

**Discord** : https://discord.com/developers/applications → New Application →
OAuth2 → copier _Client ID_ et _Client Secret_, ajouter l'URL de redirection.

**GitHub** : https://github.com/settings/developers → New OAuth App →
_Homepage URL_ = URL du site, _Authorization callback URL_ = URL ci-dessus.

Coller les valeurs dans Render (Environment), puis **Save, rebuild and deploy**.

## Limites du plan gratuit

- Le site s'endort après 15 minutes sans visite : la première visite suivante
  prend environ 1 minute.
- La base PostgreSQL gratuite expire 30 jours après sa création : passer au plan
  payant ou recréer la base avant la livraison finale.

## Vérifier que la production fonctionne

- `https://fastclap-xxxx.onrender.com/api/health` → `{"status":"ok","database":"up"}`
- `https://fastclap-xxxx.onrender.com/salles` → « 5 textes disponibles »
- Créer un compte avec un pseudo sur `/connexion`

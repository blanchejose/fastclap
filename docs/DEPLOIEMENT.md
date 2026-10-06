# Guide de déploiement — Render + Neon

Le site FastClap est hébergé sur [Render](https://render.com) et sa base
PostgreSQL sur [Neon](https://neon.tech). Le fichier
[`render.yaml`](../render.yaml) décrit le service web (Blueprint) :

| Ressource  | Hébergeur | Type                  | Plan | Rôle                              |
| ---------- | --------- | --------------------- | ---- | --------------------------------- |
| `fastclap` | Render    | Web Service (Node 22) | Free | Site Next.js, HTTPS automatique   |
| `fastclap` | Neon      | PostgreSQL 17         | Free | Base de données (sans expiration) |

## Base de données Neon

1. Créer un compte sur https://neon.tech (connexion avec GitHub possible)
2. **New project** : nom `fastclap`, région **AWS US East (Ohio)** (proche de Render)
3. **Connect** : copier la chaîne de connexion **sans** « Connection pooling »
   (elle se termine par `?sslmode=require`)
4. Sur Render : **fastclap → Environment → `DATABASE_URL`**, coller la chaîne,
   puis **Save, rebuild and deploy**
5. Le déploiement crée les tables (`db:deploy`) et les textes (`db:seed`) sur Neon

La base Neon gratuite se met en veille après 5 minutes sans requête et se
réveille en moins d'une seconde : aucun effet visible pour les joueurs.

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
3. Render lit `render.yaml` et propose de créer `fastclap` : saisir `DATABASE_URL` (Neon), puis **Apply**
4. Les clés OAuth peuvent rester vides au début (les boutons Discord et GitHub
   affichent alors « non configuré »)
5. Attendre la fin du premier déploiement, puis ouvrir l'URL
   `https://fastclap-xxxx.onrender.com`

## Variables d'environnement

| Variable                                  | Valeur                                      |
| ----------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`                            | Chaîne de connexion Neon (voir plus haut)   |
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
  prend environ 1 minute. Un moniteur [UptimeRobot](https://uptimerobot.com)
  visite `/api/health` toutes les 5 minutes pour le garder éveillé (les tâches
  programmées de GitHub Actions sont trop irrégulières pour ça).
- Le plan Starter de Render (payant) supprime la mise en veille.

## Vérifier que la production fonctionne

- `https://fastclap-xxxx.onrender.com/api/health` → `{"status":"ok","database":"up"}`
- `https://fastclap-xxxx.onrender.com/salles` → « 5 textes disponibles »
- Créer un compte avec un pseudo sur `/connexion`

# Image de production de FastClap (Railway, ou tout hébergeur qui lance Docker).
FROM node:22-slim

# openssl : demandé par le moteur de migrations de Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dépendances d'abord (mises en cache tant que package-lock.json ne change pas).
# Le postinstall génère le client Prisma : il a besoin du schéma et de la config.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Au démarrage : migrations et textes de départ sur la base, puis le serveur.
CMD ["sh", "-c", "npm run db:deploy && npm run db:seed && npm start"]

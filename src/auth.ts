import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare, hash } from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import Discord from "next-auth/providers/discord";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { isValidUsername, usernameBaseFrom } from "@/lib/username";

// Identifiants reçus du formulaire, validés par Zod (TECH-07).
const usernameSchema = z.string().trim().refine(isValidUsername);
const passwordSchema = z.string().max(72);

class UsernameTaken extends CredentialsSignin {
  code = "username_taken";
}
class InvalidUsername extends CredentialsSignin {
  code = "invalid_username";
}
class WeakPassword extends CredentialsSignin {
  code = "weak_password";
}
class WrongPassword extends CredentialsSignin {
  code = "wrong_password";
}

// L'adaptateur Prisma d'Auth.js crée l'utilisateur à la première connexion
// Discord/GitHub. Notre table User exige un username unique : on en génère
// un à partir du nom du profil (« Blanche », puis « Blanche_4821 » si pris).
const basePrismaAdapter = PrismaAdapter(prisma);

async function uniqueUsername(base: string): Promise<string> {
  let candidate = base;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return candidate;
}

const adapter: Adapter = {
  ...basePrismaAdapter,
  async createUser(data) {
    const { id: _id, ...rest } = data; // l'id est généré par la base
    void _id;
    const username = await uniqueUsername(usernameBaseFrom(data.name));
    const user = await prisma.user.create({ data: { ...rest, username } });
    return { ...user, email: user.email ?? "" };
  },
};

// Les fournisseurs OAuth ne sont activés que si leurs clés existent,
// pour que le site démarre aussi en développement sans clés.
const oauthProviders = [
  process.env.AUTH_DISCORD_ID ? Discord : null, // AUTH-01
  process.env.AUTH_GITHUB_ID ? GitHub : null, // AUTH-01
].filter((provider) => provider !== null);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Le fournisseur « Credentials » d'Auth.js impose des sessions JWT
  // (stockées dans un cookie chiffré) plutôt qu'en base.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 365 },
  pages: { signIn: "/connexion" },
  providers: [
    ...oauthProviders,

    // Connexion rapide : création de compte avec un username seulement.
    Credentials({
      id: "username",
      name: "Nom d'utilisateur",
      credentials: { username: {} },
      async authorize(credentials) {
        const input = usernameSchema.safeParse(credentials?.username);
        if (!input.success) throw new InvalidUsername();
        const username = input.data;

        const existing = await prisma.user.findUnique({ where: { username } });
        // Un nom déjà pris ne donne jamais accès au compte de quelqu'un d'autre.
        if (existing) throw new UsernameTaken();

        const user = await prisma.user.create({ data: { username, name: username } });
        return { id: user.id, name: user.username };
      },
    }),

    // AUTH-01, TEST-03 : username + mot de passe (affiché en dernier sur la page).
    // Si le nom est libre, le compte est créé avec ce mot de passe.
    Credentials({
      id: "password",
      name: "Mot de passe",
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        const input = usernameSchema.safeParse(credentials?.username);
        if (!input.success) throw new InvalidUsername();
        const username = input.data;
        // bcrypt ne lit que 72 octets : un mot de passe plus long est refusé.
        const password = passwordSchema.safeParse(credentials?.password);
        if (!password.success) throw new WeakPassword();

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          if (password.data.length < 8) throw new WeakPassword();
          const created = await prisma.user.create({
            data: { username, name: username, passwordHash: await hash(password.data, 10) },
          });
          return { id: created.id, name: created.username };
        }
        if (!user.passwordHash || !(await compare(password.data, user.passwordHash))) {
          throw new WrongPassword();
        }
        return { id: user.id, name: user.username };
      },
    }),
  ],
  callbacks: {
    // On garde l'id et le username dans le jeton, puis dans la session.
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        });
        token.sub = user.id;
        token.username = dbUser?.username ?? user.name ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.username = String(token.username ?? "");
      return session;
    },
  },
});

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            tenantProfile: {
              select: { status: true, deletedAt: true },
            },
          },
        });
        if (!user || !verifyPassword(credentials.password, user.passwordHash))
          return null;
        if (
          user.role === "TENANT" &&
          (!user.tenantProfile ||
            user.tenantProfile.status !== "ACTIVE" ||
            user.tenantProfile.deletedAt)
        )
          return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

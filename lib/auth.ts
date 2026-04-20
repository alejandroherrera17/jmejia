import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import baseAuthConfig from "@/auth.config";

export const authConfig = {
  ...baseAuthConfig,
  callbacks: {
    ...baseAuthConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role as Role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as Role;
      }

      return session;
    }
  }
} satisfies NextAuthConfig;

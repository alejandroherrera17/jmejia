import "server-only";

import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations";
import { logAction } from "@/services/audit-service";
import { ensureAdminUser } from "@/services/user-service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        await ensureAdminUser();

        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }
        });

        if (!user) return null;

        const passwordValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!passwordValid) return null;

        await logAction(
          user.id,
          "LOGIN",
          `Inicio de sesion exitoso para ${user.email}.`,
          user.name
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ]
});

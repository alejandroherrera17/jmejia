import type { NextAuthConfig } from "next-auth";

const authConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/auth/sign-in"
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

      if (isAuthRoute) return true;
      return isLoggedIn;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;

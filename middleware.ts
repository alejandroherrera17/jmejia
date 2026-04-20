<<<<<<< HEAD
import NextAuth from "next-auth";

import authConfig from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);
=======
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_ROUTE_PREFIX = "/auth";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  });

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith(AUTH_ROUTE_PREFIX);
  const isLoggedIn = !!token;

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isAuthRoute && !isLoggedIn) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}
>>>>>>> 9ea9377de7b60e87493b9b7666a5addfdfa5f03b

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};

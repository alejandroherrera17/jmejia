import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireRole(allowedRoles: readonly (Role | string)[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

import "server-only";

import type { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth-server";
import {
  emptyModuleAccess,
  moduleAccessSelect,
  type UserModuleAccessState,
  type UserModuleKey
} from "@/lib/module-access";
import { prisma } from "@/lib/prisma";

type CurrentUserAccess = {
  session: Session | null;
  user: {
    id: string;
    role: Role;
    name?: string | null;
    email?: string | null;
    moduleAccess: UserModuleAccessState;
  };
};

type ForbiddenError = Error & {
  status: 403;
};

export async function getCurrentUserAccess(): Promise<CurrentUserAccess | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      moduleAccess: {
        select: moduleAccessSelect
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    session,
    user: {
      ...user,
      moduleAccess: {
        ...emptyModuleAccess,
        ...(user.moduleAccess ?? {})
      }
    }
  };
}

export async function requireRole(allowedRoles: readonly (Role | string)[]) {
  const currentUser = await getCurrentUserAccess();

  if (!currentUser?.session?.user) {
    redirect("/auth/sign-in");
  }

  if (!allowedRoles.includes(currentUser.user.role)) {
    redirect("/unauthorized");
  }

  return currentUser.session;
}

export async function requireModuleAccess(
  moduleKey: UserModuleKey,
  allowedRoles?: readonly (Role | string)[]
) {
  const currentUser = await getCurrentUserAccess();

  if (!currentUser?.session?.user) {
    redirect("/auth/sign-in");
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.user.role)) {
    redirect("/unauthorized");
  }

  if (!currentUser.user.moduleAccess[moduleKey]) {
    redirect("/unauthorized");
  }

  return currentUser;
}

export async function assertAdminAccess() {
  const currentUser = await getCurrentUserAccess();

  if (!currentUser?.session?.user) {
    throw createForbiddenError("403 Prohibido: sesion no valida.");
  }

  if (currentUser.user.role !== "ADMIN") {
    throw createForbiddenError("403 Prohibido: solo un administrador puede modificar permisos.");
  }

  return currentUser;
}

export async function assertModuleAccess(
  moduleKey: UserModuleKey,
  allowedRoles?: readonly (Role | string)[]
) {
  const currentUser = await getCurrentUserAccess();

  if (!currentUser?.session?.user) {
    throw createForbiddenError("403 Prohibido: sesion no valida.");
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.user.role)) {
    throw createForbiddenError("403 Prohibido: rol sin acceso al modulo solicitado.");
  }

  if (!currentUser.user.moduleAccess[moduleKey]) {
    throw createForbiddenError("403 Prohibido: acceso al modulo denegado.");
  }

  return currentUser;
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return typeof error === "object" && error !== null && "status" in error && error.status === 403;
}

function createForbiddenError(message: string): ForbiddenError {
  const error = new Error(message) as ForbiddenError;
  error.status = 403;

  return error;
}

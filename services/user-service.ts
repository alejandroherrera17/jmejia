import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import {
  getDefaultModuleAccess,
  moduleAccessSelect,
  normalizeModuleAccess,
  type UserModuleAccessState
} from "@/lib/module-access";
import { prisma } from "@/lib/prisma";

const DEFAULT_ADMIN = {
  name: process.env.ADMIN_NAME || "Administrador General",
  email: process.env.ADMIN_EMAIL || "admin@repuestospro.com",
  password: process.env.ADMIN_PASSWORD || "Admin123*"
} as const;

export async function ensureAdminUser() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { id: true }
  });

  if (existingAdmin) {
    return existingAdmin;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email },
    select: { id: true }
  });

  if (existingByEmail) {
    return existingByEmail;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  return prisma.user.create({
    data: {
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      passwordHash,
      role: Role.ADMIN,
      moduleAccess: {
        create: getDefaultModuleAccess(Role.ADMIN)
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      moduleAccess: {
        select: moduleAccessSelect
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return users.map((user) => ({
    ...user,
    moduleAccess: normalizeModuleAccess(user.moduleAccess, user.role)
  }));
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: input.role,
      moduleAccess: {
        create: getDefaultModuleAccess(input.role)
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
}

export async function updateUser(input: {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  moduleAccess?: UserModuleAccessState;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { id: input.id },
    select: { id: true, email: true }
  });

  if (!existingUser) {
    throw new Error("El usuario que intentas editar ya no existe.");
  }

  const duplicatedEmail = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      id: {
        not: input.id
      }
    },
    select: { id: true }
  });

  if (duplicatedEmail) {
    throw new Error("Ya existe otro usuario con ese correo electronico.");
  }

  const password = input.password?.trim();
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  const normalizedModuleAccess = input.moduleAccess ?? getDefaultModuleAccess(input.role);

  const user = await prisma.user.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      role: input.role,
      ...(passwordHash ? { passwordHash } : {}),
      moduleAccess: {
        upsert: {
          create: normalizedModuleAccess,
          update: normalizedModuleAccess
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      moduleAccess: {
        select: moduleAccessSelect
      }
    }
  });

  return {
    ...user,
    moduleAccess: normalizeModuleAccess(user.moduleAccess, user.role)
  };
}

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    await prisma.user.count();

    return {
      ok: true as const,
      message: "Conexion Prisma y base de datos operativas."
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "No fue posible validar la conexion a la base."
    };
  }
}

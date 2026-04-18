import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

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
      role: Role.ADMIN
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
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

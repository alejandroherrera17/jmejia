import "server-only";

import { PrismaClient } from "@prisma/client";

import { getAuditContext } from "@/lib/audit-context";

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as {
  prisma?: ExtendedPrismaClient;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);

          if (!model || !shouldAudit(model, operation)) {
            return result;
          }

          const { actor } = getAuditContext();

          if (!actor?.userId) {
            return result;
          }

          await client.auditLog.create({
            data: {
              userId: actor.userId,
              userName: actor.userName?.trim() || null,
              action: `${operation.toUpperCase()}_${model.toUpperCase()}`,
              details: buildAuditDetails(model, operation, args)
            }
          });

          return result;
        }
      }
    }
  });
}

const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;

const auditableOperations = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert"
]);

const ignoredModels = new Set(["AuditLog", "Account", "Session", "VerificationToken"]);

function shouldAudit(model: string, operation: string) {
  return auditableOperations.has(operation) && !ignoredModels.has(model);
}

function buildAuditDetails(model: string, operation: string, args: unknown) {
  const normalizedModel = readableModel(model);
  const normalizedOperation = readableOperation(operation);
  const serializedArgs = safeSerializeArgs(args);

  return `${normalizedOperation} ${normalizedModel}. Contexto: ${serializedArgs}`.slice(0, 2000);
}

function readableModel(model: string) {
  return model
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function readableOperation(operation: string) {
  switch (operation) {
    case "create":
    case "createMany":
      return "Creo";
    case "update":
    case "updateMany":
      return "Actualizo";
    case "delete":
    case "deleteMany":
      return "Elimino";
    case "upsert":
      return "Sincronizo";
    default:
      return "Modifico";
  }
}

function safeSerializeArgs(args: unknown) {
  try {
    return JSON.stringify(args, (_key, value) => {
      if (typeof _key === "string" && ["password", "passwordHash"].includes(_key)) {
        return "[REDACTED]";
      }

      if (typeof value === "string" && value.length > 120) {
        return `${value.slice(0, 117)}...`;
      }

      return value;
    });
  } catch {
    return "No fue posible serializar los detalles.";
  }
}

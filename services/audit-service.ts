import { prisma } from "@/lib/prisma";

export async function logAction(userId: string | null, action: string, details: string, userName?: string | null) {
  return prisma.auditLog.create({
    data: {
      userId,
      userName: userName?.trim() || null,
      action,
      details: details.slice(0, 2000)
    }
  });
}

export async function listAuditLogsByUser(userId: string) {
  return prisma.auditLog.findMany({
    where: {
      OR: [{ userId }, { details: { contains: userId } }]
    },
    orderBy: {
      timestamp: "desc"
    },
    take: 50
  });
}

import { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const MAX_EMAIL_ATTEMPTS = 5;
const prismaClient = prisma as PrismaClient;

function getBackoffMinutes(attempts: number) {
  return Math.min(30, Math.max(1, attempts * 2));
}

export async function enqueueInvoiceEmail(saleId: string) {
  console.log("Depuracion Prisma:", {
    keys: Object.keys(prismaClient),
    isInstance: prismaClient instanceof PrismaClient
  });
  console.log("[enqueueInvoiceEmail] prisma.emailJob:", prismaClient.emailJob);

  return prismaClient.emailJob.upsert({
    where: {
      saleId
    },
    create: {
      saleId,
      status: "PENDING",
      attempts: 0,
      availableAt: new Date()
    },
    update: {
      status: "PENDING",
      lastError: null,
      workerId: null,
      lockedAt: null,
      availableAt: new Date()
    }
  });
}

export async function claimNextInvoiceEmailJob(workerId: string) {
  const now = new Date();

  const candidate = await prismaClient.emailJob.findFirst({
    where: {
      status: {
        in: ["PENDING", "FAILED"]
      },
      availableAt: {
        lte: now
      },
      lockedAt: null
    },
    orderBy: [{ createdAt: "asc" }]
  });

  if (!candidate) {
    return null;
  }

  const claimed = await prismaClient.emailJob.updateMany({
    where: {
      id: candidate.id,
      lockedAt: null,
      status: {
        in: ["PENDING", "FAILED"]
      }
    },
    data: {
      status: "PROCESSING",
      workerId,
      lockedAt: now
    }
  });

  if (!claimed.count) {
    return null;
  }

  return prismaClient.emailJob.findUnique({
    where: {
      id: candidate.id
    }
  });
}

export async function markInvoiceEmailJobCompleted(jobId: string) {
  return prismaClient.emailJob.update({
    where: {
      id: jobId
    },
    data: {
      status: "COMPLETED",
      processedAt: new Date(),
      lockedAt: null,
      workerId: null,
      lastError: null
    }
  });
}

export async function markInvoiceEmailJobFailed(jobId: string, errorMessage: string) {
  const job = await prismaClient.emailJob.findUnique({
    where: {
      id: jobId
    },
    select: {
      attempts: true
    }
  });

  if (!job) {
    return null;
  }

  const nextAttempts = job.attempts + 1;
  const exhausted = nextAttempts >= MAX_EMAIL_ATTEMPTS;
  const availableAt = new Date();
  availableAt.setMinutes(availableAt.getMinutes() + getBackoffMinutes(nextAttempts));

  return prismaClient.emailJob.update({
    where: {
      id: jobId
    },
    data: {
      attempts: nextAttempts,
      status: exhausted ? "FAILED" : "PENDING",
      lastError: errorMessage.slice(0, 1000),
      availableAt,
      lockedAt: null,
      workerId: null
    }
  });
}

export async function listQueuedEmailJobs() {
  return prismaClient.emailJob.findMany({
    include: {
      sale: {
        select: {
          id: true,
          invoiceNumber: true,
          customer: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: [{ createdAt: "desc" }],
    take: 50
  });
}

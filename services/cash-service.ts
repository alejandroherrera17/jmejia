import type { CashMovementType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { serializePrismaData } from "@/lib/utils";

export async function getOpenShift() {
  const shift = await prisma.cashShift.findFirst({
    where: { status: "OPEN" },
    include: {
      openedBy: true,
      movements: {
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: {
      openedAt: "desc"
    }
  });

  return serializePrismaData(shift);
}

export async function openCashShift(input: {
  userId: string;
  openingAmount: number;
  notes?: string;
}) {
  const existingShift = await prisma.cashShift.findFirst({
    where: { status: "OPEN" },
    select: { id: true }
  });

  if (existingShift) {
    throw new Error("Ya existe un turno abierto.");
  }

  return prisma.cashShift.create({
    data: {
      openedById: input.userId,
      openingAmount: input.openingAmount,
      notes: input.notes,
      movements: {
        create: {
          userId: input.userId,
          type: "OPENING",
          amount: input.openingAmount,
          concept: "Apertura de turno"
        }
      }
    }
  });
}

export async function registerCashMovement(input: {
  shiftId: string;
  userId: string;
  amount: number;
  concept: string;
  type: CashMovementType;
}) {
  return prisma.cashMovement.create({
    data: input
  });
}

export async function closeCashShift(input: {
  shiftId: string;
  userId: string;
  closingAmount: number;
}) {
  const shift = await prisma.cashShift.findUnique({
    where: { id: input.shiftId },
    include: { movements: true }
  });

  if (!shift) {
    throw new Error("Turno no encontrado.");
  }

  if (shift.status === "CLOSED") {
    throw new Error("El turno ya fue cerrado.");
  }

  const expectedAmount =
    shift.movements.reduce((acc, movement) => acc + Number(movement.amount), 0);

  return prisma.cashShift.update({
    where: { id: input.shiftId },
    data: {
      status: "CLOSED",
      closingAmount: input.closingAmount,
      expectedAmount,
      difference: input.closingAmount - expectedAmount,
      closedAt: new Date(),
      movements: {
        create: {
          userId: input.userId,
          type: "CLOSING",
          amount: input.closingAmount,
          concept: "Cierre de turno"
        }
      }
    }
  });
}

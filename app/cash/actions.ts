"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/permissions";
import { cashShiftSchema } from "@/lib/validations";
import { closeCashShift, openCashShift, registerCashMovement } from "@/services/cash-service";

export async function openShiftAction(input: unknown) {
  const session = await requireRole(["ADMIN", "CAJERO"]);
  const values = cashShiftSchema.parse(input);

  await openCashShift({
    userId: session.user.id,
    openingAmount: values.openingAmount,
    notes: values.notes
  });

  revalidatePath("/cash");
  revalidatePath("/dashboard");
}

export async function registerMovementAction(input: {
  shiftId: string;
  amount: number;
  concept: string;
  type: "EXPENSE" | "INCOME" | "ADJUSTMENT";
}) {
  const session = await requireRole(["ADMIN", "CAJERO"]);
  const concept = input.concept.trim();

  if (!concept) {
    throw new Error("El concepto del movimiento es obligatorio.");
  }

  await registerCashMovement({
    ...input,
    concept,
    userId: session.user.id
  });

  revalidatePath("/cash");
}

export async function closeShiftAction(input: { shiftId: string; closingAmount: number }) {
  const session = await requireRole(["ADMIN", "CAJERO"]);

  await closeCashShift({
    ...input,
    userId: session.user.id
  });

  revalidatePath("/cash");
  revalidatePath("/dashboard");
}

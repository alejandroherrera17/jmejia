"use server";

import { revalidatePath } from "next/cache";

import { withAuditContext } from "@/lib/audit-context";
import { assertModuleAccess } from "@/lib/permissions";
import { cashShiftSchema } from "@/lib/validations";
import { closeCashShift, openCashShift, registerCashMovement } from "@/services/cash-service";

export async function openShiftAction(input: unknown) {
  const currentUser = await assertModuleAccess("cash", ["ADMIN", "CAJERO"]);
  const values = cashShiftSchema.parse(input);

  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await openCashShift({
        userId: currentUser.user.id,
        openingAmount: values.openingAmount,
        notes: values.notes
      });
    }
  );

  revalidatePath("/cash");
  revalidatePath("/dashboard");
}

export async function registerMovementAction(input: {
  shiftId: string;
  amount: number;
  concept: string;
  type: "EXPENSE" | "INCOME" | "ADJUSTMENT";
}) {
  const currentUser = await assertModuleAccess("cash", ["ADMIN", "CAJERO"]);
  const concept = input.concept.trim();

  if (!concept) {
    throw new Error("El concepto del movimiento es obligatorio.");
  }

  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await registerCashMovement({
        ...input,
        concept,
        userId: currentUser.user.id
      });
    }
  );

  revalidatePath("/cash");
}

export async function closeShiftAction(input: { shiftId: string; closingAmount: number }) {
  const currentUser = await assertModuleAccess("cash", ["ADMIN", "CAJERO"]);

  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await closeCashShift({
        ...input,
        userId: currentUser.user.id
      });
    }
  );

  revalidatePath("/cash");
  revalidatePath("/dashboard");
}

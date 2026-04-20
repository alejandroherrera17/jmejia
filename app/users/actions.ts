"use server";

import { revalidatePath } from "next/cache";

import { withAuditContext } from "@/lib/audit-context";
import { assertAdminAccess, assertModuleAccess } from "@/lib/permissions";
import { createUserSchema, updateUserSchema } from "@/lib/validations";
import { listAuditLogsByUser } from "@/services/audit-service";
import { createUser, updateUser } from "@/services/user-service";
import { serializePrismaData } from "@/lib/utils";

export async function createUserAction(input: unknown) {
  const currentUser = await assertModuleAccess("users", ["ADMIN"]);
  const values = createUserSchema.parse(input);

  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await createUser(values);
    }
  );
  revalidatePath("/users");
}

export async function updateUserAction(input: unknown) {
  const currentUser = await assertModuleAccess("users", ["ADMIN"]);
  const values = updateUserSchema.parse(input);

  if (values.moduleAccess) {
    await assertAdminAccess();
  }

  const user = await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => updateUser(values)
  );
  revalidatePath("/users");

  return serializePrismaData(user);
}

export async function getUserAuditLogsAction(userId: string) {
  await assertModuleAccess("users", ["ADMIN"]);

  const logs = await listAuditLogsByUser(userId);
  return serializePrismaData(logs);
}

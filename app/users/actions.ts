"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/permissions";
import { createUserSchema } from "@/lib/validations";
import { createUser } from "@/services/user-service";

export async function createUserAction(input: unknown) {
  await requireRole(["ADMIN"]);
  const values = createUserSchema.parse(input);

  await createUser(values);
  revalidatePath("/users");
}

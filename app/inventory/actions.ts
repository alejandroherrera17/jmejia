"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/permissions";
import { productSchema } from "@/lib/validations";
import { createProduct } from "@/services/inventory-service";

export async function createProductAction(input: unknown) {
  await requireRole(["ADMIN", "BODEGUERO"]);
  const values = productSchema.parse(input);

  await createProduct(values);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

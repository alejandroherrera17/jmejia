"use server";

import { revalidatePath } from "next/cache";

import { withAuditContext } from "@/lib/audit-context";
import { assertModuleAccess } from "@/lib/permissions";
import {
  barcodeLookupSchema,
  inventoryEntrySchema,
  productSchema,
  updateProductSchema
} from "@/lib/validations";
import {
  createProduct,
  deleteProduct,
  findProductByBarcode,
  registerInventoryEntry,
  updateProduct
} from "@/services/inventory-service";

export async function createProductAction(input: unknown) {
  const currentUser = await assertModuleAccess("inventory", ["ADMIN", "BODEGUERO"]);
  const values = productSchema.parse(input);

  const product = await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => createProduct(values)
  );
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return product;
}

export async function updateProductAction(input: unknown) {
  const currentUser = await assertModuleAccess("inventory", ["ADMIN", "BODEGUERO"]);
  const values = updateProductSchema.parse(input);

  const product = await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => updateProduct(values.id, values)
  );
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return product;
}

export async function deleteProductAction(input: { id: string }) {
  const currentUser = await assertModuleAccess("inventory", ["ADMIN", "BODEGUERO"]);

  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await deleteProduct(input.id);
    }
  );
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function findProductByBarcodeAction(input: unknown) {
  await assertModuleAccess("inventory", ["ADMIN", "BODEGUERO"]);
  const values = barcodeLookupSchema.parse(input);

  return findProductByBarcode(values.barcode);
}

export async function registerInventoryEntryAction(input: unknown) {
  const currentUser = await assertModuleAccess("inventory", ["ADMIN", "BODEGUERO"]);
  const values = inventoryEntrySchema.parse(input);

  const products = await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => registerInventoryEntry(values.items)
  );
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return products;
}

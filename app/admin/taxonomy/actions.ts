"use server";

import { revalidatePath } from "next/cache";

import { withAuditContext } from "@/lib/audit-context";
import { assertModuleAccess } from "@/lib/permissions";
import { categorySchema, subcategorySchema } from "@/lib/validations";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  updateCategory,
  updateSubcategory
} from "@/services/taxonomy-service";

export async function createCategoryAction(input: unknown) {
  const currentUser = await assertModuleAccess("taxonomy", ["ADMIN"]);
  const values = categorySchema.parse(input);
  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await createCategory(values);
    }
  );
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function updateCategoryAction(id: string, input: unknown) {
  const currentUser = await assertModuleAccess("taxonomy", ["ADMIN"]);
  const values = categorySchema.parse(input);
  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await updateCategory(id, values);
    }
  );
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function deleteCategoryAction(id: string) {
  const currentUser = await assertModuleAccess("taxonomy", ["ADMIN"]);
  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await deleteCategory(id);
    }
  );
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function createSubcategoryAction(input: unknown) {
  const currentUser = await assertModuleAccess("taxonomy", ["ADMIN"]);
  const values = subcategorySchema.parse(input);
  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await createSubcategory(values);
    }
  );
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function updateSubcategoryAction(id: string, input: unknown) {
  const currentUser = await assertModuleAccess("taxonomy", ["ADMIN"]);
  const values = subcategorySchema.parse(input);
  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await updateSubcategory(id, values);
    }
  );
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function deleteSubcategoryAction(id: string) {
  const currentUser = await assertModuleAccess("taxonomy", ["ADMIN"]);
  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await deleteSubcategory(id);
    }
  );
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/permissions";
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
  await requireRole(["ADMIN"]);
  const values = categorySchema.parse(input);
  await createCategory(values);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function updateCategoryAction(id: string, input: unknown) {
  await requireRole(["ADMIN"]);
  const values = categorySchema.parse(input);
  await updateCategory(id, values);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function deleteCategoryAction(id: string) {
  await requireRole(["ADMIN"]);
  await deleteCategory(id);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function createSubcategoryAction(input: unknown) {
  await requireRole(["ADMIN"]);
  const values = subcategorySchema.parse(input);
  await createSubcategory(values);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function updateSubcategoryAction(id: string, input: unknown) {
  await requireRole(["ADMIN"]);
  const values = subcategorySchema.parse(input);
  await updateSubcategory(id, values);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

export async function deleteSubcategoryAction(id: string) {
  await requireRole(["ADMIN"]);
  await deleteSubcategory(id);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/inventory");
}

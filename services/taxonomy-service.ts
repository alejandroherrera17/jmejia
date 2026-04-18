import { prisma } from "@/lib/prisma";
import type { CategoryFormValues, SubcategoryFormValues } from "@/lib/validations";

export async function getTaxonomyOverview() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          subcategories: true
        }
      },
      subcategories: {
        include: {
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return categories;
}

export async function createCategory(values: CategoryFormValues) {
  return prisma.category.create({
    data: {
      name: values.name.trim(),
      description: values.description?.trim() || null
    }
  });
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  return prisma.category.update({
    where: { id },
    data: {
      name: values.name.trim(),
      description: values.description?.trim() || null
    }
  });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subcategories: true
        }
      }
    }
  });

  if (!category) {
    throw new Error("La categoria no existe.");
  }

  if (category._count.subcategories > 0) {
    throw new Error("No puedes eliminar una categoria que aun tiene subcategorias.");
  }

  return prisma.category.delete({
    where: { id }
  });
}

export async function createSubcategory(values: SubcategoryFormValues) {
  return prisma.subcategory.create({
    data: {
      categoryId: values.categoryId,
      name: values.name.trim(),
      description: values.description?.trim() || null
    }
  });
}

export async function updateSubcategory(id: string, values: SubcategoryFormValues) {
  return prisma.subcategory.update({
    where: { id },
    data: {
      categoryId: values.categoryId,
      name: values.name.trim(),
      description: values.description?.trim() || null
    }
  });
}

export async function deleteSubcategory(id: string) {
  const subcategory = await prisma.subcategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!subcategory) {
    throw new Error("La subcategoria no existe.");
  }

  if (subcategory._count.products > 0) {
    throw new Error("No puedes eliminar una subcategoria que aun tiene productos.");
  }

  return prisma.subcategory.delete({
    where: { id }
  });
}

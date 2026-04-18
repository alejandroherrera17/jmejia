import { subMonths } from "date-fns";

import { prisma } from "@/lib/prisma";
import { buildBarcode } from "@/lib/utils";
import type { ProductFormValues } from "@/lib/validations";

export async function getInventoryOverview() {
  const [products, staleProducts, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 12
    }),
    prisma.product.findMany({
      where: {
        saleItems: {
          none: {
            sale: {
              createdAt: {
                gte: subMonths(new Date(), 3)
              }
            }
          }
        }
      },
      take: 8,
      orderBy: {
        updatedAt: "asc"
      }
    }),
    prisma.category.findMany({
      include: {
        subcategories: true
      },
      orderBy: {
        name: "asc"
      }
    })
  ]);

  const lowStockCount = products.filter((product) => product.stock <= product.minStock).length;

  return {
    products,
    lowStockCount,
    staleProducts,
    categories
  };
}

export async function createProduct(values: ProductFormValues) {
  const barcode = values.barcode?.trim() || (await generateUniqueBarcode());

  return prisma.product.create({
    data: {
      ...values,
      barcode
    }
  });
}

async function generateUniqueBarcode() {
  // Keep barcode generation inside Prisma-backed logic so serverless instances stay consistent.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const barcode = buildBarcode("REP", Date.now() % 100000 + attempt);
    const existing = await prisma.product.findUnique({
      where: { barcode },
      select: { id: true }
    });

    if (!existing) {
      return barcode;
    }
  }

  return buildBarcode();
}

export async function getLowStockAlerts() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 50
  });

  return products
    .filter((product) => product.stock <= product.minStock)
    .sort((left, right) => left.stock - right.stock)
    .slice(0, 10);
}

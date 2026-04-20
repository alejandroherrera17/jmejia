import { subMonths } from "date-fns";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildBarcode, serializePrismaData } from "@/lib/utils";
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
      }
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
    products: serializePrismaData(products),
    lowStockCount,
    staleProducts: serializePrismaData(staleProducts),
    categories: serializePrismaData(categories)
  };
}

export async function createProduct(values: ProductFormValues) {
  const barcode = values.barcode?.trim() || (await generateUniqueBarcode());

  try {
    const product = await prisma.product.create({
      data: {
        ...normalizeProductInput(values),
        barcode
      },
      include: inventoryProductInclude
    });

    return serializePrismaData(product);
  } catch (error) {
    throw mapInventoryError(error);
  }
}

export async function updateProduct(id: string, values: ProductFormValues) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: normalizeProductInput(values),
      include: inventoryProductInclude
    });

    return serializePrismaData(product);
  } catch (error) {
    throw mapInventoryError(error);
  }
}

export async function deleteProduct(id: string) {
  const saleItem = await prisma.saleItem.findFirst({
    where: { productId: id },
    select: { id: true }
  });

  if (saleItem) {
    throw new Error("No puedes eliminar un producto que ya tiene ventas registradas.");
  }

  try {
    await prisma.product.delete({
      where: { id }
    });
  } catch (error) {
    throw mapInventoryError(error);
  }
}

export async function findProductByBarcode(barcode: string) {
  const product = await prisma.product.findUnique({
    where: {
      barcode: barcode.trim()
    },
    include: inventoryProductInclude
  });

  return product ? serializePrismaData(product) : null;
}

export async function registerInventoryEntry(
  items: Array<{
    productId: string;
    quantity: number;
  }>
) {
  const updatedProducts = await prisma.$transaction(async (tx) => {
    const products = await Promise.all(
      items.map((item) =>
        tx.product.findUnique({
          where: { id: item.productId },
          include: inventoryProductInclude
        })
      )
    );

    if (products.some((product) => !product)) {
      throw new Error("Uno de los productos ya no existe en la base de datos.");
    }

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          reason: "Ingreso de mercancia",
          notes: "Entrada registrada desde el escaner de bodega."
        }
      });
    }

    return tx.product.findMany({
      where: {
        id: {
          in: items.map((item) => item.productId)
        }
      },
      include: inventoryProductInclude
    });
  });

  return serializePrismaData(updatedProducts);
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
    .slice(0, 10)
    .map((product) => serializePrismaData(product));
}

function normalizeProductInput(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    sku: values.sku.trim().toUpperCase(),
    barcode: values.barcode?.trim() || undefined,
    brand: values.brand?.trim() || null,
    imageUrl: values.imageUrl?.trim() || null,
    description: values.description?.trim() || null,
    unit: values.unit.trim().toUpperCase(),
    cost: new Prisma.Decimal(values.cost),
    price: new Prisma.Decimal(values.price),
    stock: values.stock,
    minStock: values.minStock,
    subcategoryId: values.subcategoryId
  };
}

function mapInventoryError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "campo unico";
    return new Error(`Ya existe un producto con el mismo ${target}.`);
  }

  return error instanceof Error ? error : new Error("No fue posible completar la operacion.");
}

const inventoryProductInclude = {
  subcategory: {
    include: {
      category: true
    }
  }
} as const;

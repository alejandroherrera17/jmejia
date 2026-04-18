import { startOfMonth } from "date-fns";

import { prisma } from "@/lib/prisma";
import { serializePrismaData } from "@/lib/utils";

export async function getDashboardMetrics() {
  const monthStart = startOfMonth(new Date());

  const [salesToday, monthSales, activeProducts, openShift, staleProducts] =
    await Promise.all([
      prisma.sale.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.sale.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: monthStart
          }
        }
      }),
      prisma.product.count({
        where: {
          status: "ACTIVE"
        }
      }),
      prisma.cashShift.findFirst({
        where: {
          status: "OPEN"
        },
        include: {
          movements: true,
          openedBy: true
        },
        orderBy: {
          openedAt: "desc"
        }
      }),
      prisma.product.count({
        where: {
          saleItems: {
            none: {
              sale: {
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      })
    ]);

  return {
    salesToday: Number(salesToday._sum.total ?? 0),
    monthSales: Number(monthSales._sum.total ?? 0),
    activeProducts,
    openShift: serializePrismaData(openShift),
    staleProducts
  };
}

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatCurrency, serializePrismaData } from "@/lib/utils";
import type { CreateSaleValues, CustomerUpsertValues } from "@/lib/validations";

const IVA_RATE = 0.19;
const IVA_DECIMAL = new Prisma.Decimal("0.19");

type TransactionClient = Prisma.TransactionClient;

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function buildInvoiceNumber() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ];
  const randomSuffix = Math.floor(Math.random() * 9000) + 1000;

  return `FAC-${parts.join("")}-${randomSuffix}`;
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toMoneyDecimal(value: number | string | Prisma.Decimal) {
  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(String(value));
}

function roundMoneyDecimal(value: Prisma.Decimal) {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

async function lookupCustomerByDocumentRaw(documentId: string) {
  return prisma.customer.findUnique({
    where: {
      documentId
    }
  });
}

export async function searchProducts(term: string) {
  const normalizedTerm = term.trim();

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: normalizedTerm
        ? [
            { name: { contains: normalizedTerm, mode: "insensitive" } },
            { sku: { contains: normalizedTerm, mode: "insensitive" } },
            { barcode: { contains: normalizedTerm, mode: "insensitive" } }
          ]
        : undefined
    },
    take: 8,
    orderBy: [{ stock: "desc" }, { name: "asc" }]
  });

  return serializePrismaData(products);
}

export async function lookupCustomerByDocument(documentId: string) {
  const normalizedDocument = documentId.trim();
  if (!normalizedDocument) {
    return null;
  }

  const customer = await lookupCustomerByDocumentRaw(normalizedDocument);

  return serializePrismaData(customer);
}

export async function getOrCreateCustomer(input: CustomerUpsertValues) {
  const documentId = input.documentId.trim();
  const existingCustomer = await lookupCustomerByDocumentRaw(documentId);

  if (existingCustomer) {
    return serializePrismaData(existingCustomer);
  }

  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const email = normalizeOptionalString(input.email);

  if (!firstName || !lastName || !email) {
    throw new Error(
      "El cliente no existe. Completa nombre, apellido y correo para registrarlo."
    );
  }

  const customer = await prisma.customer.create({
    data: {
      documentId,
      firstName,
      lastName,
      email,
      phone: normalizeOptionalString(input.phone)
    }
  });

  return serializePrismaData(customer);
}

async function getOpenShiftForCashier(tx: TransactionClient, cashierId: string) {
  return tx.cashShift.findFirst({
    where: {
      openedById: cashierId,
      status: "OPEN"
    },
    select: {
      id: true
    },
    orderBy: {
      openedAt: "desc"
    }
  });
}

export async function createSale(input: CreateSaleValues & { cashierId: string }) {
  const invoiceNumber = buildInvoiceNumber();

  return prisma.$transaction(async (tx) => {
    const openShift = await getOpenShiftForCashier(tx, input.cashierId);

    if (!openShift) {
      throw new Error("No hay un turno de caja abierto para este cajero.");
    }

    const preparedItems: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }> = [];

    let computedSubtotal = new Prisma.Decimal(0);

    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          stock: true,
          status: true
        }
      });

      if (!product || product.status !== "ACTIVE") {
        throw new Error("Uno de los productos ya no esta disponible para la venta.");
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`);
      }

      const unitPrice = roundMoneyDecimal(toMoneyDecimal(item.unitPrice));
      const lineTotal = roundMoneyDecimal(unitPrice.mul(item.quantity));
      computedSubtotal = roundMoneyDecimal(computedSubtotal.add(lineTotal));

      preparedItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal
      });
    }

    const receivedSubtotal = roundMoneyDecimal(toMoneyDecimal(input.subtotal));

    if (!receivedSubtotal.equals(computedSubtotal)) {
      throw new Error("El subtotal recibido no coincide con el calculado por el servidor.");
    }

    const discount = roundMoneyDecimal(toMoneyDecimal(input.discount));
    const tax = roundMoneyDecimal(computedSubtotal.mul(IVA_DECIMAL));
    const total = roundMoneyDecimal(computedSubtotal.add(tax).sub(discount));

    if (total.lessThan(0)) {
      throw new Error("El total de la venta no puede ser negativo.");
    }

    const cashReceived =
      input.cashReceived != null ? roundMoneyDecimal(toMoneyDecimal(input.cashReceived)) : null;

    if (
      input.paymentMethod === "cash" &&
      cashReceived != null &&
      cashReceived.lessThan(total)
    ) {
      throw new Error("El efectivo recibido no cubre el total de la venta.");
    }

    const change =
      cashReceived != null
        ? cashReceived.greaterThan(total)
          ? roundMoneyDecimal(cashReceived.sub(total))
          : new Prisma.Decimal(0)
        : null;

    for (const item of preparedItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          reason: "SALE",
          notes: `Salida por venta ${invoiceNumber}`
        }
      });
    }

    const normalizedNotes = [normalizeOptionalString(input.notes), `Pago: ${input.paymentMethod}`]
      .filter(Boolean)
      .join(" | ");

    const sale = await tx.sale.create({
      data: {
        invoiceNumber,
        customerId: input.customerId ?? null,
        cashierId: input.cashierId,
        subtotal: computedSubtotal,
        tax,
        discount,
        total,
        cashReceived,
        change,
        notes: normalizedNotes || null,
        items: {
          create: preparedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.lineTotal
          }))
        }
      },
      include: {
        customer: true,
        cashier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    await tx.cashMovement.create({
      data: {
        shiftId: openShift.id,
        userId: input.cashierId,
        type: "SALE",
        amount: total,
        concept: `Venta ${invoiceNumber}`
      }
    });

    return sale;
  });
}

export async function getRecentSales() {
  const sales = await prisma.sale.findMany({
    include: {
      customer: true,
      cashier: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 8
  });

  return serializePrismaData(sales);
}

export async function getSaleForInvoice(saleId: string) {
  return prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      cashier: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });
}

export function buildPosReceipt(input: {
  invoiceNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; total: number }>;
  total: number;
}) {
  const lines = [
    "REPUESTOS CENTRAL",
    "Nit. 900123456",
    `Factura: ${input.invoiceNumber}`,
    `Cliente: ${input.customerName}`,
    "--------------------------------",
    ...input.items.map(
      (item) => `${item.quantity} x ${item.name}  ${formatCurrency(item.total)}`
    ),
    "--------------------------------",
    `TOTAL ${formatCurrency(input.total)}`,
    "Gracias por tu compra"
  ];

  return lines.join("\n");
}

export function buildInvoiceHtml(input: {
  invoiceNumber: string;
  customerName: string;
  cashierName: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}) {
  const rows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.total)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <html>
      <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
        <h1>Factura ${input.invoiceNumber}</h1>
        <p>Cliente: ${input.customerName}</p>
        <p>Cajero: ${input.cashierName}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;background:#f8fafc;">Producto</th>
              <th style="padding:8px;background:#f8fafc;">Cant.</th>
              <th style="text-align:right;padding:8px;background:#f8fafc;">Unitario</th>
              <th style="text-align:right;padding:8px;background:#f8fafc;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:24px;text-align:right;">
          <p>Subtotal: ${formatCurrency(input.subtotal)}</p>
          <p>IVA 19%: ${formatCurrency(input.tax)}</p>
          <p>Descuento: ${formatCurrency(input.discount)}</p>
          <strong>Total: ${formatCurrency(input.total)}</strong>
        </div>
      </body>
    </html>
  `;
}

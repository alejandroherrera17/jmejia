import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export async function searchProducts(term: string) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { barcode: { contains: term, mode: "insensitive" } }
      ]
    },
    take: 8,
    orderBy: {
      stock: "desc"
    }
  });
}

export async function lookupCustomerByDocument(documentId: string) {
  return prisma.customer.findUnique({
    where: {
      documentId
    }
  });
}

export async function getRecentSales() {
  return prisma.sale.findMany({
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
          <p>Impuesto: ${formatCurrency(input.tax)}</p>
          <strong>Total: ${formatCurrency(input.total)}</strong>
        </div>
      </body>
    </html>
  `;
}

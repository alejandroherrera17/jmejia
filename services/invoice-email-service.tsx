import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer
} from "@react-pdf/renderer";

import { formatCurrency } from "@/lib/utils";
import { buildInvoiceHtml, getSaleForInvoice } from "@/services/sales-service";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    color: "#0f172a"
  },
  title: {
    fontSize: 20,
    marginBottom: 12
  },
  meta: {
    marginBottom: 4
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  headerCell: {
    backgroundColor: "#e2e8f0",
    fontWeight: 700
  },
  cell: {
    padding: 8
  },
  productCell: {
    width: "46%"
  },
  qtyCell: {
    width: "14%",
    textAlign: "center"
  },
  priceCell: {
    width: "20%",
    textAlign: "right"
  },
  totalCell: {
    width: "20%",
    textAlign: "right"
  },
  totals: {
    marginTop: 18,
    alignItems: "flex-end",
    gap: 4
  }
});

function InvoicePdfDocument(input: {
  invoiceNumber: string;
  customerName: string;
  cashierName: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Factura {input.invoiceNumber}</Text>
        <Text style={styles.meta}>Cliente: {input.customerName}</Text>
        <Text style={styles.meta}>Cajero: {input.cashierName}</Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.productCell, styles.headerCell]}>Producto</Text>
            <Text style={[styles.cell, styles.qtyCell, styles.headerCell]}>Cant.</Text>
            <Text style={[styles.cell, styles.priceCell, styles.headerCell]}>Unitario</Text>
            <Text style={[styles.cell, styles.totalCell, styles.headerCell]}>Total</Text>
          </View>

          {input.items.map((item) => (
            <View key={`${item.name}-${item.quantity}`} style={styles.row}>
              <Text style={[styles.cell, styles.productCell]}>{item.name}</Text>
              <Text style={[styles.cell, styles.qtyCell]}>{item.quantity}</Text>
              <Text style={[styles.cell, styles.priceCell]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.cell, styles.totalCell]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text>Subtotal: {formatCurrency(input.subtotal)}</Text>
          <Text>IVA 19%: {formatCurrency(input.tax)}</Text>
          <Text>Descuento: {formatCurrency(input.discount)}</Text>
          <Text>Total: {formatCurrency(input.total)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function sendInvoiceEmail(saleId: string) {
  const sale = await getSaleForInvoice(saleId);

  if (!sale) {
    throw new Error("La venta no existe o no se pudo cargar para el correo.");
  }

  if (!sale.customer?.email) {
    return {
      sent: false,
      reason: "El cliente no tiene correo registrado."
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.POS_FROM_EMAIL;
  const businessName = process.env.BUSINESS_NAME ?? "ERP Repuestos Pro";

  if (!apiKey || !fromEmail) {
    console.warn(
      "Correo de factura omitido: faltan RESEND_API_KEY o POS_FROM_EMAIL en el entorno."
    );

    return {
      sent: false,
      reason: "Servicio de correo no configurado."
    };
  }

  const invoiceData = {
    invoiceNumber: sale.invoiceNumber,
    customerName: `${sale.customer?.firstName ?? "Consumidor"} ${sale.customer?.lastName ?? "Final"}`.trim(),
    cashierName: sale.cashier.name,
    subtotal: Number(sale.subtotal),
    tax: Number(sale.tax),
    discount: Number(sale.discount),
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total)
    }))
  };

  const html = buildInvoiceHtml(invoiceData);
  const pdfBuffer = await renderToBuffer(<InvoicePdfDocument {...invoiceData} />);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [sale.customer.email],
      subject: `Tu Factura de Compra - ${businessName}`,
      html,
      attachments: [
        {
          filename: `${sale.invoiceNumber}.pdf`,
          content: pdfBuffer.toString("base64")
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`No se pudo enviar el correo de la factura: ${errorBody}`);
  }

  return {
    sent: true
  };
}

"use server";

import { revalidatePath } from "next/cache";

import { withAuditContext } from "@/lib/audit-context";
import { assertModuleAccess } from "@/lib/permissions";
import { serializePrismaData } from "@/lib/utils";
import {
  createSaleSchema,
  customerLookupSchema,
  customerUpsertSchema
} from "@/lib/validations";
import { enqueueInvoiceEmail } from "@/services/email-queue-service";
import {
  createSale,
  getOrCreateCustomer,
  lookupCustomerByDocument
} from "@/services/sales-service";

export async function lookupCustomerAction(input: { documentId: string }) {
  await assertModuleAccess("sales", ["ADMIN", "CAJERO"]);
  const values = customerLookupSchema.parse(input);

  return lookupCustomerByDocument(values.documentId);
}

export async function searchOrCreateCustomerAction(input: {
  documentId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}) {
  const currentUser = await assertModuleAccess("sales", ["ADMIN", "CAJERO"]);
  const documentId = input.documentId.trim();

  if (!documentId) {
    throw new Error("El documento del cliente es obligatorio.");
  }

  const existingCustomer = await lookupCustomerByDocument(documentId);
  if (existingCustomer) {
    return {
      status: "found" as const,
      customer: existingCustomer,
      customerId: existingCustomer.id
    };
  }

  const hasRegistrationData = [input.firstName, input.lastName, input.email].every((value) =>
    Boolean(value?.trim())
  );

  if (!hasRegistrationData) {
    return {
      status: "requires_registration" as const,
      customer: null,
      customerId: null,
      documentId
    };
  }

  const values = customerUpsertSchema.parse(input);
  const customer = await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => getOrCreateCustomer(values)
  );

  revalidatePath("/sales");

  return {
    status: "created" as const,
    customer,
    customerId: customer.id
  };
}

export async function getOrCreateCustomerAction(input: {
  documentId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}) {
  const result = await searchOrCreateCustomerAction(input);

  if (result.status === "requires_registration") {
    throw new Error(
      "El cliente no existe. Completa nombre, apellido y correo para registrarlo."
    );
  }

  return result.customer;
}

export async function processSaleAction(input: {
  customerId?: string | null;
  subtotal: number;
  discount?: number;
  cashReceived?: number | null;
  paymentMethod?: "qr" | "card" | "cash" | "split";
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  const currentUser = await assertModuleAccess("sales", ["ADMIN", "CAJERO"]);
  const values = createSaleSchema.parse(input);

  const sale = await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () =>
      createSale({
        ...values,
        cashierId: currentUser.user.id
      })
  );

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/cash");
  revalidatePath("/dashboard");

  await withAuditContext(
    {
      userId: currentUser.user.id,
      userName: currentUser.user.name
    },
    async () => {
      await enqueueInvoiceEmail(sale.id);
    }
  );

  return serializePrismaData({
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    total: sale.total,
    tax: sale.tax,
    subtotal: sale.subtotal,
    customerEmail: sale.customer?.email ?? null
  });
}

export const createSaleAction = processSaleAction;

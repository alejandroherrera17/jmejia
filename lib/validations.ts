import { Role } from "@prisma/client";
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Ingresa un correo valido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres")
});

export const productSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio"),
  sku: z.string().min(3, "El SKU es obligatorio"),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().default("UND"),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  minStock: z.coerce.number().int().min(0, "El stock minimo no puede ser negativo"),
  subcategoryId: z.string().min(1, "Selecciona una subcategoria")
});

export const customerLookupSchema = z.object({
  documentId: z.string().min(6, "Ingresa una cedula valida")
});

export const customerUpsertSchema = z.object({
  documentId: z.string().min(6, "Ingresa una cedula o NIT valido"),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().email("Ingresa un correo valido").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal(""))
});

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero"),
  unitPrice: z.coerce.number().min(0, "El precio unitario no puede ser negativo")
});

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  subtotal: z.coerce.number().min(0, "El subtotal no puede ser negativo"),
  discount: z.coerce.number().min(0, "El descuento no puede ser negativo").default(0),
  cashReceived: z.coerce
    .number()
    .min(0, "El valor recibido no puede ser negativo")
    .optional()
    .nullable(),
  paymentMethod: z.enum(["qr", "card", "cash", "split"]).default("cash"),
  notes: z.string().max(500, "Las notas son demasiado largas").optional().or(z.literal("")),
  items: z.array(saleItemSchema).min(1, "Agrega al menos un producto")
});

export const cashShiftSchema = z.object({
  openingAmount: z.coerce.number().min(0, "El monto inicial no puede ser negativo"),
  notes: z.string().optional()
});

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  description: z.string().max(300, "La descripcion es demasiado larga").optional().or(z.literal(""))
});

export const subcategorySchema = z.object({
  categoryId: z.string().min(1, "Selecciona una categoria"),
  name: z.string().min(2, "El nombre es obligatorio"),
  description: z.string().max(300, "La descripcion es demasiado larga").optional().or(z.literal(""))
});

export const createUserSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio"),
  email: z.string().email("Ingresa un correo valido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  role: z.nativeEnum(Role)
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;
export type CustomerUpsertValues = z.infer<typeof customerUpsertSchema>;
export type CreateSaleValues = z.infer<typeof createSaleSchema>;

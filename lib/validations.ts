import { z } from "zod";
import { Role } from "@prisma/client";

export const signInSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
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
  minStock: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo"),
  subcategoryId: z.string().min(1, "Selecciona una subcategoría")
});

export const customerLookupSchema = z.object({
  documentId: z.string().min(6, "Ingresa una cédula válida")
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

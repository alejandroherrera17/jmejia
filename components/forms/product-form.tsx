"use client";

import { startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createProductAction } from "@/app/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productSchema, type ProductFormValues } from "@/lib/validations";

type SubcategoryOption = {
  id: string;
  name: string;
  categoryName: string;
};

export function ProductForm({
  subcategories
}: Readonly<{
  subcategories: SubcategoryOption[];
}>) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: "UND",
      stock: 0,
      minStock: 5
    },
    mode: "onChange"
  });

  async function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
      await createProductAction(values);
      reset();
      toast.success("Producto creado correctamente.");
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input {...register("name")} placeholder="Pastilla de freno delantera" />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">SKU</label>
          <Input {...register("sku")} placeholder="PDF-001" />
          {errors.sku ? <p className="text-xs text-destructive">{errors.sku.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Marca</label>
          <Input {...register("brand")} placeholder="Bosch" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Barcode</label>
          <Input {...register("barcode")} placeholder="Se genera REP-XXXXX si se deja vacio" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Costo</label>
          <Input {...register("cost")} type="number" min="0" />
          {errors.cost ? <p className="text-xs text-destructive">{errors.cost.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio</label>
          <Input {...register("price")} type="number" min="0" />
          {errors.price ? <p className="text-xs text-destructive">{errors.price.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock</label>
          <Input {...register("stock")} type="number" min="0" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Minimo</label>
          <Input {...register("minStock")} type="number" min="0" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Subcategoria</label>
          <select
            {...register("subcategoryId")}
            className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="">Seleccionar</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.categoryName} / {subcategory.name}
              </option>
            ))}
          </select>
          {errors.subcategoryId ? (
            <p className="text-xs text-destructive">{errors.subcategoryId.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion</label>
        <textarea
          {...register("description")}
          className="min-h-28 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
          placeholder="Compatibilidades, observaciones o caracteristicas del repuesto."
        />
      </div>

      <Button className="w-full md:w-auto" type="submit" disabled={isSubmitting}>
        Guardar producto
      </Button>
    </form>
  );
}

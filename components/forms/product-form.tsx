"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createProductAction, updateProductAction } from "@/app/inventory/actions";
import { ImageUploader } from "@/components/forms/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productSchema, type ProductFormValues } from "@/lib/validations";

type SubcategoryOption = {
  id: string;
  name: string;
  categoryName: string;
};

type EditableProduct = ProductFormValues & {
  id: string;
};

export function ProductForm({
  subcategories,
  product,
  initialValues,
  submitLabel = "Guardar producto",
  successMessage,
  onSaved
}: Readonly<{
  subcategories: SubcategoryOption[];
  product?: EditableProduct;
  initialValues?: Partial<ProductFormValues>;
  submitLabel?: string;
  successMessage?: string;
  onSaved?: (product: unknown) => void;
}>) {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      name: product?.name ?? initialValues?.name ?? "",
      sku: product?.sku ?? initialValues?.sku ?? "",
      barcode: product?.barcode ?? initialValues?.barcode ?? "",
      brand: product?.brand ?? initialValues?.brand ?? "",
      imageUrl: product?.imageUrl ?? initialValues?.imageUrl ?? "",
      description: product?.description ?? initialValues?.description ?? "",
      unit: product?.unit ?? initialValues?.unit ?? "UND",
      cost: product?.cost ?? initialValues?.cost ?? 0,
      price: product?.price ?? initialValues?.price ?? 0,
      stock: product?.stock ?? initialValues?.stock ?? 0,
      minStock: product?.minStock ?? initialValues?.minStock ?? 5,
      subcategoryId: product?.subcategoryId ?? initialValues?.subcategoryId ?? ""
    }),
    [initialValues, product]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
    mode: "onChange"
  });

  useEffect(() => {
    reset(defaultValues);
    setSelectedFile(null);
    setIsUploading(false);
  }, [defaultValues, reset]);

  async function onSubmit(values: ProductFormValues) {
    try {
      const imageUrl = await uploadImage(selectedFile, values.imageUrl?.trim() || "", setIsUploading);
      const payload = {
        ...values,
        imageUrl
      };

      startTransition(async () => {
        try {
          const savedProduct = product
            ? await updateProductAction({
                id: product.id,
                ...payload
              })
            : await createProductAction(payload);

          if (!product) {
            reset({
              ...defaultValues,
              name: "",
              sku: "",
              barcode: "",
              brand: "",
              imageUrl: "",
              description: "",
              cost: 0,
              price: 0,
              stock: 0,
              minStock: 5
            });
          } else {
            setValue("imageUrl", imageUrl, { shouldDirty: false, shouldValidate: true });
          }

          setSelectedFile(null);
          toast.success(
            successMessage ?? (product ? "Producto actualizado correctamente." : "Producto creado correctamente.")
          );
          onSaved?.(savedProduct);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "No fue posible guardar el producto.");
        }
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible subir la imagen.");
    }
  }

  const isBusy = isSubmitting || isPending || isUploading;

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
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
              <Input {...register("cost")} type="number" min="0" step="0.01" />
              {errors.cost ? <p className="text-xs text-destructive">{errors.cost.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio</label>
              <Input {...register("price")} type="number" min="0" step="0.01" />
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
        </div>

        <ImageUploader
          value={product?.imageUrl ?? initialValues?.imageUrl ?? ""}
          onFileChange={setSelectedFile}
          disabled={isBusy}
          onUrlClear={() => {
            setSelectedFile(null);
            setValue("imageUrl", "", { shouldDirty: true, shouldValidate: true });
          }}
        />
      </div>

      {errors.imageUrl ? <p className="text-xs text-destructive">{errors.imageUrl.message}</p> : null}

      <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" type="submit" disabled={isBusy}>
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : null}
          {isUploading ? "Subiendo imagen..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

async function uploadImage(
  file: File | null,
  currentImageUrl: string,
  setIsUploading: (value: boolean) => void
) {
  if (!file) {
    return currentImageUrl;
  }

  setIsUploading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/products", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "No fue posible subir la imagen.");
    }

    const payload = (await response.json()) as { url: string };
    return payload.url;
  } finally {
    setIsUploading(false);
  }
}

"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createSubcategoryAction,
  updateSubcategoryAction
} from "@/app/admin/taxonomy/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subcategorySchema, type SubcategoryFormValues } from "@/lib/validations";

type CategoryOption = {
  id: string;
  name: string;
};

export function SubcategoryForm({
  categories,
  mode,
  initialValues,
  onSuccess
}: Readonly<{
  categories: CategoryOption[];
  mode: "create" | "edit";
  initialValues?: {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
  };
  onSuccess: () => void;
}>) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    mode: "onChange",
    defaultValues: {
      categoryId: initialValues?.categoryId ?? "",
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? ""
    }
  });

  useEffect(() => {
    reset({
      categoryId: initialValues?.categoryId ?? "",
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? ""
    });
  }, [initialValues, reset]);

  function onSubmit(values: SubcategoryFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createSubcategoryAction(values);
          toast.success("Subcategoria creada correctamente.");
        } else if (initialValues) {
          await updateSubcategoryAction(initialValues.id, values);
          toast.success("Subcategoria actualizada correctamente.");
        }

        onSuccess();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No fue posible guardar la subcategoria."
        );
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Categoria</label>
        <select
          {...register("categoryId")}
          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="">Seleccionar</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p className="text-xs text-destructive">{errors.categoryId.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre de la subcategoria</label>
        <Input {...register("name")} placeholder="Pastillas de freno" />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion</label>
        <textarea
          {...register("description")}
          className="min-h-28 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
          placeholder="Subgrupo de catalogo para clasificacion detallada."
        />
        {errors.description ? (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting || isPending}>
          {mode === "create" ? "Crear subcategoria" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

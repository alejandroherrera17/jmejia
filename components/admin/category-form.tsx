"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createCategoryAction,
  updateCategoryAction
} from "@/app/admin/taxonomy/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categorySchema, type CategoryFormValues } from "@/lib/validations";

export function CategoryForm({
  mode,
  initialValues,
  onSuccess
}: Readonly<{
  mode: "create" | "edit";
  initialValues?: { id: string; name: string; description: string | null };
  onSuccess: () => void;
}>) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: "onChange",
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? ""
    }
  });

  useEffect(() => {
    reset({
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? ""
    });
  }, [initialValues, reset]);

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createCategoryAction(values);
          toast.success("Categoria creada correctamente.");
        } else if (initialValues) {
          await updateCategoryAction(initialValues.id, values);
          toast.success("Categoria actualizada correctamente.");
        }

        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No fue posible guardar la categoria.");
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre de la categoria</label>
        <Input {...register("name")} placeholder="Frenos" />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion</label>
        <textarea
          {...register("description")}
          className="min-h-28 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
          placeholder="Agrupa repuestos similares para gestion y reportes."
        />
        {errors.description ? (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting || isPending}>
          {mode === "create" ? "Crear categoria" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

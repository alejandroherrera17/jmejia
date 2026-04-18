"use client";

import { useMemo, useState, useTransition } from "react";
import { Edit3, FolderTree, Layers3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteCategoryAction,
  deleteSubcategoryAction
} from "@/app/admin/taxonomy/actions";
import { CategoryForm } from "@/components/admin/category-form";
import { SubcategoryForm } from "@/components/admin/subcategory-form";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type TaxonomyCategory = {
  id: string;
  name: string;
  description: string | null;
  _count: {
    subcategories: number;
  };
  subcategories: Array<{
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    _count: {
      products: number;
    };
  }>;
};

type DialogState =
  | { type: "closed" }
  | { type: "create-category" }
  | { type: "edit-category"; category: TaxonomyCategory }
  | { type: "create-subcategory" }
  | {
      type: "edit-subcategory";
      subcategory: {
        id: string;
        categoryId: string;
        name: string;
        description: string | null;
      };
    };

export function TaxonomyManager({
  categories
}: Readonly<{
  categories: TaxonomyCategory[];
}>) {
  const [dialogState, setDialogState] = useState<DialogState>({ type: "closed" });
  const [isPending, startTransition] = useTransition();

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, name: category.name })),
    [categories]
  );

  function closeDialog() {
    setDialogState({ type: "closed" });
  }

  function handleDeleteCategory(id: string) {
    startTransition(async () => {
      try {
        await deleteCategoryAction(id);
        toast.success("Categoria eliminada correctamente.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No fue posible eliminar la categoria."
        );
      }
    });
  }

  function handleDeleteSubcategory(id: string) {
    startTransition(async () => {
      try {
        await deleteSubcategoryAction(id);
        toast.success("Subcategoria eliminada correctamente.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No fue posible eliminar la subcategoria."
        );
      }
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="page-panel">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/70">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="size-4 text-accent" />
              Categorias
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Administra grupos principales del catalogo sin salir del panel.
            </p>
          </div>
          <Button onClick={() => setDialogState({ type: "create-category" })}>
            <Plus className="size-4" />
            Nueva categoria
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Subcategorias</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-[280px] text-muted-foreground">
                    {category.description || "Sin descripcion"}
                  </TableCell>
                  <TableCell>{category._count.subcategories}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDialogState({ type: "edit-category", category })}
                      >
                        <Edit3 className="size-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="page-panel">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/70">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="size-4 text-accent" />
              Subcategorias
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Controla la jerarquia fina y la relacion con productos.
            </p>
          </div>
          <Button onClick={() => setDialogState({ type: "create-subcategory" })}>
            <Plus className="size-4" />
            Nueva subcategoria
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subcategoria</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.flatMap((category) =>
                category.subcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subcategory.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {subcategory.description || "Sin descripcion"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{subcategory._count.products}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDialogState({
                              type: "edit-subcategory",
                              subcategory: {
                                id: subcategory.id,
                                categoryId: subcategory.categoryId,
                                name: subcategory.name,
                                description: subcategory.description
                              }
                            })
                          }
                        >
                          <Edit3 className="size-4" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                        >
                          <Trash2 className="size-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AppDialog
        open={dialogState.type === "create-category"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title="Crear categoria"
        description="Organiza el catalogo principal con una estructura clara y escalable."
      >
        <CategoryForm mode="create" onSuccess={closeDialog} />
      </AppDialog>

      <AppDialog
        open={dialogState.type === "edit-category"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title="Editar categoria"
        description="Actualiza nombre y descripcion sin salir del panel administrativo."
      >
        {dialogState.type === "edit-category" ? (
          <CategoryForm
            mode="edit"
            initialValues={dialogState.category}
            onSuccess={closeDialog}
          />
        ) : null}
      </AppDialog>

      <AppDialog
        open={dialogState.type === "create-subcategory"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title="Crear subcategoria"
        description="Relaciona la subcategoria con su categoria padre y deja la jerarquia lista."
      >
        <SubcategoryForm categories={categoryOptions} mode="create" onSuccess={closeDialog} />
      </AppDialog>

      <AppDialog
        open={dialogState.type === "edit-subcategory"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title="Editar subcategoria"
        description="Ajusta la clasificacion sin perder la relacion con productos existentes."
      >
        {dialogState.type === "edit-subcategory" ? (
          <SubcategoryForm
            categories={categoryOptions}
            mode="edit"
            initialValues={dialogState.subcategory}
            onSuccess={closeDialog}
          />
        ) : null}
      </AppDialog>
    </div>
  );
}

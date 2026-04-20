"use client";

import { BadgeAlert, Barcode, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

export type InventoryTableProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  imageUrl?: string | null;
  description?: string | null;
  unit: string;
  cost: string;
  price: string;
  stock: number;
  minStock: number;
  updatedAt: string;
  brand?: string | null;
  subcategoryId: string;
  subcategory: {
    name: string;
    category: {
      name: string;
    };
  };
};

export function InventoryTable({
  products,
  onEdit,
  onDelete
}: Readonly<{
  products: InventoryTableProduct[];
  onEdit: (product: InventoryTableProduct) => void;
  onDelete: (product: InventoryTableProduct) => void;
}>) {
  return (
    <div className="page-panel overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/70 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold">Catalogo operativo</h3>
          <p className="text-sm text-muted-foreground">
            Escaneo veloz, fotografia del repuesto y control total desde una sola vista.
          </p>
        </div>
        <div className="rounded-2xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          {products.length} productos visibles
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagen</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Jerarquia</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isLowStock = product.stock <= product.minStock;

            return (
              <TableRow key={product.id} className="transition-colors hover:bg-muted/40">
                <TableCell>
                  <ProductAvatar name={product.name} imageUrl={product.imageUrl} />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku}
                      {product.brand ? ` · ${product.brand}` : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{product.subcategory.category.name}</p>
                  <p className="text-xs text-muted-foreground">{product.subcategory.name}</p>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    <Barcode className="size-3.5" />
                    {product.barcode}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(isLowStock && "text-destructive")}>{product.stock}</span>
                  {isLowStock ? <BadgeAlert className="ml-2 inline size-4 text-destructive" /> : null}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="transition-transform hover:-translate-y-0.5 hover:shadow-sm"
                      onClick={() => onEdit(product)}
                      aria-label={`Editar ${product.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="transition-all hover:-translate-y-0.5 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(product)}
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ProductAvatar({
  name,
  imageUrl
}: Readonly<{
  name: string;
  imageUrl?: string | null;
}>) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className="size-12 rounded-full object-cover shadow-sm" />;
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

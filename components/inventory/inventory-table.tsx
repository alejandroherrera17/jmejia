import { BadgeAlert, Barcode, Boxes } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  minStock: number;
  price: unknown;
  subcategory: {
    name: string;
    category: {
      name: string;
    };
  };
};

export function InventoryTable({
  products
}: Readonly<{
  products: InventoryProduct[];
}>) {
  return (
    <div className="page-panel rounded-3xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
        <div>
          <h3 className="font-semibold">Inventario jerárquico</h3>
          <p className="text-sm text-muted-foreground">Categoría, subcategoría y stock en tiempo real.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground md:flex">
          <Boxes className="size-4" />
          Vista optimizada para bodega
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Jerarquía</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Precio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isLowStock = product.stock <= product.minStock;

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
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
                  <span className={isLowStock ? "text-destructive" : ""}>{product.stock}</span>
                  {isLowStock ? <BadgeAlert className="ml-2 inline size-4 text-destructive" /> : null}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(String(product.price))}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

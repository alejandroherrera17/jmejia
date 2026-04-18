import { Plus } from "lucide-react";

import { ProductForm } from "@/components/forms/product-form";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { requireRole } from "@/lib/permissions";
import { getInventoryOverview } from "@/services/inventory-service";

export default async function InventoryPage() {
  await requireRole(["ADMIN", "BODEGUERO"]);

  const inventory = await getInventoryOverview();
  const subcategories = inventory.categories.flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      categoryName: category.name
    }))
  );

  return (
    <PageShell>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Inventario</h1>
              <p className="text-sm text-muted-foreground">
                Gestion jerarquica de categorias, subcategorias y productos.
              </p>
            </div>

            <div className="hidden md:block">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4" />
                    Nuevo producto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar repuesto</DialogTitle>
                    <DialogDescription>
                      Validacion en tiempo real con generacion automatica de barcode.
                    </DialogDescription>
                  </DialogHeader>
                  <ProductForm subcategories={subcategories} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="md:hidden">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button className="w-full rounded-2xl">
                    <Plus className="size-4" />
                    Nuevo producto
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh] overflow-y-auto">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">Registrar repuesto</h2>
                    <p className="text-sm text-muted-foreground">Flujo movil friendly para bodega.</p>
                  </div>
                  <ProductForm subcategories={subcategories} />
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          <InventoryTable products={inventory.products} />
        </div>
      </PageTransition>
    </PageShell>
  );
}

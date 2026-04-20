import { InventoryManager } from "@/components/inventory/inventory-manager";
import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { requireModuleAccess } from "@/lib/permissions";
import { getInventoryOverview } from "@/services/inventory-service";

export default async function InventoryPage() {
  await requireModuleAccess("inventory", ["ADMIN", "BODEGUERO"]);

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Modulo de bodega</p>
              <h1 className="text-3xl font-semibold">Inventario</h1>
              <p className="text-sm text-muted-foreground">
                Escaneo operativo, galeria de producto y control fino de ingresos en tiempo real.
              </p>
            </div>
          </div>

          <InventoryManager initialProducts={inventory.products} subcategories={subcategories} />
        </div>
      </PageTransition>
    </PageShell>
  );
}

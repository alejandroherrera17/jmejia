import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { PosTerminal } from "@/components/sales/pos-terminal";
import { requireModuleAccess } from "@/lib/permissions";
import { lookupCustomerByDocument, searchProducts } from "@/services/sales-service";

export default async function SalesPage() {
  await requireModuleAccess("sales", ["ADMIN", "CAJERO"]);

  const [products, customer] = await Promise.all([
    searchProducts(""),
    lookupCustomerByDocument("22222222")
  ]);

  return (
    <PageShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Ventas POS</h1>
            <p className="text-sm text-muted-foreground">
              Flujo de caja avanzado con cliente inline, IVA desglosado, pagos omnicanal y una base
              lista para facturacion electronica DIAN.
            </p>
          </div>
          <PosTerminal products={products} customer={customer} />
        </div>
      </PageTransition>
    </PageShell>
  );
}

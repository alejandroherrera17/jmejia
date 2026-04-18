import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { PosTerminal } from "@/components/sales/pos-terminal";
import { requireRole } from "@/lib/permissions";
import { lookupCustomerByDocument, searchProducts } from "@/services/sales-service";

export default async function SalesPage() {
  await requireRole(["ADMIN", "CAJERO"]);

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
              Busqueda rapida, cliente por cedula y salida lista para factura y tirilla termica.
            </p>
          </div>
          <PosTerminal products={products} customer={customer} />
        </div>
      </PageTransition>
    </PageShell>
  );
}

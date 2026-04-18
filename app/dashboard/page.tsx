import { AlertCenter } from "@/components/alerts/alert-center";
import { CashShiftCard } from "@/components/cash/cash-shift-card";
import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { requireRole } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getLowStockAlerts, getInventoryOverview } from "@/services/inventory-service";
import { getDashboardMetrics } from "@/services/report-service";

export default async function DashboardPage() {
  await requireRole(["ADMIN", "CAJERO", "BODEGUERO"]);

  const [metrics, inventory, lowStock] = await Promise.all([
    getDashboardMetrics(),
    getInventoryOverview(),
    getLowStockAlerts()
  ]);

  return (
    <PageShell>
      <PageTransition>
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              label="Ventas Hoy"
              value={formatCurrency(metrics.salesToday)}
              detail="Monitoreo instantaneo para caja y gerencia."
            />
            <MetricCard
              label="Ventas del Mes"
              value={formatCurrency(metrics.monthSales)}
              detail="Consolidado de facturacion acumulada."
            />
            <MetricCard
              label="Productos Activos"
              value={String(metrics.activeProducts)}
              detail="Inventario disponible para venta."
            />
            <MetricCard
              label="Sin Rotacion"
              value={String(metrics.staleProducts)}
              detail="Productos inmoviles en los ultimos 90 dias."
            />
          </section>

          <AlertCenter lowStock={lowStock} staleProducts={inventory.staleProducts} />
          <CashShiftCard shift={metrics.openShift} />
        </div>
      </PageTransition>
    </PageShell>
  );
}

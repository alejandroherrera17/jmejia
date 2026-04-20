import { AlertCenter } from "@/components/alerts/alert-center";
import { CashShiftCard } from "@/components/cash/cash-shift-card";
import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { requireModuleAccess } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getLowStockAlerts, getInventoryOverview } from "@/services/inventory-service";
import { getDashboardMetrics } from "@/services/report-service";

const DASHBOARD_TIMEOUT_MS = 8000;

export default async function DashboardPage() {
  await requireModuleAccess("dashboard", ["ADMIN", "CAJERO", "BODEGUERO"]);

  const { inventory, lowStock, metrics, statusMessage } = await loadDashboardData();

  return (
    <PageShell>
      <PageTransition>
        <div className="space-y-6">
          {statusMessage ? (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <p className="font-semibold">No pudimos cargar el dashboard completo.</p>
              <p className="mt-1">{statusMessage}</p>
            </section>
          ) : null}

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

async function loadDashboardData() {
  try {
    const [metrics, inventory, lowStock] = await withTimeout(
      Promise.all([getDashboardMetrics(), getInventoryOverview(), getLowStockAlerts()]),
      DASHBOARD_TIMEOUT_MS
    );

    return {
      metrics,
      inventory,
      lowStock,
      statusMessage: null
    };
  } catch (error) {
    console.error("Dashboard data failed to load", error);

    return {
      metrics: {
        salesToday: 0,
        monthSales: 0,
        activeProducts: 0,
        openShift: null,
        staleProducts: 0
      },
      inventory: {
        products: [],
        lowStockCount: 0,
        staleProducts: [],
        categories: []
      },
      lowStock: [],
      statusMessage:
        "Revisa la conexion con la base de datos o intenta nuevamente en unos segundos."
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Dashboard timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

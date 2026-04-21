import type { ReactNode } from "react";

import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { requireModuleAccess } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getLowStockAlerts, getInventoryOverview } from "@/services/inventory-service";
import { getDashboardMetrics } from "@/services/report-service";
import { ArrowUpRight, Download, Plus, Sparkles } from "lucide-react";

const DASHBOARD_TIMEOUT_MS = 8000;

export default async function DashboardPage() {
  await requireModuleAccess("dashboard", ["ADMIN", "CAJERO", "BODEGUERO"]);

  const { inventory, lowStock, metrics, statusMessage } = await loadDashboardData();

  return (
    <PageShell className="pb-10">
      <PageTransition>
        <div className="space-y-6">
          {statusMessage ? (
            <section className="rounded-[28px] border border-[#b3e9c7] bg-[#f0fff1] px-5 py-4 text-sm text-[#8367c7] shadow-[0_20px_60px_-34px_rgba(86,3,173,0.35)]">
              <p className="font-semibold text-[#5603ad]">No pudimos cargar el dashboard completo.</p>
              <p className="mt-1">{statusMessage}</p>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-[32px] border border-[#b3e9c7] bg-[linear-gradient(135deg,rgba(240,255,241,0.98),rgba(194,248,203,0.78))] p-6 shadow-[0_28px_90px_-40px_rgba(86,3,173,0.45)]">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#b3e9c7] bg-[#f0fff1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8367c7]">
                  <Sparkles className="size-4 text-[#5603ad]" />
                  FreshTech Revenue Suite
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#5603ad] md:text-5xl">
                    Premium operations intelligence with a calm, high-clarity SaaS dashboard.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[#8367c7] md:text-base">
                    Supervise revenue, stock health, and team activity from one polished control
                    center built around decisive actions and readable analytics.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="rounded-2xl px-6 font-semibold">
                    <Plus className="size-4" />
                    Create New Report
                  </Button>
                  <Button variant="secondary" size="lg" className="rounded-2xl px-6 font-semibold">
                    <Plus className="size-4" />
                    Add User
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-2xl px-6 font-semibold">
                    <Download className="size-4" />
                    Export Snapshot
                  </Button>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#b3e9c7] bg-[#f0fff1] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#8367c7]">Live runway</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#5603ad]">
                      {metrics.openShift ? "Cash session active" : "Daily planning ready"}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#5603ad] px-3 py-1 text-xs font-semibold text-[#f0fff1]">
                    Active
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { label: "Revenue goal", value: "84%" },
                    { label: "Stock health", value: `${Math.max(100 - lowStock.length * 6, 58)}%` },
                    { label: "Team pace", value: metrics.openShift ? "92%" : "76%" }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-[#f0fff1] p-3">
                      <p className="text-xs text-[#8367c7]">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold text-[#5603ad]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <ShowcaseMetricCard
              label="Total Revenue"
              value={formatCurrency(metrics.monthSales)}
              detail="Consolidated monthly billing with live operational context."
            />
            <ShowcaseMetricCard
              label="Today Revenue"
              value={formatCurrency(metrics.salesToday)}
              detail="Real-time performance for sales and cashier teams."
            />
            <ShowcaseMetricCard
              label="New Signups"
              value={String(metrics.activeProducts)}
              detail="Active catalog entities currently available for new orders."
            />
            <ShowcaseMetricCard
              label="Pending Reviews"
              value={String(metrics.staleProducts)}
              detail="Products without rotation in the last 90 days."
            />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="rounded-[30px] border border-[#b3e9c7] bg-[#f0fff1] p-6 shadow-[0_24px_70px_-36px_rgba(86,3,173,0.38)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8367c7]">Data Visualization</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#5603ad]">
                    Revenue and adoption trend
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#8367c7]">
                  <LegendSwatch color="#c2f8cb" label="Weekly revenue" />
                  <LegendSwatch color="#b3e9c7" label="New accounts" />
                </div>
              </div>
              <RevenueChart />
            </div>

            <div className="space-y-6">
              <div className="rounded-[30px] border border-[#b3e9c7] bg-[#f0fff1] p-6 shadow-[0_24px_70px_-36px_rgba(86,3,173,0.38)]">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8367c7]">Performance Mix</p>
                <div className="mt-5 space-y-4">
                  {[
                    { label: "Enterprise", value: 78 },
                    { label: "Growth", value: 62 },
                    { label: "Starter", value: 44 }
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#5603ad]">{item.label}</span>
                        <span className="text-[#8367c7]">{item.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-[#f0fff1]">
                        <div
                          className="h-3 rounded-full bg-[linear-gradient(90deg,#c2f8cb,#b3e9c7)]"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-[#b3e9c7] bg-[#f0fff1] p-6 shadow-[0_24px_70px_-36px_rgba(86,3,173,0.38)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#8367c7]">Activity Feed</p>
                    <h2 className="mt-2 text-xl font-semibold text-[#5603ad]">Operational pulse</h2>
                  </div>
                  <ArrowUpRight className="size-5 text-[#5603ad]" />
                </div>
                <div className="mt-5 space-y-4">
                  {buildActivityFeed({
                    lowStockCount: lowStock.length,
                    staleCount: inventory.staleProducts.length,
                    hasOpenShift: Boolean(metrics.openShift)
                  }).map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-[#b3e9c7] bg-[#f0fff1] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#5603ad]">{item.title}</p>
                          <p className="mt-1 text-sm text-[#8367c7]">{item.detail}</p>
                        </div>
                        <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#b3e9c7] bg-[#f0fff1] p-6 shadow-[0_24px_70px_-36px_rgba(86,3,173,0.38)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#8367c7]">Activity Table</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#5603ad]">
                  Team queue and stock watchlist
                </h2>
              </div>
              <p className="max-w-xl text-sm text-[#8367c7]">
                A clean, alternating table treatment for active workflows, approvals, and products
                that need attention.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-[24px] border border-[#b3e9c7]">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-[#c2f8cb] text-left text-sm text-[#5603ad]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Name</th>
                    <th className="px-5 py-4 font-semibold">Focus</th>
                    <th className="px-5 py-4 font-semibold">Owner</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buildTableRows(lowStock, inventory.staleProducts).map((row, index) => (
                    <tr
                      key={`${row.name}-${index}`}
                      className={index % 2 === 0 ? "bg-[#f0fff1]" : "bg-[#b3e9c7]/35"}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-[#5603ad]">{row.name}</td>
                      <td className="px-5 py-4 text-sm text-[#8367c7]">{row.focus}</td>
                      <td className="px-5 py-4 text-sm text-[#8367c7]">{row.owner}</td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageTransition>
    </PageShell>
  );
}

function ShowcaseMetricCard({
  label,
  value,
  detail
}: Readonly<{
  label: string;
  value: string;
  detail: string;
}>) {
  return (
    <div className="rounded-[28px] border border-[#b3e9c7] bg-[#f0fff1] p-5 shadow-[0_22px_65px_-40px_rgba(86,3,173,0.38)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#8367c7]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#5603ad]">{value}</p>
        </div>
        <div className="rounded-2xl bg-[#c2f8cb] p-3 text-[#5603ad]">
          <ArrowUpRight className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#8367c7]">{detail}</p>
    </div>
  );
}

function RevenueChart() {
  const barData = [44, 58, 52, 69, 76, 72, 88];
  const lineData = [40, 46, 49, 58, 63, 68, 74];
  const linePoints = lineData
    .map((value, index) => `${30 + index * 86},${220 - value * 2}`)
    .join(" ");

  return (
    <div className="mt-8 overflow-hidden rounded-[28px] border border-[#b3e9c7] bg-[#f0fff1] p-5">
      <div className="flex h-[280px] items-end gap-4">
        {barData.map((value, index) => (
          <div key={value} className="flex flex-1 flex-col items-center gap-3">
            <div className="relative flex h-[220px] w-full items-end justify-center rounded-[24px] bg-[#f0fff1]/80">
              <div
                className="w-full rounded-[20px] bg-[linear-gradient(180deg,#c2f8cb,#b3e9c7)] shadow-[0_14px_28px_-16px_rgba(86,3,173,0.28)]"
                style={{ height: `${value * 2.1}px` }}
              />
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8367c7]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
            </span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 576 240" className="-mt-[248px] h-[240px] w-full">
        <polyline
          fill="none"
          stroke="#5603ad"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />
        {lineData.map((value, index) => (
          <circle
            key={value}
            cx={30 + index * 86}
            cy={220 - value * 2}
            r="6"
            fill="#8367c7"
            stroke="#f0fff1"
            strokeWidth="4"
          />
        ))}
      </svg>
    </div>
  );
}

function LegendSwatch({ color, label }: Readonly<{ color: string; label: string }>) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-8 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function StatusBadge({
  children,
  tone
}: Readonly<{
  children: ReactNode;
  tone: "active" | "pending";
}>) {
  const classes =
    tone === "active"
      ? "bg-[#5603ad] text-[#f0fff1]"
      : "bg-[#8367c7] text-[#f0fff1]";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{children}</span>;
}

function buildActivityFeed({
  lowStockCount,
  staleCount,
  hasOpenShift
}: Readonly<{
  lowStockCount: number;
  staleCount: number;
  hasOpenShift: boolean;
}>) {
  return [
    {
      title: "Revenue sync completed",
      detail: "Daily financial signals have been consolidated across the dashboard.",
      status: "Active",
      tone: "active" as const
    },
    {
      title: `${lowStockCount || 1} stock alerts require review`,
      detail: "Automated watchlist generated for products approaching minimum threshold.",
      status: lowStockCount > 0 ? "Pending" : "Active",
      tone: lowStockCount > 0 ? ("pending" as const) : ("active" as const)
    },
    {
      title: hasOpenShift ? "Cash shift is open" : "Cash shift not opened",
      detail: `${staleCount} catalog items remain on the non-rotation queue for follow-up.`,
      status: hasOpenShift ? "Active" : "Pending",
      tone: hasOpenShift ? ("active" as const) : ("pending" as const)
    }
  ];
}

function buildTableRows(
  lowStock: Array<{
    name: string;
    stock: number;
    minStock: number;
  }>,
  staleProducts: Array<{
    name: string;
  }>
) {
  const rows = [
    ...lowStock.slice(0, 3).map((item) => ({
      name: item.name,
      focus: `Inventory threshold: ${item.stock}/${item.minStock}`,
      owner: "Supply Ops",
      status: "Pending",
      tone: "pending" as const
    })),
    ...staleProducts.slice(0, 3).map((item) => ({
      name: item.name,
      focus: "Rotation campaign review",
      owner: "Growth Team",
      status: "Active",
      tone: "active" as const
    }))
  ];

  if (rows.length > 0) {
    return rows;
  }

  return [
    {
      name: "Q2 Expansion Report",
      focus: "Executive reporting pipeline",
      owner: "Insights Team",
      status: "Active",
      tone: "active" as const
    },
    {
      name: "Workspace Onboarding",
      focus: "User provisioning approval",
      owner: "People Ops",
      status: "Pending",
      tone: "pending" as const
    },
    {
      name: "Automation Rules",
      focus: "Lifecycle notifications",
      owner: "Platform Team",
      status: "Active",
      tone: "active" as const
    }
  ];
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

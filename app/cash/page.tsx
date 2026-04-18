import { CashControls } from "@/components/cash/cash-controls";
import { CashShiftCard } from "@/components/cash/cash-shift-card";
import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getOpenShift } from "@/services/cash-service";

export default async function CashPage() {
  await requireRole(["ADMIN", "CAJERO"]);

  const openShift = await getOpenShift();
  const totalMovements =
    openShift?.movements.reduce((acc, movement) => acc + Number(movement.amount), 0) ?? 0;

  return (
    <PageShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Caja</h1>
            <p className="text-sm text-muted-foreground">
              Apertura, cierre de turno y control de movimientos de dinero.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
            <CashShiftCard shift={openShift} />

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de caja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">Monto movido en turno</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalMovements)}</p>
                  </div>
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    La logica de apertura y cierre se centraliza en servicios server-side para un
                    entorno serverless estable.
                  </div>
                </CardContent>
              </Card>

              <CashControls shiftId={openShift?.id} />
            </div>
          </div>
        </div>
      </PageTransition>
    </PageShell>
  );
}

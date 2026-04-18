import { ArrowDownRight, ArrowUpRight, Banknote, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Shift = {
  openingAmount: unknown;
  openedAt: Date;
  openedBy: {
    name: string;
  };
  movements: Array<{
    id: string;
    type: string;
    amount: unknown;
    concept: string;
  }>;
};

export function CashShiftCard({
  shift
}: Readonly<{
  shift: Shift | null;
}>) {
  if (!shift) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turno de caja</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay turnos abiertos en este momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Turno abierto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Banknote className="h-4 w-4 text-success" />
              Apertura
            </div>
            <p className="text-xl font-semibold">{formatCurrency(String(shift.openingAmount))}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Clock3 className="h-4 w-4 text-primary" />
              Inicio
            </div>
            <p className="text-sm font-medium">{formatDate(shift.openedAt)}</p>
            <p className="text-xs text-muted-foreground">{shift.openedBy.name}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ArrowDownRight className="h-4 w-4 text-accent" />
              Movimientos
            </div>
            <p className="text-xl font-semibold">{shift.movements.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          {shift.movements.slice(0, 5).map((movement) => (
            <div key={movement.id} className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
              <div>
                <p className="font-medium">{movement.concept}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{movement.type}</p>
              </div>
              <span className="font-semibold">{formatCurrency(String(movement.amount))}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { AlertTriangle, PackageSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type AlertItem = {
  id: string;
  name: string;
  stock?: number;
  minStock?: number;
  updatedAt: Date;
};

export function AlertCenter({
  lowStock,
  staleProducts
}: Readonly<{
  lowStock: AlertItem[];
  staleProducts: AlertItem[];
}>) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            Stock Bajo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lowStock.length ? (
            lowStock.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stock {item.stock} / Mínimo {item.minStock}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hay alertas de stock en este momento.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageSearch className="size-4 text-accent" />
            Sin Rotación 90 Días
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {staleProducts.length ? (
            staleProducts.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Último ajuste: {formatDate(item.updatedAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Todos los productos tienen movimiento reciente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

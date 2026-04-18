"use client";

import { useDeferredValue, useState } from "react";
import { Search, ShoppingCart, UserRoundSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type PosProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: unknown;
  stock: number;
};

type Customer = {
  firstName: string;
  lastName: string;
  documentId: string;
};

export function PosTerminal({
  products,
  customer
}: Readonly<{
  products: PosProduct[];
  customer: Customer | null;
}>) {
  const [term, setTerm] = useState("");
  const deferredTerm = useDeferredValue(term);
  const filtered = products.filter((product) =>
    [product.name, product.sku, product.barcode].some((field) =>
      field.toLowerCase().includes(deferredTerm.toLowerCase())
    )
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-2">
            <Search className="size-4" />
            POS rapido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              className="h-14 rounded-2xl pl-10 text-base"
              placeholder="Busca por nombre, SKU o barcode"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>

          <div className="grid gap-3">
            {filtered.slice(0, 6).map((product) => (
              <button
                key={product.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-4 text-left transition hover:border-primary/40 hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sku} | {product.barcode} | Stock {product.stock}
                  </p>
                </div>
                <span className="font-semibold">{formatCurrency(String(product.price))}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-4" />
            Venta actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-2xl bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <UserRoundSearch className="size-4" />
              Cliente por cedula
            </div>
            {customer ? (
              <p className="text-sm">
                {customer.firstName} {customer.lastName} | {customer.documentId}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Consumidor final o cliente no encontrado.</p>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(0)}</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Button className="h-14 rounded-2xl text-base">Generar factura PDF</Button>
            <Button className="h-14 rounded-2xl text-base" variant="secondary">
              Imprimir tirilla POS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

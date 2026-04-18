"use client";

import { startTransition, useState } from "react";
import { CircleDollarSign, ClipboardPlus, DoorClosed } from "lucide-react";
import { toast } from "sonner";

import { closeShiftAction, openShiftAction, registerMovementAction } from "@/app/cash/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CashControls({
  shiftId
}: Readonly<{
  shiftId?: string;
}>) {
  const [openingAmount, setOpeningAmount] = useState("0");
  const [movementAmount, setMovementAmount] = useState("0");
  const [movementConcept, setMovementConcept] = useState("");
  const [closingAmount, setClosingAmount] = useState("0");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones de caja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shiftId ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
            <label className="text-sm font-medium">Monto de apertura</label>
            <Input
              type="number"
              min="0"
              value={openingAmount}
              onChange={(event) => setOpeningAmount(event.target.value)}
            />
            <Button
              className="w-full"
              onClick={() =>
                startTransition(async () => {
                  await openShiftAction({ openingAmount: Number(openingAmount) });
                  toast.success("Turno abierto correctamente.");
                })
              }
            >
              <CircleDollarSign className="size-4" />
              Abrir turno
            </Button>
          </div>
        ) : null}

        {shiftId ? (
          <>
            <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
              <label className="text-sm font-medium">Registrar movimiento</label>
              <Input
                value={movementConcept}
                onChange={(event) => setMovementConcept(event.target.value)}
                placeholder="Concepto del movimiento"
              />
              <Input
                type="number"
                min="0"
                value={movementAmount}
                onChange={(event) => setMovementAmount(event.target.value)}
                placeholder="Valor"
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={() =>
                  startTransition(async () => {
                    await registerMovementAction({
                      shiftId,
                      amount: Number(movementAmount),
                      concept: movementConcept,
                      type: "INCOME"
                    });
                    toast.success("Movimiento registrado.");
                  })
                }
              >
                <ClipboardPlus className="size-4" />
                Agregar ingreso
              </Button>
            </div>

            <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
              <label className="text-sm font-medium">Monto de cierre</label>
              <Input
                type="number"
                min="0"
                value={closingAmount}
                onChange={(event) => setClosingAmount(event.target.value)}
              />
              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  startTransition(async () => {
                    await closeShiftAction({
                      shiftId,
                      closingAmount: Number(closingAmount)
                    });
                    toast.success("Turno cerrado correctamente.");
                  })
                }
              >
                <DoorClosed className="size-4" />
                Cerrar turno
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

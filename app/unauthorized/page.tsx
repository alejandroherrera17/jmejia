import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold">Acceso no autorizado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu rol actual no tiene permisos para acceder a este módulo.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    </main>
  );
}

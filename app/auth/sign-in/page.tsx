import { CarFront, ShieldCheck } from "lucide-react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { checkDatabaseConnection, ensureAdminUser } from "@/services/user-service";

export default async function SignInPage() {
  const databaseStatus = await checkDatabaseConnection();

  if (databaseStatus.ok) {
    await ensureAdminUser();
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden border-r border-border/60 lg:flex">
        <div className="dashboard-grid absolute inset-0 opacity-70" />
        <div className="relative z-10 m-10 flex flex-col justify-between rounded-[2rem] bg-primary p-10 text-primary-foreground shadow-glow">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <ShieldCheck className="size-4" />
            Produccion automotriz
          </div>
          <div>
            <h1 className="max-w-lg text-4xl font-semibold leading-tight">
              Operacion de repuestos, ventas POS y caja en una sola plataforma.
            </h1>
            <p className="mt-4 max-w-xl text-primary-foreground/75">
              Disenado para mostrador, bodega y administracion con flujos agiles en escritorio y
              celular.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-5">
            <CarFront className="size-8" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/70">ERP</p>
              <p className="font-medium">Repuestos Pro</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-4">
          <SignInForm />

          <div className="rounded-3xl border border-border bg-card/90 p-4 text-sm">
            <p className="font-medium">Estado del sistema</p>
            <p className={databaseStatus.ok ? "mt-2 text-success" : "mt-2 text-destructive"}>
              {databaseStatus.message}
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>Admin inicial: {process.env.ADMIN_EMAIL || "admin@repuestospro.com"}</p>
              <p>Clave inicial: {process.env.ADMIN_PASSWORD || "Admin123*"}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";

import { signOut } from "@/lib/auth-server";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar({
  user
}: Readonly<{
  user?: {
    name?: string | null;
    role?: string | null;
  } | null;
}>) {
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Operacion Automotriz</p>
        <h2 className="text-xl font-semibold">Centro de Control</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden min-w-80 xl:block">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar productos, clientes o facturas..." />
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <Bell className="size-4 text-muted-foreground" />
        </div>
        <div className="hidden items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-2 shadow-sm lg:flex">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium">{user?.name ?? "Usuario activo"}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {user?.role ?? "SESION"}
            </p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/auth/sign-in" });
          }}
        >
          <Button type="submit" variant="outline" className="transition-transform hover:-translate-y-0.5">
            <LogOut className="size-4" />
            Cerrar sesion
          </Button>
        </form>
        <ThemeToggle />
      </div>
    </header>
  );
}

import { Bell, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Operación Automotriz</p>
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
        <ThemeToggle />
      </div>
    </header>
  );
}

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
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-[#b3e9c7] bg-[#f0fff1]/90 px-4 py-4 backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#8367c7]">Operacion FreshTech</p>
        <h2 className="text-xl font-semibold text-[#5603ad]">Centro de Control</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden min-w-80 xl:block">
          <Search className="absolute left-3 top-3 size-4 text-[#8367c7]" />
          <Input
            className="border-[#b3e9c7] bg-[#f0fff1] pl-9 text-[#5603ad] placeholder:text-[#8367c7]"
            placeholder="Buscar productos, clientes o facturas..."
          />
        </div>
        <div className="rounded-2xl border border-[#b3e9c7] bg-[#f0fff1] p-3 shadow-[0_12px_24px_-18px_rgba(86,3,173,0.35)]">
          <Bell className="size-4 text-[#5603ad]" />
        </div>
        <div className="hidden items-center gap-3 rounded-2xl border border-[#b3e9c7] bg-[#f0fff1] px-4 py-2 shadow-[0_12px_24px_-18px_rgba(86,3,173,0.35)] lg:flex">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#c2f8cb] text-[#5603ad]">
            <ShieldCheck className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-[#5603ad]">{user?.name ?? "Usuario activo"}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8367c7]">
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

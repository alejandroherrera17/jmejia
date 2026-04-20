import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  ShieldCheck,
  Users
} from "lucide-react";

import type { UserModuleAccessState } from "@/lib/module-access";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/inventory", label: "Inventario", icon: Boxes, module: "inventory" },
  { href: "/admin/taxonomy", label: "Categorias", icon: FolderTree, module: "taxonomy" },
  { href: "/sales", label: "Ventas POS", icon: CreditCard, module: "sales" },
  { href: "/cash", label: "Caja", icon: BarChart3, module: "cash" },
  { href: "/users", label: "Usuarios", icon: Users, module: "users" }
] as const;

export function DashboardSidebar({
  access
}: Readonly<{
  access?: UserModuleAccessState;
}>) {
  const visibleLinks = links.filter(({ module }) => access?.[module] ?? false);

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-card/70 p-5 backdrop-blur xl:flex">
      <div className="mb-8 flex items-center gap-3 rounded-3xl bg-primary px-4 py-4 text-primary-foreground shadow-glow">
        <div className="rounded-2xl bg-white/15 p-2">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">ERP</p>
          <h1 className="font-semibold">Repuestos Pro</h1>
        </div>
      </div>

      <nav className="space-y-2">
        {visibleLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

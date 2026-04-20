import Link from "next/link";
import { Boxes, CreditCard, LayoutDashboard, Wallet } from "lucide-react";

import type { UserModuleAccessState } from "@/lib/module-access";

const items = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, module: "dashboard" },
  { href: "/inventory", label: "Bodega", icon: Boxes, module: "inventory" },
  { href: "/sales", label: "POS", icon: CreditCard, module: "sales" },
  { href: "/cash", label: "Caja", icon: Wallet, module: "cash" }
] as const;

export function MobileNav({
  access
}: Readonly<{
  access?: UserModuleAccessState;
}>) {
  const visibleItems = items.filter(({ module }) => access?.[module] ?? false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-4 py-3 backdrop-blur xl:hidden">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.max(visibleItems.length, 1)}, minmax(0, 1fr))`
        }}
      >
        {visibleItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Icon className="mb-1 size-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

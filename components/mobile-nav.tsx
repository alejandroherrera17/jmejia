import Link from "next/link";
import { Boxes, CreditCard, LayoutDashboard, Wallet } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/inventory", label: "Bodega", icon: Boxes },
  { href: "/sales", label: "POS", icon: CreditCard },
  { href: "/cash", label: "Caja", icon: Wallet }
] as const;

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-4 py-3 backdrop-blur xl:hidden">
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ href, label, icon: Icon }) => (
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

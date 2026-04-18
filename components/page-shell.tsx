import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return <div className={cn("page-shell", className)}>{children}</div>;
}

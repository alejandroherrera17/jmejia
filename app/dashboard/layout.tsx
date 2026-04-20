import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Topbar } from "@/components/topbar";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUserAccess();

  return (
    <div className="app-shell min-h-screen xl:grid xl:grid-cols-[18rem_minmax(0,1fr)]">
      <DashboardSidebar access={currentUser?.user.moduleAccess} />
      <div className="min-w-0 pb-24 xl:pb-0">
        <Topbar user={currentUser?.session?.user} />
        <main className="min-w-0 overflow-x-hidden overflow-y-visible">{children}</main>
      </div>
      <MobileNav access={currentUser?.user.moduleAccess} />
    </div>
  );
}

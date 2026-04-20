import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { UsersManager } from "@/components/users/users-manager";
import { requireModuleAccess } from "@/lib/permissions";
import { listUsers } from "@/services/user-service";

export default async function UsersPage() {
  const currentUser = await requireModuleAccess("users", ["ADMIN"]);
  const users = await listUsers();

  return (
    <PageShell>
      <PageTransition>
        <UsersManager
          initialUsers={users}
          canManagePermissions={currentUser.user.role === "ADMIN"}
        />
      </PageTransition>
    </PageShell>
  );
}

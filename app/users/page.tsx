import { Users } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { PageTransition } from "@/components/page-transition";
import { UserForm } from "@/components/users/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { requireRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { listUsers } from "@/services/user-service";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);
  const users = await listUsers();

  return (
    <PageShell>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              El administrador crea y gestiona cajeros, bodegueros y otros administradores.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Nuevo usuario interno</CardTitle>
              </CardHeader>
              <CardContent>
                <UserForm />
              </CardContent>
            </Card>

            <Card className="page-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-4" />
                  Usuarios registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    </PageShell>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Role } from "@prisma/client";
import {
  History,
  Loader2,
  Pencil,
  ShieldCheck,
  UserCog,
  Users
} from "lucide-react";

import { getUserAuditLogsAction } from "@/app/users/actions";
import { ClientDate } from "@/components/client-date";
import { UserForm } from "@/components/users/user-form";
import { AppDialog } from "@/components/ui/app-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string | Date;
  moduleAccess: {
    dashboard: boolean;
    inventory: boolean;
    sales: boolean;
    cash: boolean;
    users: boolean;
    taxonomy: boolean;
  };
};

type AuditLogItem = {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  details: string;
  timestamp: string | Date;
};

export function UsersManager({
  initialUsers,
  canManagePermissions
}: Readonly<{
  initialUsers: UserRow[];
  canManagePermissions: boolean;
}>) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [historyUser, setHistoryUser] = useState<UserRow | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isHistoryLoading, startHistoryTransition] = useTransition();

  useEffect(() => {
    if (!historyUser) {
      return;
    }

    startHistoryTransition(async () => {
      try {
        const logs = (await getUserAuditLogsAction(historyUser.id)) as AuditLogItem[];
        setAuditLogs(logs);
      } catch {
        setAuditLogs([]);
      }
    });
  }, [historyUser]);

  const totalUsers = users.length;
  const adminCount = users.filter((user) => user.role === Role.ADMIN).length;

  return (
    <>
      <section className="mx-auto max-w-7xl space-y-8 rounded-[2rem] bg-slate-50 p-8 lg:p-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm ring-1 ring-slate-200">
              Administracion interna
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Modulo de Usuarios
              </h1>
              <p className="text-base leading-7 text-slate-600">
                Controla accesos, roles y trazabilidad del equipo desde una interfaz despejada,
                moderna y con una jerarquia visual clara.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[360px]">
            <KpiCard
              icon={<Users className="size-5" />}
              label="Usuarios activos"
              value={totalUsers}
            />
            <KpiCard
              icon={<ShieldCheck className="size-5" />}
              label="Administradores"
              value={adminCount}
            />
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <UserCog className="size-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">Nuevo usuario interno</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Registra nuevos accesos con credenciales temporales y asigna el rol adecuado.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Formulario de alta
              </p>
              <UserForm />
            </div>
          </aside>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">Usuarios registrados</h2>
                <p className="text-sm text-slate-600">
                  Consulta el estado del equipo, su rol actual y el historial disponible.
                </p>
              </div>
              <div className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {totalUsers} en total
              </div>
            </div>

            <Table className="min-w-[640px]">
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-slate-200 hover:bg-gray-50">
                  <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Usuario
                  </TableHead>
                  <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Rol
                  </TableHead>
                  <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Fecha de alta
                  </TableHead>
                  <TableHead className="px-5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100">
                {users.length ? (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-b-0 hover:bg-slate-50/80">
                      <TableCell className="px-5 py-5">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-5">
                        <span className={getRoleBadgeClassName(user.role)}>
                          {formatRoleLabel(user.role)}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-5">
                        <ClientDate
                          value={user.createdAt}
                          className="text-sm text-slate-500"
                          loading={<span className="text-sm text-slate-400">Cargando...</span>}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => setEditingUser(user)}
                            aria-label={`Editar ${user.name}`}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            onClick={() => setHistoryUser(user)}
                            aria-label={`Ver historial de ${user.name}`}
                          >
                            <History className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-b-0 hover:bg-white">
                    <TableCell colSpan={4} className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-sm space-y-2">
                        <p className="text-base font-semibold text-slate-900">
                          Aun no hay usuarios registrados
                        </p>
                        <p className="text-sm leading-6 text-slate-500">
                          Cuando agregues el primer usuario interno, aparecera aqui con su rol y
                          fecha de alta.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
        </div>
      </section>

      <AppDialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
        title="Editar usuario"
        description="Actualiza nombre, correo, rol y define una nueva contrasena solo si hace falta."
      >
        {editingUser ? (
          <UserForm
            mode="edit"
            user={editingUser}
            canManagePermissions={canManagePermissions}
            onCancel={() => setEditingUser(null)}
            onSaved={(savedUser) => {
              if (savedUser && typeof savedUser === "object") {
                const nextUser = savedUser as UserRow;
                setUsers((current) =>
                  current.map((user) => (user.id === nextUser.id ? nextUser : user))
                );
              }
              setEditingUser(null);
            }}
          />
        ) : null}
      </AppDialog>

      <AppDialog
        open={Boolean(historyUser)}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryUser(null);
            setAuditLogs([]);
          }
        }}
        title={historyUser ? `Historial de ${historyUser.name}` : "Historial"}
        description="Bitacora ligera cargada de forma asincrona para no ralentizar la pantalla principal."
      >
        <div className="space-y-3">
          {isHistoryLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-6">
              <Loader2 className="size-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando historial del usuario...</p>
            </div>
          ) : auditLogs.length ? (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{formatAuditAction(log.action)}</p>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {log.userName ?? log.userId ?? "Usuario sin referencia"}
                    </p>
                  </div>
                  <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <ClientDate
                      value={log.timestamp}
                      options={{
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <p className="font-medium">Sin movimientos registrados.</p>
              <p className="text-sm text-muted-foreground">
                Aun no hay eventos auditados para este usuario.
              </p>
            </div>
          )}
        </div>
      </AppDialog>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: number;
}>) {
  return (
    <div className="rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatAuditAction(action: string) {
  const normalized = action
    .toLowerCase()
    .split("_")
    .filter(Boolean);

  if (!normalized.length) {
    return "Accion registrada";
  }

  const [verb, ...rest] = normalized;
  const target = rest.join(" ");

  const verbMap: Record<string, string> = {
    create: "Creo",
    createmany: "Creo multiples registros de",
    update: "Edito",
    updatemany: "Actualizo multiples registros de",
    delete: "Elimino",
    deletemany: "Elimino multiples registros de",
    upsert: "Sincronizo",
    login: "Inicio sesion"
  };

  return `${verbMap[verb] ?? "Registro"} ${target}`.trim();
}

function formatRoleLabel(role: Role) {
  const labels: Record<Role, string> = {
    ADMIN: "Administrador",
    CAJERO: "Cajero",
    BODEGUERO: "Bodeguero"
  };

  return labels[role] ?? role;
}

function getRoleBadgeClassName(role: Role) {
  const styles: Record<Role, string> = {
    ADMIN: "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200",
    CAJERO:
      "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200",
    BODEGUERO:
      "inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
  };

  return styles[role] ?? "inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700";
}

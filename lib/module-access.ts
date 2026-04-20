import type { Role } from "@prisma/client";

export const moduleAccessKeys = [
  "dashboard",
  "inventory",
  "sales",
  "cash",
  "users",
  "taxonomy"
] as const;

export type UserModuleKey = (typeof moduleAccessKeys)[number];

export type UserModuleAccessState = Record<UserModuleKey, boolean>;

export const moduleAccessConfig: Record<
  UserModuleKey,
  {
    label: string;
    description: string;
  }
> = {
  dashboard: {
    label: "Dashboard",
    description: "Acceso al panel general y a los indicadores principales."
  },
  inventory: {
    label: "Inventario",
    description: "Gestion de productos, stock, entradas y actualizaciones."
  },
  sales: {
    label: "Ventas",
    description: "Uso del POS, clientes y procesamiento de ventas."
  },
  cash: {
    label: "Caja",
    description: "Apertura, cierre de turno y movimientos de caja."
  },
  users: {
    label: "Usuarios",
    description: "Administracion de usuarios internos y sus permisos."
  },
  taxonomy: {
    label: "Categorias",
    description: "Configuracion de categorias y subcategorias del catalogo."
  }
};

export const emptyModuleAccess: UserModuleAccessState = {
  dashboard: false,
  inventory: false,
  sales: false,
  cash: false,
  users: false,
  taxonomy: false
};

export const moduleAccessSelect = {
  dashboard: true,
  inventory: true,
  sales: true,
  cash: true,
  users: true,
  taxonomy: true
} as const;

export function getDefaultModuleAccess(role: Role): UserModuleAccessState {
  switch (role) {
    case "ADMIN":
      return {
        dashboard: true,
        inventory: true,
        sales: true,
        cash: true,
        users: true,
        taxonomy: true
      };
    case "BODEGUERO":
      return {
        dashboard: true,
        inventory: true,
        sales: false,
        cash: false,
        users: false,
        taxonomy: false
      };
    case "CAJERO":
    default:
      return {
        dashboard: true,
        inventory: false,
        sales: true,
        cash: true,
        users: false,
        taxonomy: false
      };
  }
}

export function normalizeModuleAccess(
  access: Partial<UserModuleAccessState> | null | undefined,
  role: Role
): UserModuleAccessState {
  return {
    ...getDefaultModuleAccess(role),
    ...access
  };
}

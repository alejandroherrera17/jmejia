"use client";

import { useEffect, useState, useTransition } from "react";
import { Role } from "@prisma/client";
import {
  Boxes,
  CreditCard,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Users,
  Wallet
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createUserAction, updateUserAction } from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  moduleAccessConfig,
  moduleAccessKeys,
  type UserModuleAccessState
} from "@/lib/module-access";
import { createUserSchema, updateUserSchema, type UpdateUserValues } from "@/lib/validations";

type CreateUserValues = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

type UserFormValues = {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  moduleAccess: UserModuleAccessState;
};

type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  moduleAccess: UserModuleAccessState;
};

export function UserForm({
  mode = "create",
  user,
  canManagePermissions = false,
  onSaved,
  onCancel
}: Readonly<{
  mode?: "create" | "edit";
  user?: EditableUser;
  canManagePermissions?: boolean;
  onSaved?: (user: unknown) => void;
  onCancel?: () => void;
}>) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UserFormValues>({
    resolver: zodResolver(mode === "edit" ? updateUserSchema : createUserSchema),
    defaultValues:
      mode === "edit" && user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            moduleAccess: user.moduleAccess
          }
        : {
            name: "",
            email: "",
            password: "",
            role: Role.CAJERO,
            moduleAccess: {
              dashboard: true,
              inventory: false,
              sales: true,
              cash: true,
              users: false,
              taxonomy: false
            }
          },
    mode: "onChange"
  });

  const watchedModuleAccess = watch("moduleAccess");

  useEffect(() => {
    if (mode === "edit" && user?.moduleAccess) {
      moduleAccessKeys.forEach((key) => {
        setValue(`moduleAccess.${key}`, user.moduleAccess[key]);
      });
    }
  }, [mode, setValue, user]);

  function onSubmit(values: UserFormValues) {
    startTransition(async () => {
      try {
        if (mode === "edit" && user) {
          const savedUser = await updateUserAction({
            id: user.id,
            name: values.name,
            email: values.email,
            password: values.password ?? "",
            role: values.role,
            ...(canManagePermissions && values.moduleAccess
              ? { moduleAccess: values.moduleAccess as UserModuleAccessState }
              : {})
          });

          toast.success("Usuario actualizado correctamente");
          onSaved?.(savedUser);
          return;
        }

        await createUserAction({
          name: values.name,
          email: values.email,
          password: values.password ?? "",
          role: values.role
        });

        reset({
          role: Role.CAJERO,
          name: "",
          email: "",
          password: ""
        });
        toast.success("Usuario creado correctamente.");
        onSaved?.(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No fue posible guardar el usuario.");
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2.5">
        <label className="text-sm font-medium text-gray-600">Nombre completo</label>
        <Input
          {...register("name")}
          placeholder="Juan Perez"
          className="h-12 rounded-xl border border-transparent bg-gray-100 px-4 text-gray-900 placeholder:text-gray-400 focus-visible:border-emerald-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-100"
        />
        {errors.name ? <p className="text-xs text-red-500">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2.5">
        <label className="text-sm font-medium text-gray-600">Correo corporativo</label>
        <Input
          {...register("email")}
          type="email"
          placeholder="usuario@repuestospro.com"
          className="h-12 rounded-xl border border-transparent bg-gray-100 px-4 text-gray-900 placeholder:text-gray-400 focus-visible:border-emerald-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-100"
        />
        {errors.email ? <p className="text-xs text-red-500">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2.5">
        <label className="text-sm font-medium text-gray-600">
          {mode === "edit" ? "Nueva contrasena" : "Contrasena temporal"}
        </label>
        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder={mode === "edit" ? "Dejar vacio para conservar la actual" : "Minimo 6 caracteres"}
            className="h-12 rounded-xl border border-transparent bg-gray-100 px-4 pr-11 text-gray-900 placeholder:text-gray-400 focus-visible:border-emerald-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-100"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password ? <p className="text-xs text-red-500">{errors.password.message}</p> : null}
      </div>

      <div className="space-y-2.5">
        <label className="text-sm font-medium text-gray-600">Rol de acceso</label>
        <select
          {...register("role")}
          className="flex h-12 w-full rounded-xl border border-transparent bg-gray-100 px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        >
          <option value={Role.CAJERO}>CAJERO</option>
          <option value={Role.BODEGUERO}>BODEGUERO</option>
          <option value={Role.ADMIN}>ADMIN</option>
        </select>
      </div>

      {mode === "edit" && canManagePermissions ? (
        <section className="space-y-4 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Control de Acceso
            </h3>
            <p className="text-sm text-slate-600">
              Solo un administrador puede conceder o denegar acceso a cada modulo.
            </p>
          </div>

          <div className="grid gap-3">
            {moduleAccessKeys.map((key) => {
              const config = moduleAccessConfig[key];
              const isEnabled = Boolean(watchedModuleAccess?.[key]);
              const Icon = moduleIcons[key];

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-4 ring-1 ring-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{config.label}</p>
                      <p className="text-sm leading-5 text-slate-500">{config.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
                      isEnabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    onClick={() => {
                      setValue(`moduleAccess.${key}`, !isEnabled, {
                        shouldDirty: true,
                        shouldTouch: true
                      });
                    }}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-end">
        {mode === "edit" ? (
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting || isPending}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        ) : null}
        <Button
          className={
            mode === "create"
              ? "h-12 w-full rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              : "h-12 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          }
          type="submit"
          disabled={isSubmitting || isPending}
        >
          {isSubmitting || isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "edit" ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}

const moduleIcons = {
  dashboard: LayoutDashboard,
  inventory: Boxes,
  sales: CreditCard,
  cash: Wallet,
  users: Users,
  taxonomy: ShieldCheck
} as const;
